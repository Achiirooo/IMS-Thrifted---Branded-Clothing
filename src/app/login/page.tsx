import { prisma } from "@/lib/db";
import type { Role } from "@/lib/constants";
import { Brand } from "@/components/brand";
import { LoginForm, type DemoAccount } from "./login-form";
import { Decorations } from "./decorations";

// Seeded demo accounts (see prisma/seed.ts). These are development-only
// credentials, already documented in the README.
const DEMO_PASSWORDS: Record<string, string> = {
  staff1: "staff123",
  reviewer1: "reviewer123",
  admin1: "admin123",
};

// Demo accounts are read from the database, so this page is rendered per request.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { username: true, displayName: true, role: true },
  });

  const demo: DemoAccount[] = users.map((user) => ({
    username: user.username,
    displayName: user.displayName ?? user.username,
    role: user.role as Role,
    password: DEMO_PASSWORDS[user.username] ?? "",
  }));

  return (
    <div className="relative min-h-screen flex-col">
      <Decorations />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <div className="px-6 pt-6 sm:px-10">
          <Brand href="/login" />
        </div>

        <div className="text-center max-w-[500px]">
          <h1 className="font-display text-[34px] leading-tight text-ink sm:text-[38px]">
            Welcome to Login!
          </h1>
          <p className="mt-2 text-[13.5px] text-muted">
            Enter your credentials to access the workspace
          </p>
        </div>

        <div className="card mt-8 p-5 shadow-[0_18px_40px_-28px_rgba(80,50,20,0.45)] sm:p-6">
          <LoginForm demo={demo} />
        </div>
      </div>

      <footer className="relative z-10 px-6 pb-6 text-center text-[11.5px] text-muted">
        Thrifted &amp; Branded Surplus Clothing · Inventory Management System · 2026
      </footer>
    </div>
  );
}
