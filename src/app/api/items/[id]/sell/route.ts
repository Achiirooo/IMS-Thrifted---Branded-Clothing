import { apiError, json, parseItemId, requireApiUser } from "@/lib/api";
import { sellItem } from "@/lib/services/items";

export const dynamic = "force-dynamic";

// POST /api/items/:id/sell — STAFF only, In Stock items only.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser("STAFF");
  if (guard.response) return guard.response;

  const { id } = await params;
  const itemId = parseItemId(id);
  if (itemId === null) {
    return apiError(404, "That item no longer exists.");
  }

  const result = await sellItem({ itemId }, guard.user.userId);

  if (!result.ok) {
    const status =
      result.reason === "not_found"
        ? 404
        : result.reason === "conflict"
          ? 409
          : 400;
    return apiError(status, result.error);
  }

  return json({ itemId: result.itemId, status: result.status });
}
