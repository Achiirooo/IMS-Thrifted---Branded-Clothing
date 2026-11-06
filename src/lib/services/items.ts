// Item workflows shared by the UI (server actions) and the REST API used by
// the Postman/Newman collections. Keeping the rules here means the screen and
// the API can never disagree about status transitions or error messages.
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isReviewDecision } from "@/lib/item-status";

export type FieldErrors = Record<string, string[]>;

// ---------------------------------------------------------------------------
// Create item (UC-02 / IMS-03, IMS-04)
// ---------------------------------------------------------------------------

// Numbers arrive as strings from FormData, so coerce turns them into numbers
// before checking.
export const itemInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  brand: z.string().trim().min(1, "Brand is required"),
  category: z.string().trim().min(1, "Category is required"),
  size: z.string().trim().min(1, "Size is required"),
  condition: z.string().trim().min(1, "Condition is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  imageUrl: z.string().trim().optional().or(z.literal("")),
});

export type ItemInput = z.infer<typeof itemInputSchema>;

export type CreateItemResult =
  | { ok: true; item: { id: number; name: string; status: string } }
  | { ok: false; fieldErrors: FieldErrors };

export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

export async function createItem(
  input: unknown,
  userId: number,
): Promise<CreateItemResult> {
  const parsed = itemInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  // Every new item starts Pending; the first status log is written in the
  // same transaction so an item can never exist without its history.
  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl || null,
        status: "Pending",
        createdById: userId,
      },
    });

    await tx.statusLog.create({
      data: {
        itemId: created.id,
        oldStatus: null, // no previous status — the item is brand new
        newStatus: "Pending",
        changedById: userId,
        reason: "Item submitted",
      },
    });

    return created;
  });

  return { ok: true, item: { id: item.id, name: item.name, status: item.status } };
}

// ---------------------------------------------------------------------------
// Review item (UC-05 / IMS-05, IMS-06, IMS-07, IMS-08)
// ---------------------------------------------------------------------------

export const reviewInputSchema = z
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

export type ReviewFailureReason = "invalid" | "not_found" | "conflict";

export type ReviewResult =
  | { ok: true; itemId: number; decision: "approve" | "reject"; status: string }
  | {
      ok: false;
      reason: ReviewFailureReason;
      error: string;
      fieldErrors?: FieldErrors;
    };

export async function reviewItem(
  input: unknown,
  userId: number,
): Promise<ReviewResult> {
  const parsed = reviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      error: parsed.error.issues[0]?.message ?? "Could not review this item.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const { itemId, reason } = parsed.data;
  const decision = parsed.data.decision;
  if (!isReviewDecision(decision)) {
    return { ok: false, reason: "invalid", error: "Choose approve or reject." };
  }

  const current = await prisma.item.findUnique({
    where: { id: itemId },
    select: { status: true },
  });

  if (!current) {
    return {
      ok: false,
      reason: "not_found",
      error: "That item no longer exists.",
    };
  }

  // Only a Pending item can be reviewed. A rejection is not a status move
  // (Pending -> Pending), so this is a guard rather than canTransition().
  if (current.status !== "Pending") {
    return {
      ok: false,
      reason: "conflict",
      error: `This item is already ${current.status.toLowerCase()}.`,
    };
  }

  // Approve -> In Stock; reject leaves the item Pending with the reason on it.
  const target = decision === "approve" ? "In Stock" : "Pending";

  // Status change + audit row are one unit. `status` in the where clause makes
  // a second reviewer's click a no-op instead of a double decision.
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
        changedById: userId,
        reason: decision === "reject" ? reason : null,
      },
    });

    return true;
  });

  if (!saved) {
    return {
      ok: false,
      reason: "conflict",
      error:
        "Someone else already reviewed this item. Reload to see the latest status.",
    };
  }

  return { ok: true, itemId, decision, status: target };
}

// ---------------------------------------------------------------------------
// Sell item (UC-07 / IMS-08, IMS-09)
// ---------------------------------------------------------------------------

export const saleInputSchema = z.object({
  itemId: z.coerce.number().int().positive(),
});

export type SaleResult =
  | { ok: true; itemId: number; status: "Sold" }
  | { ok: false; reason: "invalid" | "not_found" | "conflict"; error: string };

export async function sellItem(
  input: unknown,
  userId: number,
): Promise<SaleResult> {
  const parsed = saleInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid",
      error: "That item could not be found.",
    };
  }

  const itemId = parsed.data.itemId;
  const current = await prisma.item.findUnique({
    where: { id: itemId },
    select: { status: true },
  });

  if (!current) {
    return {
      ok: false,
      reason: "not_found",
      error: "That item no longer exists.",
    };
  }

  // Status Guard Rule: Pending and Sold items are blocked from sale.
  if (current.status !== "In Stock") {
    return {
      ok: false,
      reason: "conflict",
      error: `Only In Stock items can be sold. This item is ${current.status}.`,
    };
  }

  // `status` in the where clause makes a double sale a no-op.
  const saved = await prisma.$transaction(async (tx) => {
    const updated = await tx.item.updateMany({
      where: { id: itemId, status: "In Stock" },
      data: { status: "Sold" },
    });

    if (updated.count === 0) return false;

    await tx.statusLog.create({
      data: {
        itemId,
        oldStatus: "In Stock",
        newStatus: "Sold",
        changedById: userId,
        reason: null,
      },
    });

    return true;
  });

  if (!saved) {
    return {
      ok: false,
      reason: "conflict",
      error:
        "Someone else already sold this item. Reload to see the latest status.",
    };
  }

  return { ok: true, itemId, status: "Sold" };
}

// ---------------------------------------------------------------------------
// Queries used by the API (and reusable by pages)
// ---------------------------------------------------------------------------

export async function findItemForApi(itemId: number) {
  return prisma.item.findUnique({
    where: { id: itemId },
    include: {
      createdBy: { select: { id: true, username: true, displayName: true } },
      statusLogs: {
        orderBy: { changedAt: "desc" },
        include: {
          changedBy: { select: { username: true, displayName: true } },
        },
      },
    },
  });
}
