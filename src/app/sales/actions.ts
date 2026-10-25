"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface SaleState {
  error?: string;
}

const saleSchema = z.object({
  itemId: z.coerce.number().int().positive(),
});

// UC-07 / IMS-09: only Staff sell, and only an In Stock item can be sold.
// The status change and the audit row are written in one transaction.
export async function sellItem(
  _prevState: SaleState | null,
  formData: FormData,
): Promise<SaleState> {
  const user = await requireRole("STAFF");

  const parsed = saleSchema.safeParse({ itemId: formData.get("itemId") });
  if (!parsed.success) {
    return { error: "That item could not be found." };
  }

  const itemId = parsed.data.itemId;
  const current = await prisma.item.findUnique({
    where: { id: itemId },
    select: { status: true },
  });

  if (!current) {
    return { error: "That item no longer exists." };
  }

  // Status Guard Rule: Pending and Sold items are blocked from sale.
  if (current.status !== "In Stock") {
    return {
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
        changedById: user.userId,
        reason: null,
      },
    });

    return true;
  });

  if (!saved) {
    return {
      error:
        "Someone else already sold this item. Reload to see the latest status.",
    };
  }

  revalidatePath("/sales");
  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath(`/items/${itemId}`);
  redirect(`/sales?sold=${itemId}`);
}
