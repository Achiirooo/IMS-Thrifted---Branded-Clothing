// Next.js 16 renamed middleware.ts to proxy.ts (same idea: code that runs
// before a request is completed). This is only an optimistic check — the
// real role check happens server-side in src/lib/auth.ts (requireRole).
import { getIronSession } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";
import { sessionOptions, type SessionData } from "@/lib/session";

// Pages that may be opened without logging in.
const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // `res` collects any cookie changes; we only read the session here.
  const res = new NextResponse();
  const session = await getIronSession<SessionData>(request, res, sessionOptions);

  // Not logged in and heading to a protected page -> send to login.
  if (!session.userId && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in and opening the login page -> go to the dashboard.
  if (session.userId && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
