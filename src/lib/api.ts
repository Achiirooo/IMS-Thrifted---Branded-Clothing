// Helpers for the REST endpoints under /api. The pages use redirects for
// unauthorised access; APIs must answer with status codes instead so the
// Postman collection can assert on them.
import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import type { Role } from "@/lib/constants";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(
  status: number,
  error: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error, ...extra }, { status });
}

export type ApiGuard =
  | { user: SessionUser; response?: never }
  | { user?: never; response: NextResponse };

// 401 when there is no valid session, 403 when the role is not allowed.
export async function requireApiUser(...roles: Role[]): Promise<ApiGuard> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: apiError(401, "You must be signed in.") };
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return {
      response: apiError(
        403,
        "Your role is not allowed to perform this action.",
      ),
    };
  }
  return { user };
}

export async function readJsonBody(request: Request): Promise<
  { ok: true; body: unknown } | { ok: false; response: NextResponse }
> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return {
      ok: false,
      response: apiError(400, "Send a valid JSON body."),
    };
  }
}

// Parses the :id route segment; anything non-numeric is treated as not found.
export function parseItemId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Query strings arrive as text, so numbers are parsed here instead of zod.
export function numberParam(
  value: string | null,
  options: { integer?: boolean } = {},
): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return options.integer ? Math.floor(parsed) : parsed;
}

export function positiveIntParam(value: string | null): number | undefined {
  const parsed = numberParam(value, { integer: true });
  return parsed !== undefined && parsed > 0 ? parsed : undefined;
}
