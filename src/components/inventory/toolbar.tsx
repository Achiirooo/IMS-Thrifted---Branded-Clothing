"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon, SearchIcon } from "@/components/icons";

export interface InventoryFilters {
  q?: string;
  status?: string;
  sort: string;
  pageSize: string;
  size?: string;
  condition?: string;
  min?: string;
  max?: string;
}

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "brand", label: "Brand A–Z" },
];

function Select({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-line bg-card pl-3.5 pr-9 text-[12.5px] text-ink outline-none transition hover:bg-panel-hover focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function InventoryToolbar({
  filters,
  statuses,
  sizes,
  conditions,
  showAdvanced,
  fixedStatus,
}: {
  filters: InventoryFilters;
  statuses: readonly string[];
  sizes: string[];
  conditions: string[];
  showAdvanced: boolean;
  fixedStatus?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q ?? "");

  function apply(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    // Any filter change starts again from page 1.
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  // Debounce the search box so we do not navigate on every keystroke.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (query === current) return;
    const timer = setTimeout(() => apply({ q: query || undefined }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasFilters = Boolean(
    filters.q ||
      filters.status ||
      filters.size ||
      filters.condition ||
      filters.min ||
      filters.max,
  );

  return (
    <div className="card px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search brand, category, ID..."
            aria-label="Search items"
            className="h-10 w-full rounded-xl border border-line bg-card pl-10 pr-3.5 text-[12.5px] outline-none transition placeholder:text-muted/80 focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
          />
        </div>

        {!fixedStatus && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => apply({ status: undefined })}
              className={`h-10 rounded-xl px-4 text-[12.5px] font-medium transition ${
                filters.status
                  ? "border border-line bg-card text-ink hover:bg-panel-hover"
                  : "bg-brand text-white"
              }`}
            >
              All
            </button>
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => apply({ status })}
                className={`h-10 rounded-xl px-4 text-[12.5px] font-medium transition ${
                  filters.status === status
                    ? "bg-brand text-white"
                    : "border border-line bg-card text-ink hover:bg-panel-hover"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Select
            label="Sort by"
            value={filters.sort}
            onChange={(value) => apply({ sort: value })}
            options={SORTS}
            className="w-[150px]"
          />
          <Select
            label="Items per page"
            value={filters.pageSize}
            onChange={(value) => apply({ pageSize: value })}
            options={[
              { value: "10", label: "10 / page" },
              { value: "25", label: "25 / page" },
              { value: "50", label: "50 / page" },
            ]}
            className="w-[112px]"
          />
        </div>
      </div>

      {(showAdvanced || hasFilters) && !fixedStatus && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line-soft pt-2.5">
          {showAdvanced && (
            <>
              <Select
                label="Filter by size"
                value={filters.size ?? ""}
                onChange={(value) => apply({ size: value || undefined })}
                options={[
                  { value: "", label: "All sizes" },
                  ...sizes.map((size) => ({ value: size, label: size })),
                ]}
                className="w-[126px]"
              />
              <Select
                label="Filter by condition"
                value={filters.condition ?? ""}
                onChange={(value) => apply({ condition: value || undefined })}
                options={[
                  { value: "", label: "All conditions" },
                  ...conditions.map((condition) => ({
                    value: condition,
                    label: condition,
                  })),
                ]}
                className="w-[152px]"
              />
              <input
                type="number"
                min={0}
                defaultValue={filters.min ?? ""}
                onBlur={(event) => apply({ min: event.target.value || undefined })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                placeholder="Min price (₱)"
                aria-label="Minimum price"
                className="h-10 w-[126px] rounded-xl border border-line bg-card px-3.5 text-[12.5px] outline-none transition placeholder:text-muted/80 focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
              />
              <input
                type="number"
                min={0}
                defaultValue={filters.max ?? ""}
                onBlur={(event) => apply({ max: event.target.value || undefined })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                placeholder="Max price (₱)"
                aria-label="Maximum price"
                className="h-10 w-[126px] rounded-xl border border-line bg-card px-3.5 text-[12.5px] outline-none transition placeholder:text-muted/80 focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
              />
            </>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                apply({
                  q: undefined,
                  status: undefined,
                  size: undefined,
                  condition: undefined,
                  min: undefined,
                  max: undefined,
                });
              }}
              className="ml-auto h-10 rounded-xl border border-line bg-card px-3.5 text-[12px] font-medium text-muted transition hover:bg-panel-hover hover:text-ink"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
