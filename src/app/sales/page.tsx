import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { BagIcon, InboxIcon, PesoIcon } from "@/components/icons";
import { SellButton } from "./sell-button";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
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
  searchParams: Promise<{ sold?: string }>;
}) {
  const user = await requireRole("STAFF");
  const { sold } = await searchParams;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [items, soldToday] = await Promise.all([
    prisma.item.findMany({
      where: { status: "In Stock" },
      orderBy: { createdAt: "asc" },
      include: { createdBy: { select: { displayName: true, username: true } } },
    }),
    prisma.statusLog.count({
      where: { newStatus: "Sold", changedAt: { gte: startOfDay } },
    }),
  ]);

  const shelfValue = items.reduce((sum, item) => sum + item.price, 0);

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
          value={String(items.length)}
          hint="Items with status In Stock"
        />
        <Stat label="Shelf value" value={money(shelfValue)} hint="Price of available items" />
        <Stat label="Sold today" value={String(soldToday)} hint="Sales recorded since midnight" />
      </div>

      {sold && (
        <p className="mt-3.5 rounded-xl border border-good/25 bg-good-soft px-4 py-3 text-[12.5px] text-good">
          Sale recorded. The item is now <strong>Sold</strong> and an{" "}
          <strong>In Stock → Sold</strong> entry was added to its status history.
        </p>
      )}

      <div className="card mt-3.5 overflow-hidden">
        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <InboxIcon className="mx-auto h-9 w-9 text-muted/60" />
            <p className="mt-3 font-display text-[19px] text-ink">Nothing to sell</p>
            <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-muted">
              There are no In Stock items right now. Pending items must be approved by a
              reviewer before they can be sold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-panel/40">
                  {[
                    "Item ID",
                    "Item",
                    "Brand",
                    "Category",
                    "Size",
                    "Condition",
                    "Price",
                    "Added by",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                    >
                      {heading}
                    </th>
                  ))}
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
                      {item.name}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-ink/80">{item.brand}</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-ink/80">
                      {item.category}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-ink/80">{item.size}</td>
                    <td className="px-4 py-3.5 text-[12.5px] text-ink/80">
                      {item.condition}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] font-medium text-ink">
                      {money(item.price)}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-ink/70">
                      {item.createdBy.displayName ?? item.createdBy.username}
                    </td>
                    <td className="px-4 py-3.5">
                      <SellButton itemId={item.id} label={`${item.name} (ITM-${String(item.id).padStart(3, "0")})`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted">
        <PesoIcon className="h-3.5 w-3.5" />
        A sale changes the status to Sold and writes the status log in the same transaction.
      </p>
    </AppShell>
  );
}
