"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState | null, FormData>(
    login,
    null,
  );

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">SQ-Way Inventory</h1>
      <p className="mt-1 text-sm text-gray-600">Log in to manage thrifted clothing stock.</p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-black"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-black"
          />
        </div>

        {state?.error && (
          <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}
