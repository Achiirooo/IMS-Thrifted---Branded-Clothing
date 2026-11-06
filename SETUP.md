# Setup Guide — SQ-Way IMS

Everything you need to run this project from a fresh clone. For what the app does and how
access control works, see [README.md](./README.md).

## Prerequisites

| Tool    | Version      | Notes                                              |
| ------- | ------------ | -------------------------------------------------- |
| Node.js | 20.9+        | Next.js 16 requires it. `node -v` to check.        |
| npm     | 10+          | Ships with Node.                                    |
| Git     | any          | Only needed to clone the repo.                      |

No database server is required — the app uses **SQLite**, a single file on disk that Prisma
creates for you.

## Quick start

```bash
git clone <repo-url>
cd IMS-Thrifted---Branded-Clothing

npm install

# 1. create .env (it is gitignored, so it is not in the repo)
#    see "Environment variables" below

# 2. create the SQLite database and apply migrations
npx prisma migrate dev

# 3. insert the three demo accounts
npx prisma db seed

# 4. run the dev server
npm run dev
```

Open <http://localhost:3000>. You will be redirected to `/login` — sign in with `staff1` /
`staff123`.

> `npx prisma migrate dev` also runs `prisma generate` for you, so the Prisma Client types
> are ready before the first `npm run dev`.

## Environment variables

The app needs two variables. **`.env` is ignored by Git** (`.env*` in `.gitignore`), so every
developer creates their own copy.

Create a file named `.env` in the repo root:

```dotenv
# SQLite file. The path is resolved relative to prisma/schema.prisma,
# so this points at prisma/dev.db
DATABASE_URL="file:./dev.db"

# iron-session cookie encryption key — must be at least 32 characters
SESSION_SECRET="replace-me-with-a-long-random-string"
```

