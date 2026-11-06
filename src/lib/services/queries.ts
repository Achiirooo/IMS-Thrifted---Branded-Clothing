// Read-only queries shared by the pages and the REST API. The Postman
// collection asserts on the same numbers the UI shows, so the grouping rules
// live here instead of being duplicated.
import type { Prisma } from "@prisma/client";
import type { Role } from "@/lib/constants";
import { ITEM_STATUSES, LOW_STOCK_THRESHOLD, type ItemStatus } from "@/lib/constants";
import { prisma } from "@/lib/db";

export interface ItemFilters {
  q?: string;
  status?: string;
  size?: string;
  condition?: string;
  min?: number;
  max?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

// STAFF may only see their own items; REVIEWER and ADMIN see everything.
export function scopeForUser(user: {
  role: Role;
  userId: number;
}): Prisma.ItemWhereInput {
  return user.role === "STAFF" ? { createdById: user.userId } : {};
}

export function isItemStatusValue(value: string | undefined): value is ItemStatus {
  return ITEM_STATUSES.some((status) => status === value);
}

export function buildItemWhere(
  filters: ItemFilters,
  scope: Prisma.ItemWhereInput = {},
): Prisma.ItemWhereInput {
  const where: Prisma.ItemWhereInput = { ...scope };

  if (filters.status && isItemStatusValue(filters.status)) {
    where.status = filters.status;
  }
  if (filters.size) where.size = filters.size;
  if (filters.condition) where.condition = filters.condition;

  const min = filters.min;
  const max = filters.max;
  const hasMin = typeof min === "number" && Number.isFinite(min) && min > 0;
  const hasMax = typeof max === "number" && Number.isFinite(max) && max > 0;
  if (hasMin || hasMax) {
    where.price = {
      ...(hasMin ? { gte: min } : {}),
      ...(hasMax ? { lte: max } : {}),
    };
  }

  const q = filters.q?.trim();
  if (q) {
    // Staff can also paste an item code ("ITM-012" / "itm-12") into search.
    const codeMatch = /^itm-?(\d+)$/i.exec(q);
    where.OR = [
      { name: { contains: q } },
      { brand: { contains: q } },
      { category: { contains: q } },
      ...(codeMatch ? [{ id: Number(codeMatch[1]) }] : []),
    ];
  }

  return where;
}

export function buildItemOrderBy(
  sort: string | undefined,
): Prisma.ItemOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "price-asc":
      return { price: "asc" };
    case "brand":
      return { brand: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export async function searchItems(
  filters: ItemFilters,
  user: { role: Role; userId: number },
  options: { defaultPageSize?: number; maxPageSize?: number } = {},
) {
  const defaultPageSize = options.defaultPageSize ?? 25;
  const maxPageSize = options.maxPageSize ?? 100;

  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
  const requestedPageSize =
    filters.pageSize && filters.pageSize > 0
      ? Math.floor(filters.pageSize)
      : defaultPageSize;
  const pageSize = Math.min(requestedPageSize, maxPageSize);

  const where = buildItemWhere(filters, scopeForUser(user));

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: buildItemOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { createdBy: { select: { username: true, displayName: true } } },
    }),
    prisma.item.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ---------------------------------------------------------------------------
// Status totals, low stock, reports
// ---------------------------------------------------------------------------

export interface StatusTotal {
  status: ItemStatus;
  count: number;
  value: number;
}

export interface LowStockCategory {
  category: string;
  count: number;
}

export interface ReportsSummary {
  totalItems: number;
  totals: StatusTotal[];
  counts: Record<ItemStatus, number>;
  revenue: number;
  lowStock: LowStockCategory[];
  lowStockThreshold: number;
  rejectionReasons: {
    id: number;
    name: string;
    brand: string;
    category: string;
    rejectionReason: string | null;
    createdAt: Date;
  }[];
  statusHistory: {
    id: number;
    itemId: number;
    itemName: string;
    itemBrand: string;
    oldStatus: string | null;
    newStatus: string;
    changedBy: string;
    reason: string | null;
    changedAt: Date;
  }[];
}

async function statusTotals(): Promise<StatusTotal[]> {
  const grouped = await prisma.item.groupBy({
    by: ["status"],
    _count: { _all: true },
    _sum: { price: true },
  });

  return ITEM_STATUSES.map((status) => {
    const row = grouped.find((entry) => entry.status === status);
    return {
      status,
      count: row?._count._all ?? 0,
      value: row?._sum.price ?? 0,
    };
  });
}

async function lowStockCategories(): Promise<LowStockCategory[]> {
  const [inStockByCategory, categories] = await Promise.all([
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

  const counts = new Map(
    inStockByCategory.map((row) => [row.category, row._count._all]),
  );

  return categories
    .map((row) => ({
      category: row.category,
      count: counts.get(row.category) ?? 0,
    }))
    .filter((row) => row.count <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.count - b.count || a.category.localeCompare(b.category));
}

export async function getAdminStats() {
  const [totals, lowStock] = await Promise.all([
    statusTotals(),
    lowStockCategories(),
  ]);

  const countFor = (status: ItemStatus) =>
    totals.find((row) => row.status === status)?.count ?? 0;

  return {
    inStock: countFor("In Stock"),
    pending: countFor("Pending"),
    sold: countFor("Sold"),
    revenue: totals.find((row) => row.status === "Sold")?.value ?? 0,
    lowStock,
  };
}

export async function getReportsSummary(options?: {
  rejectionLimit?: number;
  historyLimit?: number;
}): Promise<ReportsSummary> {
  const rejectionLimit = options?.rejectionLimit ?? 25;
  const historyLimit = options?.historyLimit ?? 50;

  const [totals, lowStock, rejectionReasons, history, totalItems] =
    await Promise.all([
      statusTotals(),
      lowStockCategories(),
      prisma.item.findMany({
        where: { rejectionReason: { not: null } },
        orderBy: { createdAt: "desc" },
        take: rejectionLimit,
        select: {
          id: true,
          name: true,
          brand: true,
          category: true,
          rejectionReason: true,
          createdAt: true,
        },
      }),
      prisma.statusLog.findMany({
        orderBy: { changedAt: "desc" },
        take: historyLimit,
        include: {
          item: { select: { id: true, name: true, brand: true } },
          changedBy: { select: { displayName: true, username: true } },
        },
      }),
      prisma.item.count(),
    ]);

  const counts = Object.fromEntries(
    totals.map((row) => [row.status, row.count]),
  ) as Record<ItemStatus, number>;

  return {
    totalItems,
    totals,
    counts,
    revenue: totals.find((row) => row.status === "Sold")?.value ?? 0,
    lowStock,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    rejectionReasons,
    statusHistory: history.map((log) => ({
      id: log.id,
      itemId: log.itemId,
      itemName: log.item.name,
      itemBrand: log.item.brand,
      oldStatus: log.oldStatus,
      newStatus: log.newStatus,
      changedBy: log.changedBy.displayName ?? log.changedBy.username,
      reason: log.reason,
      changedAt: log.changedAt,
    })),
  };
}
