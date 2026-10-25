# Test Cases — IMS for Thrifted & Branded Surplus Clothing

Companion to `Documents/Test Plan IMS for Thrifted & Branded Surplus Clothing.pdf`.
Each case traces to a Test Plan scenario (IMS-01 to IMS-15) and a WBS task.

- **Build under test:** `main` after IMS-03-02 / IMS-04-01 / IMS-04-02
- **Environment:** local `npm run dev` at <http://localhost:3000>, SQLite `prisma/dev.db`
- **Accounts:** `staff1` / `staff123`, `reviewer1` / `reviewer123`, `admin1` / `admin123`
- **Dataset:** `npm run db:seed:items -- --force` (2,000 items, 30% Pending / 50% In Stock / 20% Sold)

## Conventions

| Field | Values |
| --- | --- |
| Priority | Critical, High, Medium, Low |
| Type | RBAC, Functional, Validation, Integration, Performance, Security |
| Result | Pass, Fail, Blocked, Not Run |

Status values in the build: `Pending`, `In Stock`, `Sold`. Rejections keep the item `Pending`
and store the reason on the item and in `StatusLog`.

## 1. Authentication and RBAC

### TC-01 — Staff cannot reach Reviewer/Admin screens (IMS-01)
**Priority:** Critical · **Type:** RBAC · **Actor:** STAFF
**Preconditions:** signed in as `staff1`.
**Steps:**
1. Open `/pending-queue` directly.
2. Open `/reports` directly.
3. Open `/sales`.
**Expected:** steps 1–2 redirect to `/forbidden`; step 3 opens the sales screen. No status
changes or log rows are created by the blocked requests.

### TC-02 — Admin cannot add or review items (IMS-02)
**Priority:** Critical · **Type:** RBAC · **Actor:** ADMIN
**Preconditions:** signed in as `admin1`; one Pending item exists.
**Steps:**
1. Open `/items/new`.
2. Open `/pending-queue`.
3. Submit a crafted `reviewItem` POST with `decision=approve` for the Pending item.
**Expected:** steps 1–2 redirect to `/forbidden`; step 3 is rejected by `requireRole("REVIEWER")`,
the item stays Pending, and no log row is written.

### TC-03 — Reviewer cannot add items or sell (IMS-02)
**Priority:** Critical · **Type:** RBAC · **Actor:** REVIEWER
**Preconditions:** signed in as `reviewer1`.
**Steps:**
1. Open `/items/new`.
2. Open `/sales`.
3. Open `/items`.
**Expected:** all three redirect to `/forbidden`. The Reviewer only sees Dashboard and Pending Queue
in the navigation.

### TC-04 — Login, session, and logout
**Priority:** High · **Type:** Functional · **Actor:** All
**Steps:**
1. Submit `/login` with a wrong password.
2. Submit with `staff1` / `staff123`.
3. Open `/dashboard` directly, then sign out and open `/dashboard` again.
**Expected:** step 1 shows an error and no session; step 2 lands on `/dashboard`; after sign-out the
protected page redirects to `/login`.

### TC-05 — Unauthenticated access is blocked
**Priority:** High · **Type:** Security · **Actor:** Anonymous
**Steps:** open `/items`, `/sales`, `/reports`, `/pending-queue` in a private window.
**Expected:** every route redirects to `/login` via `src/proxy.ts`.

## 2. Item intake

### TC-06 — Add a valid item (IMS-03)
**Priority:** Critical · **Type:** Functional · **Actor:** STAFF
**Preconditions:** signed in as `staff1`.
**Steps:**
1. Open `/items/new`.
2. Enter name, brand, category, size, condition, and price (e.g. 1299).
3. Submit.
**Expected:** item is saved as **Pending**, appears in `/items`, and the status history shows
`Created → Pending` with the Staff user and timestamp.

### TC-07 — Required fields are enforced (IMS-04)
**Priority:** High · **Type:** Validation · **Actor:** STAFF
**Steps:** submit the form with each required field empty in turn (name, brand, category, size,
condition, price).
**Expected:** submission is blocked with a field-level error; no item is created.

### TC-08 — Price validation (IMS-04)
**Priority:** High · **Type:** Validation · **Actor:** STAFF
**Steps:** submit price `0`, `-50`, and `abc`.
**Expected:** each is blocked with "Price must be greater than 0" or a numeric error; no item is
created.