| Variable        | Required | Purpose                                                                 |
| --------------- | -------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`  | yes      | Prisma datasource. `file:./dev.db` → `prisma/dev.db`.                    |
| `SESSION_SECRET`| yes      | Encrypts the `ims-session` cookie via iron-session. Min 32 characters.  |

Generate a random secret instead of typing one out:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Prisma's CLI loads `.env` through `prisma.config.ts` (`import "dotenv/config"`), and Next.js
loads it automatically, so no extra configuration is needed.

> If `SESSION_SECRET` is shorter than 32 characters, iron-session refuses to encrypt the
> session. Logins appear to succeed but you are bounced back to `/login`.

## Environments

Two environments run from the same code with separate databases:

| | Development | Test |
| --- | --- | --- |
| Env file | `.env` | `.env.test` |
| Database | `prisma/dev.db` | `prisma/test.db` |
| Command | `npm run dev` | `npm run build:test` then `npm run start:test` |
| URL | <http://localhost:3000> | <http://localhost:3001> |
| Data | your working data | disposable, reset each cycle |

Next.js loads `.env.test` when `NODE_ENV=test` (and skips `.env.local` in that mode), so the test
build cannot pick up development values. Keep a **different `SESSION_SECRET`** in each file:
cookies are shared across ports on `localhost`, and the different key stops a dev session from
being accepted by the test server.

`.env.example` is committed as the template; `.env` and `.env.test` are gitignored.

### Preparing the test environment

```bash
npm run db:test:prepare   # migrations + accounts + 2,000 items + fixtures
npm run build:test
npm run start:test        # http://localhost:3001
```

`db:test:prepare` runs three steps in this order (the item seeder wipes items, so fixtures must
come last):

1. `db:test:reset` — re-applies migrations and seeds `staff1`, `reviewer1`, `admin1`.
2. `db:test:items` — 2,000 items with their status logs (600 Pending / 1,000 In Stock / 400 Sold).
3. `db:test:fixtures` — adds `staff2`, a `Low Stock Test` category with exactly 5 In Stock items,
   a `Healthy Stock Test` category with 6, and two items owned by `staff2`.

Run it before every test cycle — the Test Plan requires a known state, and it makes the counts in
the Postman assertions deterministic. It only touches `prisma/test.db`; development data is never
modified. For defect fixing, `npm run dev:test` is faster than a full rebuild.

## Database

The schema lives in `prisma/schema.prisma` and contains three models:

- **`User`** — `username` (unique, used to log in), `displayName` (shown in the UI), `passwordHash`,
  `role` (`STAFF` / `REVIEWER` / `ADMIN`).
- **`Item`** — name, brand, category, size, condition, price, `status`, `rejectionReason`, and `createdById`.
- **`StatusLog`** — audit trail of status changes (`oldStatus` → `newStatus`, who, when, reason).

SQLite has no enum type, so `role` and `status` are plain strings validated in app code
(allowed statuses: `Pending`, `In Stock`, `Sold`).

### Migrations

`prisma/migrations/` holds the applied history:

| Migration                          | What it does                          |
| ---------------------------------- | ------------------------------------- |
| `20261012065650_init`              | Creates `User`, `Item`, `StatusLog`.  |
| `20261020235943_add_user_display_name` | Adds the `User.displayName` column. |
| `20261025112017_add_item_rejection_reason` | Adds the `Item.rejectionReason` column. |
| `20261025130000_week10_sales_stock_reports` | Drops `Item.quantity`; adds search/stock/report indexes. |

Common commands:

```bash
npx prisma migrate dev              # apply pending migrations (and generate the client)
npx prisma migrate dev --name foo   # create + apply a new migration after editing the schema
npx prisma migrate reset            # DROP the database, re-apply migrations, re-run the seed
npx prisma generate                 # regenerate the client after a schema edit
npx prisma studio                   # browse/edit data in a local GUI
```

`prisma migrate reset` is destructive — it wipes `prisma/dev.db`. Use it when the local data
gets messy; it re-seeds automatically.

### Seeding

`prisma/seed.ts` creates one account per role. It uses `upsert`, so **it is safe to run
repeatedly** — existing users are updated rather than duplicated.

```bash
npx prisma db seed
# Seeded STAFF: staff1
# Seeded REVIEWER: reviewer1
# Seeded ADMIN: admin1
```

The seed command is wired up in `prisma.config.ts`:

```ts
migrations: { seed: "npx tsx prisma/seed.ts" }
```

### Seeded accounts

| Role     | Username    | Password      | Display name | Can do                                       |
| -------- | ----------- | ------------- | ------------ | -------------------------------------------- |
| STAFF    | `staff1`    | `staff123`    | Jhezl Baldos | Add items, view own items, sell In Stock items |
| REVIEWER | `reviewer1` | `reviewer123` | Jessa Bebita | Work the Pending queue; approve or reject items |
| ADMIN    | `admin1`    | `admin123`    | Dave Briones | Search inventory, low-stock alerts, status reports |
| STAFF    | `staff2`    | `staff123`    | Mika Santos  | Test database only — used by TC-22 (staff data isolation) |

The login page shows these as demo cards that fill in the credentials for you. They are
**development-only** accounts — do not use them anywhere real.

## Scripts

Every script in `package.json`:

| Script              | Runs                       | When to use                                    |
| ------------------- | -------------------------- | ---------------------------------------------- |
| `npm run dev`       | `next dev`                 | Local development at <http://localhost:3000>.  |
| `npm run dev:test`  | `next dev` on port 3001    | Fast iteration against `prisma/test.db`.      |
| `npm run build`     | `next build`               | Production build; also catches type errors.    |
| `npm run start`     | `next start`               | Serve the production build (run `build` first).|
| `npm run build:test`| `next build` with `NODE_ENV=test` | Build the test deployment.             |
| `npm run start:test`| `next start` on port 3001  | Serve the test build with `.env.test`.         |
| `npm run lint`      | `eslint`                   | Lint the codebase.                             |
| `npm run db:migrate`| `prisma migrate dev`       | Shortcut for applying migrations.              |
| `npm run db:seed`   | `prisma db seed`           | Shortcut for re-seeding demo users.            |
| `npm run db:seed:items` | `tsx prisma/seed-items.ts` | Create the 2,000-item test dataset (add `-- --force` to reset). |
| `npm run db:test:reset` | `prisma migrate reset` on `test.db` | Wipe + rebuild the test database and accounts. |
| `npm run db:test:items` | `tsx prisma/seed-items.ts --force` on `test.db` | Recreate the 2,000-item dataset. |
| `npm run db:test:fixtures` | `tsx prisma/seed-test-fixtures.ts` on `test.db` | Add `staff2` and the low/healthy stock categories. |
| `npm run db:test:prepare` | all three test steps | Reset the test environment to a known state. |
| `npm run test:smoke` | Newman smoke collection | Gate before formal testing (login → add → approve → sell → report). |
| `npm run test:module1` | Newman Module 1 | Intake and approval tests (IMS-01…IMS-08). |
| `npm run test:module2` | Newman Module 2 | Sales, stock, search, reports (IMS-08…IMS-15). |
| `npm run test:api` | both module collections | Full automated system test. |

## Automated tests (Postman + Newman)

The Test Plan requires system testing with Postman collections run through Newman against a
dedicated test deployment. The collections are grouped into the two project modules:

| Command | Collection | Covers |
| --- | --- | --- |
| `npm run test:smoke` | `postman/IMS-Smoke.postman_collection.json` | Login → add → approve → sell → report; the entry-criteria gate |
| `npm run test:module1` | Module 1 — Item Intake & Approval | IMS-01…IMS-08, status rules, rejection reason, RBAC |
| `npm run test:module2` | Module 2 — Sales, Stock, Search & Reports | IMS-08…IMS-15, low stock, search timing, totals/logging |
| `npm run test:api` | Module 1 + Module 2 | Full automated system test |

Order for a formal cycle:

```bash
npm run db:test:prepare
npm run build:test
npm run start:test          # keep this terminal open, listening on :3001
npm run test:smoke          # in a second terminal
npm run test:api
```

The collections create their own items through the API, so they can be run repeatedly and in any
order. See `postman/README.md` for the endpoint list, environment variables, and how to open the
collections in the Postman app. Screen-level checks that cannot be automated (two-click
approve/reject, layout, the missing photo field) stay manual in [TEST-CASES.md](./TEST-CASES.md).

## Verify the install

1. `npm run dev` and open <http://localhost:3000> — you land on `/login`.
2. Sign in as `staff1` / `staff123`.
3. Go to `/items/new`, add an item, and submit.
4. It appears in `/items` with a **Pending** badge.
5. Sign out, sign in as `reviewer1` / `reviewer123`, and open `/pending-queue` — the item is
   listed there.
6. Approve the item and confirm its status becomes **In Stock**.
7. Sign in as `staff1` again, open `/sales`, and sell the item — it becomes **Sold** and the
   status history shows `In Stock → Sold`.
8. Sign in as `admin1` / `admin123` and confirm `/items` shows every item, `/dashboard` shows
   low-stock alerts, and `/reports` shows the totals and history.
9. (Optional) `npm run db:seed:items -- --force` and repeat the Admin search to check the
   2,000-item dataset.

If step 3 fails, check the terminal for Prisma errors and confirm `.env` exists.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| Login succeeds but you keep landing on `/login` | `SESSION_SECRET` under 32 chars, or `.env` missing | Regenerate the secret, restart the dev server. |
| `Environment variable not found: DATABASE_URL` | `.env` missing or in the wrong folder | Create `.env` in the repo root (next to `package.json`). |
| `The table main.User does not exist` | Migrations never applied | `npx prisma migrate dev` |
| `PrismaClientInitializationError` / type errors about missing fields | Client out of sync with the schema | `npx prisma generate`, then restart `dev`. |
| Blank/incorrect pages after switching branches | Stale build cache | Stop the server, delete `.next/`, restart. |
| `Error: listen EADDRINUSE :::3000` | Another process owns port 3000 | `npm run dev -- -p 3001` |
| `database is locked` | A second dev server or Prisma Studio holding the SQLite file | Close the other process and retry. |
| Seed does nothing | It already ran | Expected — `upsert` updates instead of duplicating. |
| Newman gets 401 on every request | Test build was started with `NODE_ENV=production` (Secure cookie over HTTP), or you are pointed at :3000 | Use `npm run start:test` and `baseUrl=http://localhost:3001`. |
| Newman gets an HTML redirect instead of JSON | `src/proxy.ts` stopped excluding `/api` from its matcher | Restore `(?!api|_next/static|_next/image|favicon.ico)`. |
| Low-stock test fails | `db:test:fixtures` ran before `db:test:items`, which wipes items | Re-run `npm run db:test:prepare`. |
| `prisma migrate status` shows the wrong database | A shell `DATABASE_URL` or the wrong env file is active | Run `cross-env DATABASE_URL=file:./test.db npx prisma migrate status`. |

