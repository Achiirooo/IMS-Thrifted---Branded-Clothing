// Shared constants for roles and item statuses.
// SQLite has no enum type, so these strings live in the DB and are enforced here.
export const ROLES = ["STAFF", "REVIEWER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ITEM_STATUSES = ["Pending", "In Stock", "Sold"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];