### TC-09 — Photo requirement (IMS-03 / IMS-04)
**Priority:** High · **Type:** Functional · **Actor:** STAFF · **Status:** Known gap
**Steps:** submit an item with a valid photo and with an unsupported file type.
**Expected (Test Plan):** a valid photo is stored and shown on the item; an unsupported file is
rejected. **Current build:** the form has no photo field, so this case fails until the upload is
implemented. Log as High.

## 3. Approval workflow

### TC-10 — Approve a Pending item (IMS-05)
**Priority:** Critical · **Type:** Functional · **Actor:** REVIEWER
**Preconditions:** one Pending item; signed in as `reviewer1`.
**Steps:**
1. Open `/pending-queue`.
2. Click **Review** on the item.
3. Click **Approve item**.
**Expected:** status becomes **In Stock**; the item leaves the Pending queue; the history shows
`Pending → In Stock` with the Reviewer and timestamp; the rejection reason (if any) is cleared.

### TC-11 — Reject with a reason (IMS-06)
**Priority:** Critical · **Type:** Functional · **Actor:** REVIEWER
**Preconditions:** one Pending item; signed in as `reviewer1`.
**Steps:**
1. Open the item from `/pending-queue`.
2. Enter a reason (e.g. "Stained collar").
3. Click **Reject item**.
**Expected:** status stays **Pending**; the item remains in the Pending queue; the reason is shown
on the item record and stored in `Item.rejectionReason`; the history shows `Pending → Pending` with
the reason, Reviewer, and timestamp.

### TC-12 — Reject without a reason (IMS-07)
**Priority:** High · **Type:** Validation · **Actor:** REVIEWER
**Steps:** open a Pending item and click **Reject item** with the reason blank or under 3 characters.
**Expected:** the Reject button is disabled and a server-side POST is blocked with "Give a reason for
rejecting this item."; status and history are unchanged.

