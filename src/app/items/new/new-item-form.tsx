"use client";

import { useActionState } from "react";
import { createItem, type CreateItemState } from "./actions";

const FIELDS = [
  { name: "name", label: "Name", type: "text" },
  { name: "brand", label: "Brand", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "size", label: "Size", type: "text" },
  { name: "condition", label: "Condition", type: "text" },
  { name: "price", label: "Price (₱)", type: "number" },
  { name: "quantity", label: "Quantity", type: "number" },
] as const;

export default function NewItemForm() {
  const [state, formAction, pending] = useActionState<CreateItemState | null, FormData>(
    createItem,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {FIELDS.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="block text-sm font-medium">
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            step={field.type === "number" ? "any" : undefined}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-black"
          />
          {state?.fieldErrors?.[field.name] && (
            <p className="mt-1 text-sm text-red-700">
              {state.fieldErrors[field.name][0]}
            </p>
          )}
        </div>
      ))}

      {state?.error && (
        <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save item"}
      </button>
    </form>
  );
}
