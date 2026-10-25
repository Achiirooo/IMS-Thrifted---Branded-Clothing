import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ChevronLeftIcon } from "@/components/icons";
import NewItemForm from "./new-item-form";

// Page-level guard: reviewers and admins get redirected to /forbidden.
// The server action (actions.ts) checks the role again.
export default async function NewItemPage() {
  const user = await requireRole("STAFF");

  return (
    <AppShell
      user={user}
      title="Add new item"
      subtitle="New items are saved as Pending until a reviewer approves them"
      actions={
        <Link href="/items" className="btn-ghost gap-1.5 py-2.5 text-[12.5px]">
          <ChevronLeftIcon className="h-4 w-4" />
          Back to inventory
        </Link>
      }
    >
      <div className="max-w-3xl">
        <NewItemForm />
      </div>
    </AppShell>
  );
}
