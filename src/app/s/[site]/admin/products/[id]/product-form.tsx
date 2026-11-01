"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { Select } from "@/components/ui/select";
import { errorText, PRODUCT_STATUSES } from "@/lib/validation";
import type { ProductFormState } from "../../actions";

export type ProductFormData = {
  title: Record<"de" | "fr" | "it" | "en", string>;
  status: string;
  variants: {
    id: string;
    label: string;
    sku: string;
    price: string; // "49.90"
    stock: { locationId: string; levelId: string | null; quantity: number }[];
  }[];
  locations: { id: string; name: string }[];
};

export function ProductForm({
  action,
  product,
  heading,
  viewHref,
  backHref,
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product: ProductFormData;
  heading: string;
  viewHref: string;
  backHref: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const err = (name: string) => (errors[name] ? errorText(errors[name], "en") : undefined);
  const saved = state.savedAt != null && !state.fieldErrors && !isPending;

  return (
    <form
      // Submit through onSubmit so React doesn't reset the inputs: invalid values stay visible next to their error.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      noValidate
      className="space-y-6"
    >
      <Link href={backHref} className="text-sm text-muted hover:text-foreground">
        ← Products
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-2xl font-black tracking-tight">{heading}</h1>
        <div className="flex items-center gap-3">
          <p role="status" className="w-16 text-right text-sm font-semibold text-green-700">
            {saved ? "Saved ✓" : ""}
          </p>
          <Link href={viewHref} className="btn btn-ghost h-10 px-4 py-0">
            View
          </Link>
          <button className="btn h-10 min-w-24 px-4 py-0" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      {state.fieldErrors && (
        <p className="rounded-md bg-accent/10 px-4 py-3 text-sm text-accent">Please fix the highlighted fields.</p>
      )}

      <section className="grid gap-4 rounded-lg bg-background p-4 ring-1 ring-line sm:grid-cols-2 lg:grid-cols-5">
        {(["de", "fr", "it", "en"] as const).map((l) => (
          <Field key={l} name={`title_${l}`} label={`Title (${l})`} error={err(`title_${l}`)}>
            {(aria) => <input className="input" name={`title_${l}`} defaultValue={product.title[l]} {...aria} />}
          </Field>
        ))}
        <Field name="status" label="Status" error={err("status")}>
          {(aria) => (
            <Select
              id={aria.id}
              name="status"
              defaultValue={product.status}
              options={PRODUCT_STATUSES.map((s) => ({ value: s, label: s }))}
              invalid={!!aria["aria-invalid"]}
              describedBy={aria["aria-describedby"]}
            />
          )}
        </Field>
      </section>

      <section className="overflow-x-auto rounded-lg bg-background ring-1 ring-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Price (CHF)</th>
              {product.locations.map((l) => (
                <th key={l.id} className="whitespace-nowrap px-4 py-3">
                  Stock · {l.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {product.variants.map((v) => (
              <tr key={v.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-2 font-medium leading-10">{v.label}</td>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs leading-10 text-muted">{v.sku}</td>
                <td className="px-4 py-2">
                  <Field name={`prices.${v.id}`} label={`Price ${v.label}`} srLabel error={err(`prices.${v.id}`)}>
                    {(aria) => (
                      <input
                        className="input w-28 tabular-nums"
                        name={`prices.${v.id}`}
                        inputMode="decimal"
                        defaultValue={v.price}
                        {...aria}
                      />
                    )}
                  </Field>
                </td>
                {v.stock.map((s) => (
                  <td key={s.locationId} className="px-4 py-2">
                    {s.levelId ? (
                      <Field
                        name={`stock.${s.levelId}`}
                        label={`Stock ${v.label}`}
                        srLabel
                        error={err(`stock.${s.levelId}`)}
                      >
                        {(aria) => (
                          <input
                            className="input w-20 tabular-nums"
                            type="text"
                            inputMode="numeric"
                            name={`stock.${s.levelId}`}
                            defaultValue={s.quantity}
                            {...aria}
                          />
                        )}
                      </Field>
                    ) : (
                      <span className="leading-10 text-muted">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </form>
  );
}

type Aria = { id: string; "aria-invalid"?: true; "aria-describedby"?: string };

function Field({
  name,
  label,
  srLabel,
  error,
  children,
}: {
  name: string;
  label: string;
  srLabel?: boolean;
  error?: string;
  children: (aria: Aria) => React.ReactNode;
}) {
  const id = `f-${name.replace(/\W/g, "-")}`;
  const errorId = `${id}-error`;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={srLabel ? "sr-only" : "label"}>
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="field-error max-w-40">
          {error}
        </p>
      )}
    </div>
  );
}
