"use client";

import { useActionState } from "react";
import { createItem, type CreateItemState } from "./actions";

const FIELDS = [
  { name: "name", label: "Item name", type: "text", span: "sm:col-span-2", placeholder: "e.g. Levi's Denim Jacket" },
  { name: "brand", label: "Brand", type: "text", span: "", placeholder: "e.g. Levi's" },
  { name: "category", label: "Category", type: "text", span: "", placeholder: "e.g. Jacket" },
  { name: "size", label: "Size", type: "text", span: "", placeholder: "e.g. M" },
  { name: "condition", label: "Condition", type: "text", span: "", placeholder: "e.g. Excellent" },
  { name: "price", label: "Price (₱)", type: "number", span: "", placeholder: "0.00" },
  { name: "quantity", label: "Quantity", type: "number", span: "", placeholder: "1" },
] as const;

export default function NewItemForm() {
  const [state, formAction, pending] = useActionState<CreateItemState | null, FormData>(
    createItem,
    null,
  );

  return (
    <form action={formAction} className="card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.name} className={field.span}>
            <label
              htmlFor={field.name}
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              step={field.type === "number" ? "any" : undefined}
              placeholder={field.placeholder}
              required
              className="field"
            />
            {state?.fieldErrors?.[field.name] && (
              <p className="mt-1.5 text-[12px] text-danger">
                {state.fieldErrors[field.name][0]}
              </p>
            )}
          </div>
        ))}
      </div>

      {state?.error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-danger/20 bg-danger-soft px-4 py-2.5 text-[12.5px] text-danger"
        >
          {state.error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-5">
        <p className="text-[11.5px] text-muted">
          Saved as <strong className="font-semibold text-warn">Pending</strong> with a
          status-log entry.
        </p>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving..." : "Save item"}
        </button>
      </div>
    </form>
  );
}
