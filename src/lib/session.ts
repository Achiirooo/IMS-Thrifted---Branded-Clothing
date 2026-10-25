// iron-session setup: the session lives in an encrypted, HTTP-only cookie.
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: number;
  username?: string;
  // Friendly name for the UI; falls back to `username` for older cookies.
  displayName?: string;
  role?: string;
}

export const sessionOptions: SessionOptions = {
  // Must be at least 32 characters. Set a real secret in .env for production.
  password:
    process.env.SESSION_SECRET ?? "dev_only_secret_change_me_0123456789abcdef",
  cookieName: "ims-session",
  cookieOptions: {
    // Cookies are only "Secure" over HTTPS, so keep this off in local dev.
    secure: process.env.NODE_ENV === "production",
  },
};

// Helper used by pages and server actions (Node.js runtime only).
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
