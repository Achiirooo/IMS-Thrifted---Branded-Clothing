"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { sellItem as sellItemRecord } from "@/lib/services/items";

export interface SaleState {
  error?: string;
}

// UC-07 / IMS-09: only Staff sell, and only an In Stock item can be sold.
// The status change and the audit row are written in one transaction.
export async function sellItem(
  _prevState: SaleState | null,
  formData: FormData,
): Promise<SaleState> {
  const user = await requireRole("STAFF");

  const result = await sellItemRecord(
    { itemId: formData.get("itemId") },
    user.userId,
  );

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/sales");
  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath(`/items/${result.itemId}`);
  redirect(`/sales?sold=${result.itemId}`);
}
