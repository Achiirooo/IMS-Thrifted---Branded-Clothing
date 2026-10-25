import type { Role } from "@/lib/constants";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-warn-soft text-warn",
  "In Stock": "bg-good-soft text-good",
  Sold: "bg-neutral-soft text-neutral",
};

const ROLE_STYLES: Record<Role, string> = {
  STAFF: "bg-good-soft text-good",
  REVIEWER: "bg-warn-soft text-warn",
  ADMIN: "bg-role-admin-soft text-role-admin",
};

export function StatusBadge({ status }: { status: string }) {
  // Unknown values (e.g. "Returned for correction") still render sensibly.
  const style = STATUS_STYLES[status] ?? "bg-danger-soft text-danger";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${ROLE_STYLES[role]}`}
    >
      {role}
    </span>
  );
}
