// Reusable column filter rendered inside a table header. Each change writes
// to the URL query string and resets to page 1, so the server page re-renders
// with the new filter. Three modes: select dropdown, free-text input, and a
// min/max number range (used for the Price column).
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface FilterOption {
  value: string;
  label: string;
}

const BASE =
  "rounded-lg border border-line bg-card text-[11px] text-ink outline-none transition " +
  "focus:border-brand/50 focus:ring-2 focus:ring-brand/15";

export function ColumnFilter({
  column,
  kind = "select",
  value,
  options,
  placeholder,
  fromKey,
  toKey,
  fromValue,
  toValue,
}: {
  column: string;
  kind?: "select" | "text" | "range";
  value?: string;
  options?: FilterOption[];
  placeholder?: string;
  fromKey?: string;
  toKey?: string;
  fromValue?: string;
  toValue?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (!val) params.delete(key);
      else params.set(key, val);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? pathname + "?" + qs : pathname, { scroll: false });
  }

  if (kind === "select") {
    return (
      <select
        aria-label={"Filter by " + column}
        value={value ?? ""}
        onChange={(event) => apply({ [column]: event.target.value || undefined })}
        className={BASE + " pl-2 pr-7 py-1.5"}
      >
        <option value="">All</option>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (kind === "text") {
    return (
      <input
        type="text"
        aria-label={"Filter by " + column}
        defaultValue={value ?? ""}
        placeholder={placeholder ?? "Filter " + column + "\u2026"}
        onBlur={(event) => apply({ [column]: event.target.value.trim() || undefined })}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={BASE + " px-2 py-1.5"}
      />
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        aria-label={column + " minimum"}
        defaultValue={fromValue ?? ""}
        placeholder="Min"
        onBlur={(event) => apply({ [fromKey!]: event.target.value || undefined })}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={BASE + " w-16 px-1.5 py-1.5 text-[11px]"}
      />
      <span className="text-[10px] text-muted">-</span>
      <input
        type="number"
        min={0}
        aria-label={column + " maximum"}
        defaultValue={toValue ?? ""}
        placeholder="Max"
        onBlur={(event) => apply({ [toKey!]: event.target.value || undefined })}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={BASE + " w-16 px-1.5 py-1.5 text-[11px]"}
      />
    </div>
  );
}
