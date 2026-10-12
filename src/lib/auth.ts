// Server-side authorization helpers.
// The proxy (middleware) only checks that a session cookie exists; these
// helpers are the real, server-side check run inside every protected page
// and server action. Never rely on hiding buttons in the UI.
import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { Role } from "./constants";

export interface SessionUser {
  userId: number;
  username: string;
  role: Role;
}

// Requires a logged-in user whose role is in `roles`.
// Not logged in  -> redirect to /login
// Wrong role     -> redirect to /forbidden (403 page)
// Works in pages and server actions (redirect() throws a control-flow error).
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await getSession();

  if (!session.userId || !session.role) {
    redirect("/login");
  }

  if (!roles.includes(session.role as Role)) {
    redirect("/forbidden");
  }

  return {
    userId: session.userId,
    username: session.username ?? "unknown",
    role: session.role as Role,
  };
}

// Returns the logged-in user, or null if there is no valid session (no redirect).
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session.userId || !session.role) return null;
  return {
    userId: session.userId,
    username: session.username ?? "unknown",
    role: session.role as Role,
  };
}
