import Link from "next/link";
import { requireRole } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import {
  BagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  PesoIcon,
} from "@/components/icons";
import { ColumnFilter } from "@/components/inventory/column-filter";
import { SellButton } from "./sell-button";

export const dynamic = "force-dynamic";

const PAGE_SIZES = ["10", "25", "50"];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "brand", label: "Brand A\u2013Z" },
];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function money(value: number) {
  return "\u20B9" + value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card p-5">
      <p className="label-caps">{label}</p>
      <p className="mt-4 font-display text-[30px] leading-none text-ink">{value}</p>
      <p className="mt-2 text-[11.5px] text-muted">{hint}</p>
    </div>
  );
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole("STAFF");
  const params = await searchParams;
  const sold = first(params.sold);

  const q = (first(params.q) ?? "").trim();
  const brand = (first(params.brand) ?? "").trim();
  const category = first(params.category)?.trim() || undefined;
  const size = first(params.size)?.trim() || undefined;
  const condition = first(params.condition)?.trim() || undefined;
  const min = Number(first(params.min) ?? "");
  const max = Number(first(params.max) ?? "");
  const sort = first(params.sort) ?? "newest";
  const pageSizeRaw = first(params.pageSize) ?? "10";
  const pageSize = PAGE_SIZES.includes(pageSizeRaw) ? Number(pageSizeRaw) : 10;
  const pageParam = Number(first(params.page) ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const where: Prisma.ItemWhereInput = { status: "In Stock" };
  if (brand) where.brand = { contains: brand };
  if (category) where.category = category;
  if (size) where.size = size;
  if (condition) where.condition = condition;
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;
  if (hasMin || hasMax) {
    where.price = {
      ...(hasMin ? { gte: min } : {}),
      ...(hasMax ? { lte: max } : {}),
    };
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { brand: { contains: q } },
      { category: { contains: q } },
    ];
  }

  let orderBy: Prisma.ItemOrderByWithRelationInput = { createdAt: "desc" };
  switch (sort) {
    case "oldest": orderBy = { createdAt: "asc" }; break;
    case "price-desc": orderBy = { price: "desc" }; break;
    case "price-asc": orderBy = { price: "asc" }; break;
    case "brand": orderBy = { brand: "asc" }; break;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [items, total, soldToday, shelfAgg, categoryRows, sizeRows, conditionRows] =
    await Promise.all([
      prisma.item.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { createdBy: { select: { displayName: true, username: true } } },
      }),
      prisma.item.count({ where }),
      prisma.statusLog.count({
        where: { newStatus: "Sold", changedAt: { gte: startOfDay } },
      }),
      prisma.item.aggregate({
        where: { status: "In Stock" },
        _sum: { price: true },
      }),
      prisma.item.findMany({
        where: { status: "In Stock" },
        distinct: ["category"],
        select: { category: true },
        orderBy: { category: "asc" },
      }),
      prisma.item.findMany({
        where: { status: "In Stock" },
        distinct: ["size"],
        select: { size: true },
        orderBy: { size: "asc" },
      }),
      prisma.item.findMany({
        where: { status: "In Stock" },
        distinct: ["condition"],
        select: { condition: true },
        orderBy: { condition: "asc" },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const shelfValue = shelfAgg._sum.price ?? 0;
  const hasFilters = Boolean(q || brand || category || size || condition || hasMin || hasMax);

  function hrefFor(next: { page?: number }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (brand) params.set("brand", brand);
    if (category) params.set("category", category);
    if (size) params.set("size", size);
    if (condition) params.set("condition", condition);
    if (hasMin) params.set("min", String(min));
    if (hasMax) params.set("max", String(max));
    if (sort !== "newest") params.set("sort", sort);
    if (pageSize !== 10) params.set("pageSize", String(pageSize));
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? "/sales?" + qs : "/sales";
  }

  return (
    <AppShell
      user={user}
      title="Sales & Checkout"
      subtitle="Only In Stock items can be sold"
      actions={
        <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2.5 text-[12px] text-muted">
          <BagIcon className="h-4 w-4 text-brand" />
          Status Guard active
        </span>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Stat
          label="Available to sell"
          value={String(total)}
          hint="In Stock items"
        />
        <Stat label="Shelf value" value={money(shelfValue)} hint="Price of all In Stock items" />
        <Stat label="Sold today" value={String(soldToday)} hint="Sales recorded since midnight" />
      </div>

      {sold && (
        <p className="mt-3.5 rounded-xl border border-good/25 bg-good-soft px-4 py-3 text-[12.5px] text-good">
          Sale recorded. The item is now <strong>Sold</strong> and an{" "}
          <strong>In Stock \u2192 Sold</strong> entry was added to its status history.
        </p>
      )}

      <div className="card mt-3.5 overflow-hidden">
        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <InboxIcon className="mx-auto h-9 w-9 text-muted/60" />
            <p className="mt-3 font-display text-[19px] text-ink">Nothing to sell</p>
            <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-muted">
              {hasFilters
                ? "No In Stock items match these filters. Try clearing them."
                : "There are no In Stock items right now. Pending items must be approved by a reviewer before they can be sold."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-panel/40">
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Item ID
                    </th>
                    <th className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Item
                        </span>
                        <ColumnFilter column="q" kind="text" value={q} placeholder="Search name\u2026" />
                      </div>
                    </th>
                    <th className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Brand
                        </span>
                        <ColumnFilter column="brand" kind="text" value={brand} placeholder="Search brand\u2026" />
                      </div>
                    </th>
                    <th className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Category
                        </span>
                        <ColumnFilter
                          column="category"
                          kind="select"
                          value={category}
                          options={[
                            { value: "", label: "All categories" },
                            ...categoryRows.map((row) => ({ value: row.category, label: row.category })),
                          ]}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Size
                        </span>
                        <ColumnFilter
                          column="size"
                          kind="select"
                          value={size}
                          options={[
                            { value: "", label: "All sizes" },
                            ...sizeRows.map((row) => ({ value: row.size, label: row.size })),
                          ]}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Condition
                        </span>
                        <ColumnFilter
                          column="condition"
                          kind="select"
                          value={condition}
                          options={[
                            { value: "", label: "All conditions" },
                            ...conditionRows.map((row) => ({ value: row.condition, label: row.condition })),
                          ]}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Price
                        </span>
                        <ColumnFilter
                          column="Price"
                          kind="range"
                          fromKey="min"
                          toKey="max"
                          fromValue={hasMin ? String(min) : ""}
                          toValue={hasMax ? String(max) : ""}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Added by
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Action
                    </th>
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
                        {item.name}
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-ink/80">{item.brand}</td>
                      <td className="px-4 py-3.5 text-[12.5px] text-ink/80">{item.category}</td>
                      <td className="px-4 py-3.5 text-[12.5px] text-ink/80">{item.size}</td>
                      <td className="px-4 py-3.5 text-[12.5px] text-ink/80">{item.condition}</td>
                      <td className="px-4 py-3.5 text-[12.5px] font-medium text-ink">
                        {money(item.price)}
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-ink/70">
                        {item.createdBy.displayName ?? item.createdBy.username}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <SellButton
                          itemId={item.id}
                          label={item.name + " (ITM-" + String(item.id).padStart(3, "0") + ")"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[11.5px] text-muted">
              <span>
                {total} item{total === 1 ? "" : "s"} found \u00B7 Page {page} of {totalPages}
                {hasFilters ? " \u00B7 filtered" : ""}
              </span>
              <div className="flex items-center gap-2">
                <ColumnFilter column="sort" kind="select" value={sort} options={SORTS} />
                <ColumnFilter
                  column="pageSize"
                  kind="select"
                  value={String(pageSize)}
                  options={PAGE_SIZES.map((size) => ({ value: size, label: size + " / page" }))}
                />
                {page > 1 ? (
                  <Link href={hrefFor({ page: page - 1 })} className="btn-ghost gap-1 px-3 py-1.5 text-[11.5px]">
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
                  <Link href={hrefFor({ page: page + 1 })} className="btn-ghost gap-1 px-3 py-1.5 text-[11.5px]">
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
          </>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
        <PesoIcon className="h-3.5 w-3.5" />
        A sale changes the status to Sold and writes the status log in the same transaction.
      </p>
    </AppShell>
  );
}
