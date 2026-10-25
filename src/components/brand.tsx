import Link from "next/link";

export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[10px] bg-brand text-white shadow-[0_2px_0_rgba(0,0,0,0.08)] ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[62%] w-[62%]"
        aria-hidden="true"
      >
        <rect x="5.5" y="4" width="13" height="16.5" rx="2.5" />
        <path d="M9 5.5h6" />
        <path d="m9.2 13 2.2 2.3 4-4.4" />
      </svg>
    </span>
  );
}

export function Brand({
  href = "/dashboard",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <BrandMark className={compact ? "h-9 w-9" : "h-10 w-10"} />
      <span className="min-w-0">
        <span
          className={`block font-display leading-tight text-ink ${
            compact ? "text-[14.5px]" : "text-[15.5px]"
          }`}
        >
          Thrifted &amp; Branded
          <br />
          Surplus Clothing
        </span>
        <span
          className={`mt-1 block whitespace-nowrap font-medium uppercase text-muted ${
            compact
              ? "text-[7.5px] tracking-[0.14em]"
              : "text-[8.5px] tracking-[0.22em]"
          }`}
        >
          Inventory Management System
        </span>
      </span>
    </Link>
  );
}