### TC-13 — Stale decision is a no-op
**Priority:** High · **Type:** Integration · **Actor:** REVIEWER
**Steps:** open the same Pending item in two tabs, approve it in tab A, then approve it in tab B.
**Expected:** tab A succeeds; tab B shows "Someone else already reviewed this item" (or "already in
stock") and writes no second log row.

### TC-14 — Two-click review (IMS-14)
**Priority:** Medium · **Type:** Usability · **Actor:** REVIEWER
**Steps:** starting from `/pending-queue`, count clicks to approve one item (and to reject one,
excluding typing the reason).
**Expected:** **Review → Approve** = 2 clicks; **Review → Reject** = 2 clicks plus typing the reason.

## 4. Sales and the Status Guard

### TC-15 — Sell an In Stock item (IMS-09)
**Priority:** Critical · **Type:** Functional · **Actor:** STAFF
**Preconditions:** one In Stock item; signed in as `staff1`.
**Steps:**
1. Open `/sales`.
2. Click **Sell** on the item and confirm.
**Expected:** status becomes **Sold**; the item disappears from `/sales`; the Admin In Stock count
decreases by one; the history shows `In Stock → Sold` with the Staff user and timestamp.

### TC-16 — Pending and Sold items cannot be sold (IMS-08)
**Priority:** Critical · **Type:** Integration · **Actor:** STAFF
**Preconditions:** one Pending item and one Sold item.
**Steps:**
1. Confirm neither appears on `/sales`.
2. Submit a crafted `sellItem` POST with each item's ID.
**Expected:** both are rejected with "Only In Stock items can be sold."; statuses stay unchanged and
no log rows are written.

### TC-17 — Double sale race
**Priority:** High · **Type:** Integration · **Actor:** STAFF
**Steps:** open `/sales` in two tabs and sell the same item in both.
**Expected:** exactly one sale succeeds; the second shows "Someone else already sold this item";
only one `In Stock → Sold` log row exists.

### TC-18 — Reviewer/Admin cannot sell
**Priority:** High · **Type:** RBAC · **Actor:** REVIEWER, ADMIN
**Steps:** open `/sales` as each role and submit a crafted `sellItem` POST.
**Expected:** both redirect to `/forbidden`; no status change is written.

## 5. Stock and low-stock alerts

### TC-19 — Low-stock alert at or below threshold (IMS-10)
**Priority:** High · **Type:** Functional · **Actor:** ADMIN
**Preconditions:** a category with 5 or fewer In Stock items.
**Steps:** sign in as `admin1` and open `/dashboard`.
**Expected:** the category appears under **Low stock alerts** with its In Stock count.

### TC-20 — Healthy category is not flagged
**Priority:** Medium · **Type:** Functional · **Actor:** ADMIN
**Preconditions:** a category with 6 or more In Stock items.
**Steps:** open `/dashboard`.
**Expected:** the category is not listed in **Low stock alerts**; the alert count matches the number
of flagged categories.

## 6. Inventory search

### TC-21 — Admin search and filters (IMS-11)
**Priority:** High · **Type:** Functional · **Actor:** ADMIN
**Steps:** on `/items`, search by brand, filter by size and condition, filter by status, and set a
price range; then search for a string that matches nothing.
**Expected:** only matching items are returned; the empty state reads "No items found" with a hint to
clear filters; the result count matches the filtered rows.

### TC-22 — Staff sees only their own items
**Priority:** High · **Type:** RBAC · **Actor:** STAFF
**Preconditions:** items created by `staff1` and by another user.
**Steps:** sign in as `staff1` and open `/items`, including a direct `/items/{id}` URL for another
user's item.
**Expected:** the list contains only `staff1` items; the other item's detail page redirects to
`/forbidden`.

### TC-23 — Search performance on 2,000 items (IMS-15)
**Priority:** High · **Type:** Performance · **Actor:** ADMIN
**Preconditions:** `npm run db:seed:items -- --force` completed.
**Steps:** open `/items`, run five different searches/filters, and measure the time from submit to
results.
**Expected:** each result page loads in under 2 seconds.

## 7. Reports and logging

### TC-24 — Status totals are accurate (IMS-12)
**Priority:** High · **Type:** Functional · **Actor:** ADMIN
**Steps:** compare `/reports` Pending / In Stock / Sold counts with `/items` and the database
(`SELECT status, COUNT(*) FROM Item GROUP BY status`).
**Expected:** totals match exactly; revenue equals the sum of prices for Sold items.

### TC-25 — Rejection reasons appear in the report (IMS-12)
**Priority:** High · **Type:** Functional · **Actor:** ADMIN
**Preconditions:** at least one item rejected with a reason.
**Steps:** open `/reports` and read the **Rejection reasons** table.
**Expected:** the item, category, reason, and date are shown; the reason matches `Item.rejectionReason`.

### TC-26 — Status history is complete (IMS-13)
**Priority:** High · **Type:** Functional · **Actor:** ADMIN
**Steps:** create, approve, reject, and sell items, then open `/reports` and the item detail pages.
**Expected:** every change has item, previous status, new status, user, timestamp, and (for
rejections) the reason; no change is missing or duplicated.

### TC-27 — Every transition is logged in one transaction
**Priority:** Critical · **Type:** Integration · **Actor:** All
**Steps:** stop the app during a review/sale if possible, then inspect the database; otherwise
verify that item status and log rows always agree after each action.
**Expected:** no item status exists without its matching `StatusLog` row.

## 8. Security

### TC-28 — Passwords are hashed
**Priority:** High · **Type:** Security · **Actor:** ADMIN
**Steps:** inspect `SELECT username, passwordHash FROM User`.
**Expected:** values are bcrypt hashes, never plain text.

### TC-29 — Session cookie cannot be forged
**Priority:** High · **Type:** Security · **Actor:** Anonymous
**Steps:** modify or delete the `ims-session` cookie and open a protected page.
**Expected:** the session is rejected and the user is redirected to `/login`.

## Traceability

| Test case | Test Plan | WBS |
| --- | --- | --- |
| TC-01, TC-02, TC-03 | IMS-01, IMS-02 | 3.1.2 |
| TC-04, TC-05 | IMS-01 | 3.1.1 |
| TC-06–TC-09 | IMS-03, IMS-04 | 3.1.3 |
| TC-10–TC-14 | IMS-05, IMS-06, IMS-07, IMS-14 | 3.2.1–3.2.3 |
| TC-15–TC-18 | IMS-08, IMS-09 | 4.1.1, 4.1.3 |
| TC-19, TC-20 | IMS-10 | 4.1.2 |
| TC-21–TC-23 | IMS-11, IMS-15 | 4.2.1 |
| TC-24–TC-26 | IMS-12, IMS-13 | 4.2.2, 4.2.3 |
| TC-27 | IMS-13 | 4.2.3 |
| TC-28, TC-29 | Security NFR | 3.1.2 |

## Defect log template

| Field | Value |
| --- | --- |
| Defect ID | DEF-001 |
| Test case | TC-xx |
| Severity | Critical / High / Medium / Low |
| Steps to reproduce | |
| Expected | |
| Actual | |
| Evidence | Screenshot / console / SQL output |
| Status | Open / Fixed / Retest / Closed |
