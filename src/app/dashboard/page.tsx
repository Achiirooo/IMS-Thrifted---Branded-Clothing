import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { AppShell } from "@/components/app-shell";
import { StatCards } from "@/components/inventory/stat-cards";
import { RoleBadge } from "@/components/ui/badge";
import {
  ArrowRightIcon,
  BagIcon,
  ChartIcon,
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
    {
      href: "/sales",
      label: "Sales & checkout",
      description: "Sell items that are In Stock",
      icon: BagIcon,
    },
  ],
  REVIEWER: [
    {
      href: "/pending-queue",
      label: "Pending queue",
      description: "Items waiting for a decision",
      icon: ClockIcon,
    },
  ],
  ADMIN: [
    {
      href: "/items",
      label: "Inventory search",
      description: "Search and monitor all items",
      icon: GridIcon,
    },
    {
      href: "/reports",
      label: "Status reports",
      description: "Totals, rejection reasons, and history",
      icon: ChartIcon,
    },
  ],
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // Proxy already blocks anonymous users, but check again on the server.
  if (!user) redirect("/login");

  const isReviewer = user.role === "REVIEWER";
  const isAdmin = user.role === "ADMIN";

  const pendingCount = isReviewer
    ? await prisma.item.count({ where: { status: "Pending" } })
    : 0;

  let adminStats: {
    inStock: number;
    pending: number;
    sold: number;
    revenue: number;
  } | null = null;
  let lowStock: { category: string; count: number }[] = [];

  if (isAdmin) {
    const [grouped, inStockByCategory, categories] = await Promise.all([
      prisma.item.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { price: true },
      }),
      prisma.item.groupBy({
        by: ["category"],
        where: { status: "In Stock" },
        _count: { _all: true },
      }),
      prisma.item.findMany({
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" },
      }),
    ]);

    const countFor = (status: string) =>
      grouped.find((row) => row.status === status)?._count._all ?? 0;

    adminStats = {
      inStock: countFor("In Stock"),
      pending: countFor("Pending"),
      sold: countFor("Sold"),
      revenue: grouped.find((row) => row.status === "Sold")?._sum.price ?? 0,
    };

    const inStockCounts = new Map(
      inStockByCategory.map((row) => [row.category, row._count._all]),
    );
    lowStock = categories
      .map((row) => ({
        category: row.category,
        count: inStockCounts.get(row.category) ?? 0,
      }))
      .filter((row) => row.count <= LOW_STOCK_THRESHOLD)
      .sort(
        (a, b) => a.count - b.count || a.category.localeCompare(b.category),
      );
  }

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

          {isReviewer && (
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

      {adminStats && (
        <div className="mt-3.5">
          <StatCards
            inStock={adminStats.inStock}
            pending={adminStats.pending}
            sold={adminStats.sold}
            revenue={adminStats.revenue}
          />
        </div>
      )}

      {isAdmin && (
        <section className="card mt-3.5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="label-caps">Low stock alerts</p>
              <p className="mt-1 text-[11.5px] text-muted">
                Categories with {LOW_STOCK_THRESHOLD} or fewer In Stock items
              </p>
            </div>
            <span className="rounded-full bg-warn-soft px-2.5 py-1 text-[11px] font-semibold text-warn">
              {lowStock.length} categor{lowStock.length === 1 ? "y" : "ies"}
            </span>
          </div>

          {lowStock.length === 0 ? (
            <p className="mt-4 rounded-xl border border-good/25 bg-good-soft px-4 py-3 text-[12.5px] text-good">
              All categories are above the low-stock threshold.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {lowStock.map((row) => (
                <li
                  key={row.category}
                  className="flex items-center justify-between rounded-xl border border-warn/25 bg-warn-soft px-3.5 py-2.5"
                >
                  <span className="text-[12.5px] text-ink">{row.category}</span>
                  <span className="text-[11.5px] font-semibold text-warn">
                    {row.count} in stock
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

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
