"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createItem as createItemRecord } from "@/lib/services/items";

export interface CreateItemState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createItem(
  _prevState: CreateItemState | null,
  formData: FormData,
): Promise<CreateItemState> {
  // Only STAFF may add items. This is the server-side check; hiding the
  // link on the dashboard is not enough.
  const user = await requireRole("STAFF");

  const result = await createItemRecord(
    {
      name: formData.get("name"),
      brand: formData.get("brand"),
      category: formData.get("category"),
      size: formData.get("size"),
      condition: formData.get("condition"),
      price: formData.get("price"),
    },
    user.userId,
  );

  if (!result.ok) {
    return { fieldErrors: result.fieldErrors };
  }

  // Success: land on the list page with a confirmation banner.
  redirect(`/items?created=${result.item.id}`);
}
