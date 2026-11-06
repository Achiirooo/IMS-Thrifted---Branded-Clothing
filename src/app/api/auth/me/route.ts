import { json } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/auth/me — the session's user, or 401 when not signed in.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return json({ error: "You must be signed in." }, { status: 401 });
  }
  return json({ user });
}
