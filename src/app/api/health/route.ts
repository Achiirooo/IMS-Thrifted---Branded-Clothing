import { prisma } from "@/lib/db";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

// Smoke-test gate: confirms the app is up and the test database answers.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({ ok: true, status: "ok", database: "up" });
  } catch {
    return json(
      { ok: false, status: "error", database: "down" },
      { status: 503 },
    );
  }
}
