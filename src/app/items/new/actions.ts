"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createItem as createItemRecord } from "@/lib/services/items";
import { writeFile } from "fs/promises";
import { join } from "path";

export interface CreateItemState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createItem(
  _prevState: CreateItemState | null,
  formData: FormData,
): Promise<CreateItemState> {
  const user = await requireRole("STAFF");

  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = imageFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    await writeFile(join(uploadDir, fileName), buffer);
    imageUrl = `/uploads/${fileName}`;
  }

  const result = await createItemRecord(
    {
      name: formData.get("name"),
      brand: formData.get("brand"),
      category: formData.get("category"),
      size: formData.get("size"),
      condition: formData.get("condition"),
      price: formData.get("price"),
      imageUrl,
    },
    user.userId,
  );

  if (!result.ok) {
    return { fieldErrors: result.fieldErrors };
  }

  redirect(`/items?created=${result.item.id}`);
}
