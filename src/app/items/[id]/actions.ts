"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { reviewItem as reviewItemRecord } from "@/lib/services/items";

export interface ReviewState {
  error?: string;
}

export async function reviewItem(
  _prevState: ReviewState | null,
  formData: FormData,
): Promise<ReviewState> {
  // The real guard: STAFF, ADMIN and anonymous callers are redirected, even
  // on a direct POST. Never rely on the panel being hidden in the UI.
  const user = await requireRole("REVIEWER");

  const result = await reviewItemRecord(
    {
      itemId: formData.get("itemId"),
      decision: formData.get("decision"),
      reason: formData.get("reason") ?? undefined,
    },
    user.userId,
  );

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/items");
  revalidatePath("/pending-queue");
  revalidatePath(`/items/${result.itemId}`);
  redirect(`/items/${result.itemId}?reviewed=${result.decision.toLowerCase()}`);
}
