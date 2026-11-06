import type { NextRequest } from "next/server";
import {
  apiError,
  json,
  numberParam,
  positiveIntParam,
  readJsonBody,
  requireApiUser,
} from "@/lib/api";
import { createItem } from "@/lib/services/items";
import { searchItems } from "@/lib/services/queries";

export const dynamic = "force-dynamic";

// GET /api/items?q=&status=&size=&condition=&min=&max=&sort=&page=&pageSize=
// STAFF see only their own items; ADMIN sees the whole inventory.
export async function GET(request: NextRequest) {
  const guard = await requireApiUser("STAFF", "ADMIN");
  if (guard.response) return guard.response;

  const params = request.nextUrl.searchParams;

  const result = await searchItems(
    {
      q: params.get("q") ?? undefined,
      status: params.get("status") ?? undefined,
      size: params.get("size") ?? undefined,
      condition: params.get("condition") ?? undefined,
      min: numberParam(params.get("min")),
      max: numberParam(params.get("max")),
      sort: params.get("sort") ?? undefined,
      page: positiveIntParam(params.get("page")),
      pageSize: positiveIntParam(params.get("pageSize")),
    },
    guard.user,
  );

  return json(result);
}

// POST /api/items — STAFF only. Every new item starts as Pending.
export async function POST(request: Request) {
  const guard = await requireApiUser("STAFF");
  if (guard.response) return guard.response;

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;

  const result = await createItem(parsed.body, guard.user.userId);
  if (!result.ok) {
    const firstError =
      Object.values(result.fieldErrors).flat()[0] ??
      "Could not save this item.";
    return apiError(400, firstError, { fieldErrors: result.fieldErrors });
  }

  return json({ item: result.item }, { status: 201 });
}
