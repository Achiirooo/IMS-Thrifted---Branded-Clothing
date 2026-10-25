import Link from "next/link";
import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/constants";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon, InboxIcon, PlusIcon } from "@/components/icons";
import { StatCards } from "@/components/inventory/stat-cards";
import { InventoryToolbar } from "@/components/inventory/toolbar";

export type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZES = ["10", "25", "50"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asStatus(value: string | undefined): ItemStatus | undefined {
  return ITEM_STATUSES.find((status) => status === value);
}

function money(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

const CONDITION_DOT: Record<string, string> = {
  Excellent: "text-good",
  Good: "text-warn",
  Fair: "text-neutral",
};

export async function InventoryView({
  user,
  searchParams,
  mode = "all",
}: {
  user: SessionUser;
  searchParams: SearchParams;
  mode?: "all" | "pending";
}) {
  const fixedStatus: ItemStatus | undefined = mode === "pending" ? "Pending" : undefined;

  const q = (first(searchParams.q) ?? "").trim();
  const status = fixedStatus ?? asStatus(first(searchParams.status));
  const sort = first(searchParams.sort) ?? "newest";
  const pageSizeRaw = first(searchParams.pageSize) ?? "10";
  const pageSize = PAGE_SIZES.includes(pageSizeRaw) ? Number(pageSizeRaw) : 10;
  const pageParam = Number(first(searchParams.page) ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const size = first(searchParams.size)?.trim() || undefined;
  const condition = first(searchParams.condition)?.trim() || undefined;
  const min = Number(first(searchParams.min) ?? "");
  const max = Number(first(searchParams.max) ?? "");
  const hasPriceFilter =
    Number.isFinite(min) && min > 0 ? true : Number.isFinite(max) && max > 0;

  // What this user is allowed to see at all (STAFF: only their own items).
  const scope: Prisma.ItemWhereInput =
    user.role === "STAFF" ? { createdById: user.userId } : {};

  const where: Prisma.ItemWhereInput = { ...scope };
  if (status) where.status = status;
  if (size) where.size = size;
  if (condition) where.condition = condition;
  if (hasPriceFilter) {
    where.price = {
      ...(Number.isFinite(min) && min > 0 ? { gte: min } : {}),
      ...(Number.isFinite(max) && max > 0 ? { lte: max } : {}),
    };
  }
  if (q) {
    const codeMatch = /^itm-?(\d+)$/i.exec(q);
    where.OR = [
      { name: { contains: q } },
      { brand: { contains: q } },
      { category: { contains: q } },
      ...(codeMatch ? [{ id: Number(codeMatch[1]) }] : []),
    ];
  }

  const orderBy: Prisma.ItemOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "price-desc"
        ? { price: "desc" }
        : sort === "price-asc"
          ? { price: "asc" }
          : sort === "brand"
            ? { brand: "asc" }
            : { createdAt: "desc" };

  const [items, total, grouped, sizeRows, conditionRows] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { createdBy: { select: { username: true, displayName: true } } },
    }),
    prisma.item.count({ where }),
    prisma.item.groupBy({
      by: ["status"],
      where: scope,
      _count: { _all: true },
      _sum: { price: true },
    }),
    prisma.item.findMany({
      where: scope,
      distinct: ["size"],
      select: { size: true },
      orderBy: { size: "asc" },
    }),
    prisma.item.findMany({
      where: scope,
      distinct: ["condition"],
      select: { condition: true },
      orderBy: { condition: "asc" },
    }),
  ]);

  const countFor = (value: string) =>
    grouped.find((row) => row.status === value)?._count._all ?? 0;
  const revenue = grouped.find((row) => row.status === "Sold")?._sum.price ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const created = first(searchParams.created);
  const canAdd = user.role === "STAFF";
  const filtered = Boolean(q || status || size || condition || hasPriceFilter);

  function hrefFor(next: { page?: number }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (size) params.set("size", size);
    if (condition) params.set("condition", condition);
    if (Number.isFinite(min) && min > 0) params.set("min", String(min));
    if (Number.isFinite(max) && max > 0) params.set("max", String(max));
    if (sort !== "newest") params.set("sort", sort);
    if (pageSize !== 10) params.set("pageSize", String(pageSize));
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    const base = mode === "pending" ? "/pending-queue" : "/items";
    return qs ? `${base}?${qs}` : base;
  }

  return (
    <AppShell
      user={user}
      title={mode === "pending" ? "Pending Queue" : "Inventory"}
      subtitle={
        mode === "pending"
          ? "Items waiting for review"
          : "All items across every status"
      }
      actions={
        canAdd && mode === "all" ? (
          <Link href="/items/new" className="btn-primary py-2.5 text-[12.5px]">
            <PlusIcon className="h-4 w-4" />
            Add item
          </Link>
        ) : null
      }
    >
      {mode === "all" && (
        <StatCards
          inStock={countFor("In Stock")}
          pending={countFor("Pending")}
          sold={countFor("Sold")}
          revenue={revenue}
        />
      )}

      {created && (
        <p className="mt-3.5 rounded-xl border border-good/25 bg-good-soft px-4 py-3 text-[12.5px] text-good">
          Item saved with status <strong>Pending</strong> and logged in the status
          history.
        </p>
      )}

      <div className="mt-3.5">
        <InventoryToolbar
          filters={{
            q,
            status,
            sort,
            pageSize: String(pageSize),
            size,
            condition,
            min: Number.isFinite(min) && min > 0 ? String(min) : undefined,
            max: Number.isFinite(max) && max > 0 ? String(max) : undefined,
          }}
          statuses={ITEM_STATUSES}
          sizes={sizeRows.map((row) => row.size)}
          conditions={conditionRows.map((row) => row.condition)}
          showAdvanced={user.role === "ADMIN"}
          fixedStatus={fixedStatus}
        />
      </div>

      <div className="card mt-3.5 overflow-hidden">
        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <InboxIcon className="mx-auto h-9 w-9 text-muted/60" />
            <p className="mt-3 font-display text-[19px] text-ink">No items found</p>
            <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-muted">
              {filtered
                ? "Nothing matches these filters. Try clearing them."
                : mode === "pending"
                  ? "Nothing is waiting for review right now."
                  : "Items appear here once they are added."}
            </p>
            {canAdd && !filtered && mode === "all" && (
              <Link href="/items/new" className="btn-primary mt-5 py-2.5 text-[12.5px]">
                <PlusIcon className="h-4 w-4" />
                Add your first item
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-panel/40">
                  {[
                    "Item ID",
                    "Brand",
                    "Category",
                    "Size",
                    "Condition",
                    "Price",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                    >
                      {heading}
                    </th>
                  ))}
                  {user.role !== "STAFF" && (
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Added by
                    </th>
                  )}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-line-soft transition last:border-b-0 hover:bg-panel/30"
                  >
                    <td className="px-4 py-3.5 text-[11.5px] uppercase tracking-wide text-muted">
                      ITM-{String(item.id).padStart(3, "0")}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-ink">
                      {item.brand}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-ink/80">
                      {item.category}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex min-w-7 justify-center rounded-md border border-line bg-card px-1.5 py-0.5 text-[11px] font-medium text-ink/80">
                        {item.size}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-2 text-[12.5px] text-ink/80">
                        <span
                          className={`h-1.5 w-1.5 rounded-full bg-current ${
                            CONDITION_DOT[item.condition] ?? "text-brand"
                          }`}
                        />
                        {item.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] font-medium text-ink">
                      {money(item.price)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    {user.role !== "STAFF" && (
                      <td className="px-4 py-3.5 text-[12.5px] text-ink/70">
                        {item.createdBy.displayName ?? item.createdBy.username}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/items/${item.id}`}
                        className="text-[12.5px] font-semibold text-ink underline-offset-4 hover:text-brand hover:underline"
                      >
                        {mode === "pending" ? "Review" : "Details"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[11.5px] text-muted">
          <span>
            {total} item{total === 1 ? "" : "s"} found · Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={hrefFor({ page: page - 1 })}
                className="btn-ghost gap-1 px-3 py-1.5 text-[11.5px]"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                Previous
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-line-soft px-3 py-1.5 text-[11.5px] text-muted/60">
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                Previous
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={hrefFor({ page: page + 1 })}
                className="btn-ghost gap-1 px-3 py-1.5 text-[11.5px]"
              >
                Next
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-line-soft px-3 py-1.5 text-[11.5px] text-muted/60">
                Next
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
