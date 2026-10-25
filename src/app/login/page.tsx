import { prisma } from "@/lib/db";
import type { Role } from "@/lib/constants";
import { Brand } from "@/components/brand";
import { LoginForm, type DemoAccount } from "./login-form";

// Seeded demo accounts (see prisma/seed.ts). These are development-only
// credentials, already documented in the README.
const DEMO_PASSWORDS: Record<string, string> = {
  staff1: "staff123",
  reviewer1: "reviewer123",
  admin1: "admin123",
};

function Decorations() {
  return (
    <div className="relative h-[540px] w-full" aria-hidden="true">
      <svg
        viewBox="0 0 140 40"
        className="absolute left-4 top-24 w-32 text-[#c9b79c]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      >
        <path d="M2 20c9-15 18-15 27 0s18 15 27 0 18-15 27 0 18 15 27 0" />
      </svg>

      <span className="absolute left-4 top-[236px] h-3 w-3 rounded-full border border-[#c9b79c]" />
      <span className="absolute left-4 top-[332px] h-1.5 w-1.5 rounded-full bg-[#cbb99e]" />
      <span className="absolute left-3 top-[402px] h-1.5 w-1.5 rounded-full bg-[#cbb99e]" />

      <span className="absolute left-[26%] top-[300px] h-6 w-6 rounded-full border border-[#d6c5aa]" />

      <div className="absolute left-2 top-[452px] h-24 w-28 -rotate-6 rounded-lg border border-[#c9b79c] bg-[#fbf4e7]/60 p-3">
        <span className="block h-px w-full bg-[#c9b79c]" />
        <span className="mt-2 block h-px w-3/4 bg-[#d6c5aa]" />
        <span className="mt-2 block h-px w-1/2 bg-[#d6c5aa]" />
      </div>

      <div
        className="absolute -left-6 top-[560px] h-36 w-32 rounded-xl"
        style={{
          backgroundImage: "radial-gradient(#d8c3a3 2px, transparent 2px)",
          backgroundSize: "18px 18px",
        }}
      />
    </div>
  );
}

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
    <div className="flex min-h-screen flex-col">
      <div className="px-6 pt-6 sm:px-10">
        <Brand href="/login" />
      </div>

      <div className="mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-8 px-6 py-8 lg:grid-cols-[1fr_500px] lg:gap-12 lg:py-4">
        <div className="hidden lg:block">
          <Decorations />
        </div>

        <div className="w-full">
          <div className="text-center">
            <h1 className="font-display text-[34px] leading-tight text-ink sm:text-[38px]">
              Welcome to Login!
            </h1>
            <p className="mt-2 text-[13.5px] text-muted">
              Enter your credentials to access the workspace
            </p>
          </div>

          <div className="card mt-6 p-5 shadow-[0_18px_40px_-28px_rgba(80,50,20,0.45)] sm:p-6">
            <LoginForm demo={demo} />
          </div>
        </div>
      </div>

      <footer className="px-6 pb-6 text-center text-[11.5px] text-muted">
        Thrifted &amp; Branded Surplus Clothing · Inventory Management System · 2026
      </footer>
    </div>
  );
}
