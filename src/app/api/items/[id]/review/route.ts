import {
  apiError,
  json,
  parseItemId,
  readJsonBody,
  requireApiUser,
} from "@/lib/api";
import { reviewItem } from "@/lib/services/items";

export const dynamic = "force-dynamic";

// POST /api/items/:id/review  { decision: "approve" | "reject", reason? }
// Approve -> In Stock. Reject -> stays Pending and stores the reason.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser("REVIEWER");
  if (guard.response) return guard.response;

  const { id } = await params;
  const itemId = parseItemId(id);
  if (itemId === null) {
    return apiError(404, "That item no longer exists.");
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;

  const body = parsed.body as Record<string, unknown> | null;
  const result = await reviewItem(
    {
      itemId,
      decision: body?.decision,
      reason: body?.reason,
    },
    guard.user.userId,
  );

  if (!result.ok) {
    const status =
      result.reason === "not_found"
        ? 404
        : result.reason === "conflict"
          ? 409
          : 400;
    return apiError(status, result.error, {
      ...(result.fieldErrors ? { fieldErrors: result.fieldErrors } : {}),
    });
  }

  return json({
    itemId: result.itemId,
    decision: result.decision,
    status: result.status,
  });
}
