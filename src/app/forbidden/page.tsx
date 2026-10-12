import Link from "next/link";

// Shown when requireRole() redirects a logged-in user with the wrong role.
export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">403 — Not allowed</h1>
      <p className="mt-2 text-gray-600">
        Your account does not have permission to open that page.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-block rounded bg-black px-4 py-2 text-white"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
