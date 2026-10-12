"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Server-side validation. Numbers arrive as strings from the form,
// so coerce turns them into actual numbers before checking.
const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  brand: z.string().trim().min(1, "Brand is required"),
  category: z.string().trim().min(1, "Category is required"),
  size: z.string().trim().min(1, "Size is required"),
  condition: z.string().trim().min(1, "Condition is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
});

export interface CreateItemState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createItem(
  _prevState: CreateItemState | null,
  formData: FormData,
): Promise<CreateItemState> {
  // Only STAFF and ADMIN may add items. This is the server-side check;
  // hiding the link on the dashboard is not enough.
  const user = await requireRole("STAFF", "ADMIN");

  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    category: formData.get("category"),
    size: formData.get("size"),
    condition: formData.get("condition"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    // Group zod messages by field so the form can show them inline.
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { fieldErrors };
  }

  // Create the item AND its first status log together — either both
  // succeed or neither does.
  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.item.create({
      data: {
        ...parsed.data,
        status: "Pending", // every new item starts as Pending (Week 9: review)
        createdById: user.userId,
      },
    });

    await tx.statusLog.create({
      data: {
        itemId: created.id,
        oldStatus: null, // no previous status — the item is brand new
        newStatus: "Pending",
        changedById: user.userId,
        reason: "Item submitted",
      },
    });

    return created;
  });

  // Success: land on the list page with a confirmation banner.
  redirect(`/items?created=${item.id}`);
}
