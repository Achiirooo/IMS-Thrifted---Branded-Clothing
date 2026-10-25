"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isReviewDecision } from "@/lib/item-status";

export interface ReviewState {
  error?: string;
}

// FormData arrivals are strings, so itemId is coerced. The decision is
// checked with isReviewDecision() instead of z.enum so the allowed values
// stay defined in exactly one module.
const reviewSchema = z
  .object({
    itemId: z.coerce.number().int().positive(),
    decision: z.string(),
    reason: z
      .string()
      .trim()
      .max(280, "Keep the reason under 280 characters")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!isReviewDecision(value.decision)) {
      ctx.addIssue({
        code: "custom",
        path: ["decision"],
        message: "Choose approve or reject.",
      });
      return;
    }
    // Rejecting without a reason is not allowed; approving may be silent.
    if (value.decision === "reject" && !value.reason) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Give a reason for rejecting this item.",
      });
    }
  });

export async function reviewItem(
  _prevState: ReviewState | null,
  formData: FormData,
): Promise<ReviewState> {
  // The real guard: STAFF and anonymous callers are redirected, even on a
  // direct POST. Never rely on the panel being hidden in the UI.
  const user = await requireRole("REVIEWER", "ADMIN");

  const parsed = reviewSchema.safeParse({
    itemId: formData.get("itemId"),
    decision: formData.get("decision"),
    reason: formData.get("reason") ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Could not review this item.",
    };
  }

  const { itemId, reason } = parsed.data;
  const decision = parsed.data.decision;
  if (!isReviewDecision(decision)) {
    return { error: "Choose approve or reject." };
  }

  const current = await prisma.item.findUnique({
    where: { id: itemId },
    select: { status: true },
  });

  if (!current) {
    return { error: "That item no longer exists." };
  }

  // Only a Pending item can be reviewed. A rejection is not a status move
  // (Pending -> Pending), so this is a guard rather than canTransition().
  if (current.status !== "Pending") {
    return { error: `This item is already ${current.status.toLowerCase()}.` };
  }

  // Approve -> In Stock; reject leaves the item Pending with the reason on it.
  const target = decision === "approve" ? "In Stock" : "Pending";

  // Status change + audit row are one unit: either both land or neither does.
  // `status` in the where clause makes a second reviewer's click a no-op.
  const saved = await prisma.$transaction(async (tx) => {
    const updated = await tx.item.updateMany({
      where: { id: itemId, status: "Pending" },
      data: {
        status: target,
        // Only a rejection carries a reason; approving clears any earlier one.
        rejectionReason: decision === "reject" ? reason : null,
      },
    });

    if (updated.count === 0) return false;

    await tx.statusLog.create({
      data: {
        itemId,
        oldStatus: "Pending",
        newStatus: target,
        changedById: user.userId,
        reason: decision === "reject" ? reason : null,
      },
    });

    return true;
  });

  if (!saved) {
    return {
      error:
        "Someone else already reviewed this item. Reload to see the latest status.",
    };
  }

  revalidatePath("/items");
  revalidatePath("/pending-queue");
  revalidatePath(`/items/${itemId}`);
  redirect(`/items/${itemId}?reviewed=${decision.toLowerCase()}`);
}
