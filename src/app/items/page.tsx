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
  // All three roles may open the list; the query is scoped inside the view.
  const user = await requireRole("STAFF", "REVIEWER", "ADMIN");

  return <InventoryView user={user} searchParams={await searchParams} />;
}
