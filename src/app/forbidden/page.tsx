import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ShieldIcon } from "@/components/icons";

// Shown when requireRole() redirects a logged-in user with the wrong role.
export default async function ForbiddenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      user={user}
      title="Not allowed"
      subtitle="Your account does not have access to that page"
    >
      <div className="card mx-auto max-w-lg px-8 py-12 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-danger-soft text-danger">
          <ShieldIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-display text-[24px] text-ink">403 — Not allowed</h2>
        <p className="mt-2 text-[13px] text-muted">
          You are signed in as <strong className="text-ink">{user.displayName}</strong>{" "}
          ({user.role}). Role-based access control blocked this request.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6">
          Back to dashboard
        </Link>
      </div>
    </AppShell>
  );
}
