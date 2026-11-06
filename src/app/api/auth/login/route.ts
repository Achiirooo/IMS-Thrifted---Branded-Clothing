import { apiError, json, readJsonBody } from "@/lib/api";
import { getSession } from "@/lib/session";
import { loginWithPassword } from "@/lib/services/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/login  { username, password }
export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;

  const result = await loginWithPassword(parsed.body);
  if (!result.ok) {
    return apiError(401, result.error);
  }

  const session = await getSession();
  session.userId = result.user.id;
  session.username = result.user.username;
  session.displayName = result.user.displayName;
  session.role = result.user.role;
  await session.save();

  return json({ user: result.user });
}
