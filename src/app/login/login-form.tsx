"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "./actions";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { ArrowRightIcon, EyeIcon, EyeOffIcon, KeyIcon, UserIcon } from "@/components/icons";
import type { Role } from "@/lib/constants";

export interface DemoAccount {
  username: string;
  displayName: string;
  role: Role;
  password: string;
}

export function LoginForm({ demo }: { demo: DemoAccount[] }) {
  const [state, formAction, pending] = useActionState<LoginState | null, FormData>(
    login,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function fillDemo(account: DemoAccount) {
    setUsername(account.username);
    setPassword(account.password);
  }

  return (
    <div>
      <form action={formAction} className="space-y-3.5">
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="field py-3.5 pl-11"
          />
        </div>

        <div className="relative">
          <KeyIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field py-3.5 pl-11 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition hover:bg-panel-hover hover:text-ink"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {state?.error && (
          <p
            role="alert"
            className="rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger"
          >
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full py-3.5">
          {pending ? "Signing in..." : "Sign In"}
          {!pending && <ArrowRightIcon className="h-[18px] w-[18px]" />}
        </button>
      </form>

      {demo.length > 0 && (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
              Or use demo accounts (temporary)
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {demo.map((account) => (
              <button
                key={account.username}
                type="button"
                onClick={() => fillDemo(account)}
                title={`Fill in ${account.username}`}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2.5 text-left transition hover:border-brand/40 hover:bg-panel-hover"
              >
                <Avatar name={account.displayName} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {account.displayName}
                  </span>
                  <span className="mt-1 block">
                    <RoleBadge role={account.role} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
