import { apiError, json, parseItemId, requireApiUser } from "@/lib/api";
import { findItemForApi } from "@/lib/services/items";

export const dynamic = "force-dynamic";

// GET /api/items/:id — includes the status history for the logging checks.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser("STAFF", "REVIEWER", "ADMIN");
  if (guard.response) return guard.response;

  const { id } = await params;
  const itemId = parseItemId(id);
  if (itemId === null) {
    return apiError(404, "That item no longer exists.");
  }

  const item = await findItemForApi(itemId);
  if (!item) {
    return apiError(404, "That item no longer exists.");
  }

  // Same ownership rule as the detail page: STAFF only see their own items.
  if (guard.user.role === "STAFF" && item.createdById !== guard.user.userId) {
    return apiError(403, "Your role is not allowed to perform this action.");
  }

  return json({ item });
}
