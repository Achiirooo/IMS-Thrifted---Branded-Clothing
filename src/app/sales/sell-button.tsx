"use client";

import { useActionState } from "react";
import { sellItem, type SaleState } from "./actions";
import { BagIcon } from "@/components/icons";

export function SellButton({ itemId, label }: { itemId: number; label: string }) {
  const [state, formAction, pending] = useActionState<SaleState | null, FormData>(
    sellItem,
    null,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Record the sale of "${label}"?`)) {
          event.preventDefault();
        }
      }}
      className="text-right"
    >
      <input type="hidden" name="itemId" value={itemId} />
      <button type="submit" disabled={pending} className="btn-primary py-2 text-[12px]">
        <BagIcon className="h-4 w-4" />
        {pending ? "Saving..." : "Sell"}
      </button>
      {state?.error && (
        <p role="alert" className="mt-1.5 max-w-[220px] text-[11px] text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
