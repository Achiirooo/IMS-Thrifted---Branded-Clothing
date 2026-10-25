import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { RoleBadge } from "@/components/ui/badge";
import {
  ArrowRightIcon,
  ClockIcon,
  GridIcon,
  PlusIcon,
} from "@/components/icons";

// Each role only sees the actions it is allowed to use.
// The pages themselves re-check the role on the server (requireRole).
const LINKS: Record<
  string,
  { href: string; label: string; description: string; icon: typeof GridIcon }[]
> = {
  STAFF: [
    {
      href: "/items/new",
      label: "Add new item",
      description: "Submit a garment for review",
      icon: PlusIcon,
    },
    {
      href: "/items",
      label: "My items",
      description: "Everything you have submitted",
      icon: GridIcon,
    },
  ],
  REVIEWER: [
    {
      href: "/pending-queue",
      label: "Pending queue",
      description: "Items waiting for a decision",
      icon: ClockIcon,
    },
    {
      href: "/items",
      label: "View all items",
      description: "Browse the full inventory",
      icon: GridIcon,
    },
  ],
  ADMIN: [
    {
      href: "/items/new",
      label: "Add new item",
      description: "Submit a garment for review",
      icon: PlusIcon,
    },
    {
      href: "/pending-queue",
      label: "Pending queue",
      description: "Items waiting for a decision",
      icon: ClockIcon,
    },
    {
      href: "/items",
      label: "View all items",
      description: "Browse the full inventory",
      icon: GridIcon,
    },
  ],
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // Proxy already blocks anonymous users, but check again on the server.
  if (!user) redirect("/login");

  const pendingCount =
    user.role === "STAFF"
      ? 0
      : await prisma.item.count({ where: { status: "Pending" } });

  return (
    <AppShell
      user={user}
      title="Dashboard"
      subtitle="Your workspace at a glance"
    >
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-7 sm:px-8">
          <div>
            <p className="label-caps">Signed in as</p>
            <h2 className="mt-2 font-display text-[28px] leading-tight text-ink">
              Welcome back, {user.displayName}
            </h2>
            <div className="mt-2.5 flex items-center gap-2">
              <RoleBadge role={user.role} />
              <span className="text-[11.5px] text-muted">@{user.username}</span>
            </div>
          </div>

          {user.role !== "STAFF" && (
            <div className="rounded-xl border border-line bg-panel/50 px-5 py-4 text-center">
              <p className="label-caps">Pending review</p>
              <p className="mt-1.5 font-display text-[30px] leading-none text-brand-dark">
                {pendingCount}
              </p>
              <Link
                href="/pending-queue"
                className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-ink"
              >
                Open queue
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS[user.role].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card group flex items-start gap-3.5 p-5 transition hover:border-brand/40 hover:bg-panel-hover/50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <link.icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                {link.label}
                <ArrowRightIcon className="h-3.5 w-3.5 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </span>
              <span className="mt-1 block text-[12px] text-muted">
                {link.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
