"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/constants";
import { ChartIcon, ClockIcon, GridIcon, HomeIcon, PlusIcon, BagIcon } from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

// Each role only gets the links it may actually open.
const NAV: Record<Role, NavItem[]> = {
  STAFF: [
    { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { href: "/items", label: "Inventory", icon: GridIcon },
    { href: "/items/new", label: "Add Item", icon: PlusIcon },
    { href: "/sales", label: "Sales", icon: BagIcon },
  ],
  REVIEWER: [
    { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { href: "/pending-queue", label: "Pending Queue", icon: ClockIcon },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { href: "/items", label: "Inventory", icon: GridIcon },
    { href: "/reports", label: "Reports", icon: ChartIcon },
  ],
};

function isActive(pathname: string, href: string) {
  if (href === "/items") {
    // Keep "Inventory" active on detail pages, but not on /items/new.
    return pathname === "/items" || (pathname.startsWith("/items/") && pathname !== "/items/new");
  }
  return pathname === href;
}

export function SideNav({
  role,
  variant = "sidebar",
}: {
  role: Role;
  variant?: "sidebar" | "top";
}) {
  const pathname = usePathname();

  if (variant === "top") {
    return (
      <nav className="flex gap-1 overflow-x-auto px-4 pb-3">
        {NAV[role].map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                active
                  ? "bg-brand-soft font-medium text-brand-dark"
                  : "text-muted hover:bg-panel-hover"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mt-3 space-y-1">
      {NAV[role].map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-lg py-2.5 pl-3 pr-2 text-[13.5px] transition ${
              active
                ? "bg-panel-hover font-medium text-ink shadow-[inset_3px_0_0_var(--color-brand)]"
                : "text-muted hover:bg-panel-hover/70 hover:text-ink"
            }`}
          >
            <item.icon
              className={`h-[17px] w-[17px] ${active ? "text-brand" : "text-muted group-hover:text-ink"}`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
