import { requireRole } from "@/lib/auth";
import {
  InventoryView,
  type SearchParams,
} from "@/components/inventory/inventory-view";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // STAFF see only their own items; ADMIN searches the whole inventory.
  const user = await requireRole("STAFF", "ADMIN");

  return <InventoryView user={user} searchParams={await searchParams} />;
}
