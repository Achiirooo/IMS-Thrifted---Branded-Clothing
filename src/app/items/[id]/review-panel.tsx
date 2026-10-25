"use client";

import { useActionState, useState } from "react";
import { reviewItem, type ReviewState } from "./actions";
import { CheckIcon, ShieldIcon } from "@/components/icons";

export function ReviewPanel({ itemId }: { itemId: number }) {
  const [state, formAction, pending] = useActionState<ReviewState | null, FormData>(
    reviewItem,
    null,
  );
  const [reason, setReason] = useState("");
  // Mirrors the server rule so the Reject button is honest about what it needs.
  const canReject = reason.trim().length >= 3;

  return (
    <form action={formAction} className="card border-brand/30 p-6">
      <input type="hidden" name="itemId" value={itemId} />

      <p className="label-caps">Reviewer decision</p>
      <p className="mt-1.5 max-w-xl text-[12.5px] text-muted">
        Approving moves this item to <strong className="text-ink">In Stock</strong>.
        Rejecting requires a reason and leaves it <strong className="text-ink">Pending</strong>.
        Both are written to the status history with your name.
      </p>

      <label
        htmlFor="reason"
        className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        Reason{" "}
        <span className="font-normal normal-case tracking-normal text-muted/80">
          (required to reject, optional to approve)
        </span>
      </label>
      <textarea
        id="reason"
        name="reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        maxLength={280}
        placeholder="e.g. Stained collar, not as described"
        className="field mt-1.5 resize-y"
      />

      {state?.error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger"
        >
          {state.error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="btn-primary"
        >
          <CheckIcon className="h-4 w-4" />
          {pending ? "Saving..." : "Approve item"}
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending || !canReject}
          className="btn-ghost border-danger/30 bg-danger-soft text-danger hover:bg-danger/10"
        >
          <ShieldIcon className="h-4 w-4" />
          Reject item
        </button>
      </div>
    </form>
  );
}
