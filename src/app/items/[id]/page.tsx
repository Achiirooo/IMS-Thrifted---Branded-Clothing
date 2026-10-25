import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { ChevronLeftIcon } from "@/components/icons";
import { ReviewPanel } from "./review-panel";

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-caps">{label}</p>
      <p className="mt-1.5 text-[13.5px] text-ink">{children}</p>
    </div>
  );
}

export default async function ItemDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reviewed?: string }>;
}) {
  const user = await requireRole("STAFF", "REVIEWER", "ADMIN");
  const { id } = await params;
  const { reviewed } = await searchParams;
  const itemId = Number(id);

  if (!Number.isInteger(itemId)) notFound();

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      createdBy: { select: { username: true, displayName: true } },
      statusLogs: {
        orderBy: { changedAt: "desc" },
        include: { changedBy: { select: { username: true, displayName: true } } },
      },
    },
  });

  if (!item) notFound();
  // STAFF may only open their own items (same rule as the list page).
  if (user.role === "STAFF" && item.createdById !== user.userId) {
    redirect("/forbidden");
  }

  // Only reviewers and admins decide, and only while the item is Pending.
  const canReview = user.role !== "STAFF" && item.status === "Pending";

  return (
    <AppShell
      user={user}
      title={item.brand}
      subtitle={`${item.name} · ITM-${String(item.id).padStart(3, "0")}`}
      actions={
        <Link href="/items" className="btn-ghost gap-1.5 py-2.5 text-[12.5px]">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to inventory
        </Link>
      }
    >
      <div className="grid gap-3.5 lg:grid-cols-[1fr_340px]">
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[22px] text-ink">{item.name}</h2>
            <StatusBadge status={item.status} />
          </div>

          <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Brand">{item.brand}</Field>
            <Field label="Category">{item.category}</Field>
            <Field label="Size">{item.size}</Field>
            <Field label="Condition">{item.condition}</Field>
            <Field label="Price">{money(item.price)}</Field>
            <Field label="Quantity">{item.quantity}</Field>
            <Field label="Added by">
              {item.createdBy.displayName ?? item.createdBy.username}
            </Field>
            <Field label="Added on">{formatDate(item.createdAt)}</Field>
          </div>

          {item.status === "Pending" && (
            <p className="mt-6 rounded-xl border border-warn/25 bg-warn-soft px-4 py-3 text-[12.5px] text-warn">
              {canReview
                ? "Waiting for your decision — use the reviewer panel below."
                : "This item is waiting for a reviewer's decision."}
            </p>
          )}

          {item.status === "Pending" && item.rejectionReason && (
            <p className="mt-3 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[12.5px] text-danger">
              <strong className="font-semibold">Last rejection:</strong>{" "}
              {item.rejectionReason}
            </p>
          )}
        </section>

        <section className="card h-fit p-6">
          <p className="label-caps">Status history</p>

          <ol className="mt-4 space-y-4">
            {item.statusLogs.map((log) => (
              <li key={log.id} className="relative border-l border-line pl-4">
                <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-brand" />
                <StatusBadge status={log.newStatus} />
                <p className="mt-1.5 text-[11.5px] text-muted">
                  {log.oldStatus ? `${log.oldStatus} → ${log.newStatus}` : "Created"}
                  {" · "}
                  {log.changedBy.displayName ?? log.changedBy.username}
                </p>
                <p className="text-[11px] text-muted/80">{formatDate(log.changedAt)}</p>
                {log.reason && (
                  <p className="mt-1 text-[11.5px] text-ink/70">{log.reason}</p>
                )}
              </li>
            ))}
            {item.statusLogs.length === 0 && (
              <li className="text-[12.5px] text-muted">No status changes logged yet.</li>
            )}
          </ol>
        </section>
      </div>

      {reviewed === "approved" && (
        <p className="mt-3.5 rounded-xl border border-good/25 bg-good-soft px-4 py-3 text-[12.5px] text-good">
          Item approved. A <strong>Pending → In Stock</strong> entry was added to the
          history.
        </p>
      )}
      {reviewed === "rejected" && (
        <p className="mt-3.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[12.5px] text-danger">
          Item rejected. It stays <strong>Pending</strong>, and the reason is recorded
          on the item and in the status history.
        </p>
      )}

      {canReview && (
        <div className="mt-3.5">
          <ReviewPanel itemId={item.id} />
        </div>
      )}
    </AppShell>
  );
}
