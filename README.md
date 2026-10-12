# SQ-Way — Inventory Management System for Thrifted & Branded Surplus Clothing

School project (Weeks 4–14). **This repository currently contains the Week 8 deliverables**
(WBS 3.1.1 Database Tables & Login, 3.1.2 Role-Based Access Control, 3.1.3 New Items = Pending).

Built with Next.js 16 (App Router, TypeScript, Tailwind CSS), Prisma + SQLite, iron-session, and Zod.

## Setup

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

| Role     | Username   | Password     | Can do                                    |
| -------- | ---------- | ------------ | ----------------------------------------- |
| STAFF    | `staff1`   | `staff123`   | Add items, view only their own items      |
| REVIEWER | `reviewer1`| `reviewer123`| View all items (approval comes Week 9)    |
| ADMIN    | `admin1`   | `admin123`   | Everything                                |

## How access control works

1. **`src/proxy.ts`** (Next.js 16's replacement for `middleware.ts`) — optimistic check: anyone
   without a valid session cookie is redirected to `/login`.
2. **`requireRole(...roles)` in `src/lib/auth.ts`** — the real, server-side check. Every protected
   page and server action calls it, so hidden buttons are never the only protection. A logged-in
   user with the wrong role is redirected to **`/forbidden`** ("Not allowed").
3. **Dashboard** — shows only the links the logged-in role may use.

## Pages

| Route         | Who                                         | What                                                     |
| ------------- | ------------------------------------------- | -------------------------------------------------------- |
| `/login`      | everyone                                    | Log in (server action, Zod-validated)                    |
| `/dashboard`  | logged-in users                             | Role-based links + logout                                |
| `/items/new`  | STAFF, ADMIN                                | Add item form; saved as **Pending** with a StatusLog row |
| `/items`      | STAFF, REVIEWER, ADMIN                      | List: STAFF sees own items, others see all               |
| `/forbidden`  | logged-in users with a wrong role           | 403 "Not allowed" page                                   |

Every new item is written in one transaction: the `Item` (status `Pending`, `createdById`
set) plus a `StatusLog` row (`null → Pending`) so the status history starts at creation.

## Out of scope (Week 9 and later)

- Approval queue / reviewer actions (Approved, Rejected)
- Sales (Sold) and stock tracking
- Reports
