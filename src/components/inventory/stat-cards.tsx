import { BagIcon, CheckIcon, ClockIcon, PesoIcon } from "@/components/icons";

type Tone = "good" | "warn" | "neutral" | "brand";

const TONE: Record<Tone, { chip: string; value: string }> = {
  good: { chip: "bg-good-soft text-good", value: "text-ink" },
  warn: { chip: "bg-warn-soft text-warn", value: "text-ink" },
  neutral: { chip: "bg-neutral-soft text-neutral", value: "text-ink" },
  brand: { chip: "bg-brand-soft text-brand", value: "text-brand-dark" },
};

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  tone: Tone;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps">{label}</p>
        <span
          className={`grid h-7 w-7 place-items-center rounded-lg ${TONE[tone].chip}`}
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-5 font-display text-[34px] leading-none ${TONE[tone].value}`}
      >
        {value}
      </p>
      <p className="mt-2 text-[11.5px] text-muted">{hint}</p>
    </div>
  );
}

export function StatCards({
  inStock,
  pending,
  sold,
  revenue,
}: {
  inStock: number;
  pending: number;
  sold: number;
  revenue: number;
}) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="In Stock"
        value={String(inStock)}
        hint="Ready to sell"
        tone="good"
        icon={<CheckIcon className="h-4 w-4" />}
      />
      <StatCard
        label="Pending Review"
        value={String(pending)}
        hint="Awaiting approval"
        tone="warn"
        icon={<ClockIcon className="h-4 w-4" />}
      />
      <StatCard
        label="Sold"
        value={String(sold)}
        hint="All time"
        tone="neutral"
        icon={<BagIcon className="h-4 w-4" />}
      />
      <StatCard
        label="Revenue"
        value={
          <>
            {/* Playfair has no peso glyph, so the symbol uses the sans stack. */}
            <span className="mr-0.5 font-sans text-[26px]">₱</span>
            {revenue.toLocaleString("en-PH", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </>
        }
        hint="From sold items"
        tone="brand"
        icon={<PesoIcon className="h-4 w-4" />}
      />
    </div>
  );
}
