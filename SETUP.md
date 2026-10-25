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

## Database

The schema lives in `prisma/schema.prisma` and contains three models:

- **`User`** — `username` (unique, used to log in), `displayName` (shown in the UI), `passwordHash`,
  `role` (`STAFF` / `REVIEWER` / `ADMIN`).
- **`Item`** — name, brand, category, size, condition, price, quantity, `status`, `rejectionReason`, and `createdById`.
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
| STAFF    | `staff1`    | `staff123`    | Jhezl Baldos | Add items, view only their own items         |
| REVIEWER | `reviewer1` | `reviewer123` | Jessa Bebita | View all items; approve or reject Pending items |
| ADMIN    | `admin1`    | `admin123`    | Dave Briones | Everything                                   |

The login page shows these as demo cards that fill in the credentials for you. They are
**development-only** accounts — do not use them anywhere real.

## Scripts

Every script in `package.json`:

| Script              | Runs                       | When to use                                    |
| ------------------- | -------------------------- | ---------------------------------------------- |
| `npm run dev`       | `next dev`                 | Local development at <http://localhost:3000>.  |
| `npm run build`     | `next build`               | Production build; also catches type errors.    |
| `npm run start`     | `next start`               | Serve the production build (run `build` first).|
| `npm run lint`      | `eslint`                   | Lint the codebase.                             |
| `npm run db:migrate`| `prisma migrate dev`       | Shortcut for applying migrations.              |
| `npm run db:seed`   | `prisma db seed`           | Shortcut for re-seeding demo users.            |

## Verify the install

1. `npm run dev` and open <http://localhost:3000> — you land on `/login`.
2. Sign in as `staff1` / `staff123`.
3. Go to `/items/new`, add an item, and submit.
4. It appears in `/items` with a **Pending** badge.
5. Sign out, sign in as `reviewer1` / `reviewer123`, and open `/pending-queue` — the item is
   listed there.
6. Sign in as `admin1` / `admin123` and confirm `/items` shows every item.

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

## Project structure

```
prisma/
  schema.prisma        Data models (User, Item, StatusLog)
  seed.ts              Demo accounts
  migrations/          Applied migration history
  dev.db               Local SQLite database (gitignored)
src/
  app/                 App Router routes
    login/             Login page, form, server action
    dashboard/         Role-based landing page
    items/             Inventory list, detail, and "new item" form + action
    pending-queue/     Reviewer/Admin view locked to Pending
    forbidden/         403 page for wrong-role access
    globals.css        Tailwind theme tokens
  components/          App shell, nav, inventory widgets, badges
  lib/
    auth.ts            requireRole() — the real server-side guard
    session.ts         iron-session configuration
    db.ts              Shared Prisma client
    constants.ts       Roles, statuses, nav config
  proxy.ts             Next.js 16 request hook: redirects if no session cookie
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
