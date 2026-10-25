import type { SessionUser } from "@/lib/auth";
import { logout } from "@/app/logout/actions";
import { Brand, BrandMark } from "@/components/brand";
import { SideNav } from "@/components/side-nav";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { LogoutIcon } from "@/components/icons";

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logout} className={compact ? "" : "mt-3"}>
      <button
        type="submit"
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-2 text-xs font-medium text-muted hover:text-ink"
            : "flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] font-medium text-ink/80 transition hover:bg-panel-hover hover:text-ink"
        }
      >
        <LogoutIcon className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}

export function AppShell({
  user,
  title,
  subtitle,
  actions,
  children,
}: {
  user: SessionUser;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden border-r border-line bg-panel lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[258px] lg:shrink-0 lg:flex-col">
        <div className="px-5 pt-6">
          <Brand href="/dashboard" compact />
          <span className="mt-4 inline-flex rounded-full border border-line bg-panel-hover px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
            IMS V1.0
          </span>
        </div>

        <div className="mt-5 border-t border-line" />

        <div className="flex-1 overflow-y-auto px-4 pt-4">
          <p className="label-caps px-1">Menu</p>
          <SideNav role={user.role} />
        </div>

        <div className="p-4">
          <div className="card p-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={user.displayName} />
              <div className="min-w-0">
                <p className="truncate font-display text-[13.5px] leading-tight text-ink">
                  {user.displayName}
                </p>
                <div className="mt-1">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        {/* Mobile bar */}
        <header className="border-b border-line bg-panel lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2">
              <BrandMark className="h-8 w-8" />
              <span className="font-display text-[13px] leading-tight">
                Thrifted &amp; Branded
                <br />
                Surplus Clothing
              </span>
            </span>
            <SignOutButton compact />
          </div>
          <SideNav role={user.role} variant="top" />
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-6 border-b border-line pb-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-[3px] rounded-full bg-brand" />
                  <div>
                    <h1 className="font-display text-[26px] leading-none text-ink">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="mt-1.5 text-[12.5px] text-muted">{subtitle}</p>
                    )}
                  </div>
                </div>
                {actions}
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
