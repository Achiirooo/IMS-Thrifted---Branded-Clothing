import { json } from "@/lib/api";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/auth/logout
export async function POST() {
  const session = await getSession();
  session.destroy();
  return json({ ok: true });
}
