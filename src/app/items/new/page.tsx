import Link from "next/link";
import { requireRole } from "@/lib/auth";
import NewItemForm from "./new-item-form";

// Page-level guard: reviewers get redirected to /forbidden.
// The server action (actions.ts) checks the role again.
export default async function NewItemPage() {
  await requireRole("STAFF", "ADMIN");

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add new item</h1>
        <Link href="/dashboard" className="text-sm underline">
          Dashboard
        </Link>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        New items are saved as <span className="font-medium">Pending</span> until a
        reviewer approves them (Week 9).
      </p>
      <div className="mt-6">
        <NewItemForm />
      </div>
    </main>
  );
}
