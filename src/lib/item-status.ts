// Item status flow. The review decision is an action, not a status:
// approve moves Pending -> In Stock, reject leaves the item Pending with a
// reason (Database Design 3.2 / 6.2 / 6.3, Test Plan IMS-05 / IMS-06).
// Sales (Week 10) reuses the same transition table.
import { ITEM_STATUSES, type ItemStatus } from "./constants";

export const REVIEW_DECISIONS = ["approve", "reject"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

// Where each decision leaves the item.
export const DECISION_TARGET: Record<ReviewDecision, ItemStatus> = {
  approve: "In Stock",
  reject: "Pending",
};

const TRANSITIONS: Record<ItemStatus, readonly ItemStatus[]> = {
  Pending: ["In Stock"],
  "In Stock": ["Sold"],
  Sold: [],
};

export function isItemStatus(value: unknown): value is ItemStatus {
  return typeof value === "string" && ITEM_STATUSES.some((s) => s === value);
}

export function isReviewDecision(value: unknown): value is ReviewDecision {
  return (
    typeof value === "string" &&
    REVIEW_DECISIONS.some((decision) => decision === value)
  );
}

// Single place that answers "may this move happen?" — testable without React.
// A rejection is not a move (Pending -> Pending), so callers guard on the
// current status instead of asking this function.
export function canTransition(from: string, to: ItemStatus): boolean {
  if (!isItemStatus(from)) return false;
  return TRANSITIONS[from].includes(to);
}
