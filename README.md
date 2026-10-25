# SQ-Way — Inventory Management System for Thrifted & Branded Surplus Clothing

School project (Weeks 4–14). **This repository currently contains the Week 8–9 deliverables**
(WBS 3.1.1 Database Tables & Login, 3.1.2 Role-Based Access Control, 3.1.3 New Items = Pending,
and 3.2.1–3.2.3 Pending queue with approve/reject and status transition logic).

Built with Next.js 16 (App Router, TypeScript, Tailwind CSS), Prisma + SQLite, iron-session, and Zod.

## UI

The front end follows the IMS design mockup: warm paper/terracotta palette, serif headings
(Playfair Display) with Inter for body text, a persistent sidebar shell, and status/role badges.

- Design tokens live in `src/app/globals.css` (`@theme`). `color-scheme` is pinned to light so the
  OS dark theme cannot invert the palette.
- `src/components/app-shell.tsx` — sidebar + mobile header, role-filtered navigation, user card,
  and sign out. Shared by every authenticated page.
- `src/components/inventory/*` — stat tiles, filter/search toolbar, and the inventory table (used by
  both `/items` and `/pending-queue`).
- `src/components/ui/*` — `StatusBadge`, `RoleBadge`, `Avatar`.

## Setup

See [SETUP.md](./SETUP.md) for the full guide (prerequisites, environment variables,
migrations, seeded accounts, and troubleshooting). The short version:

```bash
npm install
npx prisma migrate dev     # creates prisma/dev.db and applies the schema
npx prisma db seed         # creates the three test users below
npm run dev                # http://localhost:3000
```

Environment variables (already present in `.env` for local dev):

- `DATABASE_URL="file:./dev.db"` — SQLite file, stored inside `prisma/`.
- `SESSION_SECRET` — used by iron-session to encrypt the session cookie (min 32 chars).

## Seeded test accounts

| Role     | Username   | Password     | Display name   | Can do                                    |
| -------- | ---------- | ------------ | -------------- | ----------------------------------------- |
| STAFF    | `staff1`   | `staff123`   | Jhezl Baldos   | Add items, view only their own items      |
| REVIEWER | `reviewer1`| `reviewer123`| Jessa Bebita   | View all items; approve or reject Pending items |
| ADMIN    | `admin1`   | `admin123`   | Dave Briones   | Everything                                |

`User.displayName` is what the UI shows; `username` is still the login identifier. The login page
lists these accounts as temporary demo cards that fill in the credentials for you.

## How access control works

1. **`src/proxy.ts`** (Next.js 16's replacement for `middleware.ts`) — optimistic check: anyone
   without a valid session cookie is redirected to `/login`.
2. **`requireRole(...roles)` in `src/lib/auth.ts`** — the real, server-side check. Every protected
   page and server action calls it, so hidden buttons are never the only protection. A logged-in
   user with the wrong role is redirected to **`/forbidden`** ("Not allowed").
3. **Dashboard** — shows only the links the logged-in role may use.

## Pages

| Route            | Who                               | What                                                      |
| ---------------- | --------------------------------- | --------------------------------------------------------- |
| `/login`         | everyone                          | Log in (server action, Zod-validated) + demo account cards |
| `/dashboard`     | logged-in users                   | Welcome panel + role-based quick actions                  |
| `/items`         | STAFF, REVIEWER, ADMIN            | Inventory: stats, filters, search (STAFF sees own items)  |
| `/items/new`     | STAFF, ADMIN                      | Add item form; saved as **Pending** with a StatusLog row  |
| `/items/[id]`    | STAFF (own items), REVIEWER, ADMIN| Item details + status history                             |
| `/pending-queue` | REVIEWER, ADMIN                   | The same inventory table, locked to `Pending`             |
| `/forbidden`     | logged-in users with a wrong role | 403 "Not allowed" page                                    |

Every new item is written in one transaction: the `Item` (status `Pending`, `createdById`
set) plus a `StatusLog` row (`null → Pending`) so the status history starts at creation.

## Approval workflow

A Reviewer opens `/pending-queue`, picks an item, and records the decision on the item page:

- **Approve** moves the item `Pending → In Stock` and clears any earlier rejection reason.
- **Reject** requires a reason, leaves the item `Pending`, and stores the reason on the item
  (`Item.rejectionReason`) and in the status history (`Pending → Pending`).

Rejected items stay in the Pending queue so they can be re-inspected and approved later.
Only `In Stock` items will be sellable once sales land in Week 10.

## Out of scope (Week 10 and later)

- Sales (Sold) and stock tracking
- Reports
