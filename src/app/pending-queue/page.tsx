import { requireRole } from "@/lib/auth";
import {
  InventoryView,
  type SearchParams,
} from "@/components/inventory/inventory-view";

// Reviewers and admins work the approval queue; STAFF never sees this page.
export default async function PendingQueuePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireRole("REVIEWER", "ADMIN");

  return (
    <InventoryView user={user} searchParams={await searchParams} mode="pending" />
  );
}
