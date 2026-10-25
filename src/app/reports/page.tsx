import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { ChartIcon, InboxIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function ReportsPage() {
  const user = await requireRole("ADMIN");

  const [grouped, rejectionReasons, history, totalItems] = await Promise.all([
    prisma.item.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { price: true },
    }),
    prisma.item.findMany({
      where: { rejectionReason: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 25,
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
      take: 50,
      include: {
        item: { select: { id: true, name: true, brand: true } },
        changedBy: { select: { displayName: true, username: true } },
      },
    }),
    prisma.item.count(),
  ]);

  const countFor = (status: string) =>
    grouped.find((row) => row.status === status)?._count._all ?? 0;
  const valueFor = (status: string) =>
    grouped.find((row) => row.status === status)?._sum.price ?? 0;

  const pending = countFor("Pending");
  const inStock = countFor("In Stock");
  const sold = countFor("Sold");
  const revenue = valueFor("Sold");

  return (
    <AppShell
      user={user}
      title="Status Reports"
      subtitle={`Current snapshot of ${totalItems} item${totalItems === 1 ? "" : "s"}`}
      actions={
        <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2.5 text-[12px] text-muted">
          <ChartIcon className="h-4 w-4 text-brand" />
          Live data
        </span>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending", value: String(pending), hint: "Waiting for review" },
          { label: "In Stock", value: String(inStock), hint: "Available to sell" },
          { label: "Sold", value: String(sold), hint: "All time" },
          { label: "Revenue", value: money(revenue), hint: "From sold items" },
        ].map((card) => (
          <div key={card.label} className="card p-5">
            <p className="label-caps">{card.label}</p>
            <p className="mt-4 font-display text-[30px] leading-none text-ink">
              {card.value}
            </p>
            <p className="mt-2 text-[11.5px] text-muted">{card.hint}</p>
          </div>
        ))}
      </div>

      <section className="card mt-3.5 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="label-caps">Inventory by status</p>
        </div>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-panel/40">
              {["Status", "Items", "Value"].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["Pending", "In Stock", "Sold"] as const).map((status) => (
              <tr key={status} className="border-b border-line-soft last:border-b-0">
                <td className="px-4 py-3.5">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-3.5 text-[13px] font-medium text-ink">
                  {countFor(status)}
                </td>
                <td className="px-4 py-3.5 text-[12.5px] text-ink/80">
                  {money(valueFor(status))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card mt-3.5 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="label-caps">Rejection reasons</p>
          <p className="mt-1 text-[11.5px] text-muted">
            Latest reason recorded on each item
          </p>
        </div>

        {rejectionReasons.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <InboxIcon className="mx-auto h-8 w-8 text-muted/60" />
            <p className="mt-2 text-[12.5px] text-muted">No rejected items recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-panel/40">
                  {["Item", "Category", "Reason", "Recorded"].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rejectionReasons.map((item) => (
                  <tr key={item.id} className="border-b border-line-soft last:border-b-0">
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-semibold text-ink">{item.name}</p>
                      <p className="text-[11px] text-muted">
                        ITM-{String(item.id).padStart(3, "0")} · {item.brand}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-ink/80">
                      {item.category}
                    </td>
                    <td className="px-4 py-3.5 text-[12.5px] text-danger">
                      {item.rejectionReason}
                    </td>
                    <td className="px-4 py-3.5 text-[11.5px] text-muted">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card mt-3.5 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="label-caps">Status history</p>
          <p className="mt-1 text-[11.5px] text-muted">
            Latest 50 changes across all items
          </p>
        </div>

        {history.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[12.5px] text-muted">No status changes logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-panel/40">
                  {["When", "Item", "Change", "By", "Reason"].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id} className="border-b border-line-soft last:border-b-0">
                    <td className="px-4 py-3.5 text-[11.5px] text-muted">
                      {formatDate(log.changedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] font-medium text-ink">{log.item.name}</p>
                      <p className="text-[11px] text-muted">
                        ITM-{String(log.item.id).padStart(3, "0")} · {log.item.brand}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-[11.5px] text-ink/80">
                      {log.oldStatus ? `${log.oldStatus} → ${log.newStatus}` : "Created"}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-ink/80">
                      {log.changedBy.displayName ?? log.changedBy.username}
                    </td>
                    <td className="px-4 py-3.5 text-[11.5px] text-muted">
                      {log.reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
