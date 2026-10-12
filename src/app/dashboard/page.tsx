import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/logout/actions";

// Each role only sees the links it is allowed to use.
// The pages themselves re-check the role on the server (requireRole).
const LINKS: Record<string, { href: string; label: string }[]> = {
  STAFF: [
    { href: "/items/new", label: "Add new item" },
    { href: "/items", label: "My items" },
  ],
  REVIEWER: [{ href: "/items", label: "View all items" }],
  ADMIN: [
    { href: "/items/new", label: "Add new item" },
    { href: "/items", label: "View all items" },
  ],
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // Proxy already blocks anonymous users, but check again on the server.
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <form action={logout}>
          <button className="rounded border border-gray-300 px-3 py-1 text-sm">
            Log out
          </button>
        </form>
      </div>

      <p className="mt-2 text-gray-600">
        Logged in as <span className="font-medium">{user.username}</span> ({user.role})
      </p>

      <nav className="mt-8 space-y-3">
        {LINKS[user.role].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded border border-gray-300 px-4 py-3 hover:bg-gray-50"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
