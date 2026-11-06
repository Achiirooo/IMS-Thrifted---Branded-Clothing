# Postman / Newman collections

The system tests for the two project modules. They run against the **test deployment**
(`npm run start:test`, `http://localhost:3001`) and its disposable database `prisma/test.db`.

## Files

| File | Purpose |
| --- | --- |
| `IMS-Module-1-Intake-Approval.postman_collection.json` | Authentication/RBAC, item intake (IMS-03/04), approval workflow (IMS-05…08) |
| `IMS-Module-2-Sales-Stock-Reports.postman_collection.json` | Sales + Status Guard (IMS-08/09), low stock (IMS-10), search (IMS-11/15), reports/logging (IMS-12/13) |
| `IMS-Smoke.postman_collection.json` | Fast gate for the Test Plan entry criteria |
| `IMS.local.postman_environment.json` | `baseUrl`, role credentials |

## Before a run

```bash
npm run db:test:prepare     # known-state test database
npm run build:test
npm run start:test          # http://localhost:3001 — keep this terminal open
```

Then, from a second terminal:

```bash
npm run test:smoke
npm run test:module1
npm run test:module2
```

or `npm run test:api` to run both module collections in sequence.

## Running in the Postman app

1. Import the four JSON files (two collections, the smoke collection, and the environment).
2. Select **IMS local test (:3001)** in the environment picker.
3. Use **Collection Runner** on a collection, or run folders individually.

Newman manages cookies per run, so the logins at the start of each folder switch roles cleanly.
Each collection logs in again rather than relying on the previous folder's session.

## Endpoints under test

| Method | Route | Role | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/health` | public | App + database liveness, used by the smoke gate |
| `POST` | `/api/auth/login` | public | JSON `{ username, password }`, sets the `ims-session` cookie |
| `POST` | `/api/auth/logout` | any | Destroys the session |
| `GET` | `/api/auth/me` | any | Current user, or 401 |
| `GET` | `/api/items` | STAFF, ADMIN | `q, status, size, condition, min, max, sort, page, pageSize`; Staff see only their own |
| `POST` | `/api/items` | STAFF | New items start as `Pending`, with the initial status log |
| `GET` | `/api/items/:id` | STAFF, REVIEWER, ADMIN | Includes `statusLogs`; Staff only their own |
| `POST` | `/api/items/:id/review` | REVIEWER | `{ decision: "approve" \| "reject", reason? }`; reject needs a reason |
| `POST` | `/api/items/:id/sell` | STAFF | `In Stock` only |
| `GET` | `/api/reports/summary` | ADMIN | Totals, revenue, low-stock categories, rejection reasons, history |

Status codes used by the assertions:

| Code | Meaning |
| --- | --- |
| 400 | Validation error (`fieldErrors` included when a specific field failed) |
| 401 | No valid session |
| 403 | Wrong role for the endpoint |
| 404 | Item does not exist |
| 409 | Stale decision / double sale / item not `In Stock` |
| 201 | Item created |

## Test data the collections expect

- `staff1` / `staff123`, `staff2` / `staff123`, `reviewer1` / `reviewer123`,
  `admin1` / `admin123`
- `Low Stock Test` category with exactly 5 In Stock items (TC-19)
- `Healthy Stock Test` category with 6 In Stock items (TC-20)
- The 2,000-item dataset for the search-timing check (TC-23)

All of this comes from `npm run db:test:prepare`. The collections create their own items for the
intake, approval, and sale cases, so they do not depend on fixed item IDs and can be re-run.

## Notes

- Never point the environment at `:3000` — that is the development server and its `dev.db`.
- The test build must run with `NODE_ENV=test`; in production mode the session cookie is marked
  `Secure` and Newman over plain HTTP will never receive it.
- SQLite handles one writer at a time, so run the collections sequentially (the default).
