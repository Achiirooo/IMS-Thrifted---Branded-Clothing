import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Next.js 16: searchParams is a Promise and must be awaited.
export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  // All three roles may open the list; what they see differs below.
  const user = await requireRole("STAFF", "REVIEWER", "ADMIN");
  const { created } = await searchParams;

  // STAFF sees only what they added. REVIEWER and ADMIN see everything.
  const items = await prisma.item.findMany({
    where: user.role === "STAFF" ? { createdById: user.userId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { username: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {user.role === "STAFF" ? "My items" : "All items"}
        </h1>
        <Link href="/dashboard" className="text-sm underline">
          Dashboard
        </Link>
      </div>

      {created && (
        <p className="mt-4 rounded bg-green-100 px-3 py-2 text-sm text-green-800">
          Item saved. It was added with status <strong>Pending</strong> and logged.
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-8 text-gray-600">No items yet.</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Brand</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Size</th>
              <th className="py-2 pr-3">Condition</th>
              <th className="py-2 pr-3">Price</th>
              <th className="py-2 pr-3">Qty</th>
              <th className="py-2 pr-3">Status</th>
              {user.role !== "STAFF" && <th className="py-2">Added by</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 align-top">
                <td className="py-2 pr-3">{item.name}</td>
                <td className="py-2 pr-3">{item.brand}</td>
                <td className="py-2 pr-3">{item.category}</td>
                <td className="py-2 pr-3">{item.size}</td>
                <td className="py-2 pr-3">{item.condition}</td>
                <td className="py-2 pr-3">₱{item.price.toFixed(2)}</td>
                <td className="py-2 pr-3">{item.quantity}</td>
                <td className="py-2 pr-3">{item.status}</td>
                {user.role !== "STAFF" && (
                  <td className="py-2">{item.createdBy.username}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