## Project structure

```
prisma/
  schema.prisma        Data models (User, Item, StatusLog)
  seed.ts              Demo accounts
  seed-items.ts        2,000-item test dataset (IMS-15)
  seed-test-fixtures.ts staff2 + low/healthy stock categories (test DB only)
  migrations/          Applied migration history
  dev.db               Local SQLite database (gitignored)
  test.db              Test database, reset per cycle (gitignored)
src/
  app/                 App Router routes
    api/               REST endpoints used by the Postman collections
    login/             Login page, form, server action
    dashboard/         Role-based landing page
    items/             Inventory list, detail, and "new item" form + action
    pending-queue/     Reviewer queue locked to Pending
    sales/             Sale/checkout screen (In Stock only)
    reports/           Admin status reports
    forbidden/         403 page for wrong-role access
    globals.css        Tailwind theme tokens
  components/          App shell, nav, inventory widgets, badges
  lib/
    auth.ts            requireRole() — the real server-side guard
    api.ts             JSON/status helpers for the REST endpoints
    services/          Business rules shared by the UI and the API
      items.ts         create / review / sell item
      queries.ts       search, status totals, low stock, reports
      auth.ts          login check (bcrypt)
    session.ts         iron-session configuration
    db.ts              Shared Prisma client
    constants.ts       Roles, statuses, nav config
  proxy.ts             Next.js 16 request hook: session check (skips /api)
postman/               Postman collections, environment, and README
next.config.ts         Turbopack + Tailwind loader config
prisma.config.ts       Prisma CLI config (loads .env, seed command)
```

## Production notes

```bash
npm run build
npm run start
```

- `SESSION_SECRET` must be a real random value in production, and the site must be served over
  HTTPS for the `Secure` cookie flag to apply (it is enabled when `NODE_ENV=production`).
- SQLite stores everything in `prisma/dev.db`, which is fine for a single-user demo but not for
  concurrent multi-user hosting. Moving to Postgres means changing the `datasource` provider and
  the `DATABASE_URL`.
