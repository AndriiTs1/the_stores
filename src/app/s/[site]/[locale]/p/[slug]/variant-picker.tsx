"use client";

import { useActionState, useMemo, useState } from "react";
import { QuantityStepper } from "@/components/quantity-stepper";
import { StableText } from "@/components/stable-text";
import { discountLabel } from "@/lib/money";
import { errorText } from "@/lib/validation";
import type { AddToCartState } from "../../actions";

export type PickerVariant = {
  id: string;
  options: Record<string, string>;
  price: string;
  compareAt: string | null;
  /** Whole percent off compareAt; null: no label. */
  discount: number | null;
  stock: number;
};

type Labels = {
  addToCart: string;
  soldOut: string;
  inStock: string;
  quantity: string;
  decrease: string;
  increase: string;
  maxAvailable: string;
};

export function VariantPicker({
  initialVariantId,
  variants,
  optionNames,
  optionLabels,
  valueLabels,
  valueVariants,
  labels,
  locale,
  action,
}: {
  /** From ?v= — keeps the chosen size/colour across a language switch or reload. */
  initialVariantId?: string;
  variants: PickerVariant[];
  optionNames: string[];
  optionLabels: Record<string, string>;
  /** option name → stored value → label in the page language */
  valueLabels: Record<string, Record<string, string>>;
  /** option name → stored value → its label in every language of the store */
  valueVariants: Record<string, Record<string, string[]>>;
  labels: Labels;
  locale: string;
  action: (state: AddToCartState, formData: FormData) => Promise<AddToCartState>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  // Start on the variant from the URL, else the first one in stock.
  const initial = variants.find((v) => v.id === initialVariantId) ?? variants.find((v) => v.stock > 0) ?? variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(initial?.options ?? {});

  const values = useMemo(
    () => Object.fromEntries(optionNames.map((name) => [name, [...new Set(variants.map((v) => v.options[name]))]])),
    [variants, optionNames],
  );

  const current = variants.find((v) => optionNames.every((n) => v.options[n] === selected[n]));
  const max = Math.min(99, current?.stock ?? 0);
  const soldOut = !current || max === 0;
  // Chosen quantity; switching to a variant with less stock caps it there.
  const [wanted, setWanted] = useState(1);
  const quantity = Math.max(1, Math.min(wanted, max || 1));

  function select(name: string, value: string) {
    const next = { ...selected, [name]: value };
    setSelected(next);
    // Keep the choice in the URL (?v=) without a server round-trip; Next keeps useSearchParams in sync.
    const variant = variants.find((v) => optionNames.every((n) => v.options[n] === next[n]));
    const url = new URL(window.location.href);
    if (variant) url.searchParams.set("v", variant.id);
    else url.searchParams.delete("v");
    window.history.replaceState(null, "", url);
  }

  // A value is available if some variant with it (and the other current choices) has stock.
  function isAvailable(name: string, value: string) {
    return variants.some(
      (v) =>
        v.stock > 0 &&
        v.options[name] === value &&
        optionNames.every((n) => n === name || v.options[n] === selected[n]),
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-6">
      <div>
        {/* Wraps as a whole: on a narrow screen the discount label moves under the prices without an indent. */}
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display text-2xl font-bold tabular-nums">
          <span className={current?.compareAt ? "text-accent" : ""}>{current?.price}</span>
          {current?.compareAt && (
            <span className="text-base font-normal text-muted line-through">{current.compareAt}</span>
          )}
          {current?.discount != null && (
            <span className="self-center rounded bg-accent px-2 py-0.5 font-sans text-sm font-semibold text-accent-ink">
              {discountLabel(current.discount)}
            </span>
          )}
        </p>
      </div>

      {optionNames.map((name) => (
        <fieldset key={name}>
          <legend className="label">
            {optionLabels[name] ?? name}:{" "}
            <span className="text-foreground">{valueLabels[name]?.[selected[name]] ?? selected[name]}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {values[name].map((value) => {
              const active = selected[name] === value;
              const available = isAvailable(name, value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => select(name, value)}
                  // Selected: red ring and text, never a black fill.
                  className={`min-w-12 rounded-md px-3 py-2 text-sm font-medium transition-[box-shadow,color] ${
                    active ? "font-semibold text-accent ring-2 ring-accent" : "ring-1 ring-line hover:ring-foreground"
                  } ${available ? "" : "line-through"} ${!active && !available ? "text-muted" : ""}`}
                >
                  <StableText
                    text={valueLabels[name]?.[value] ?? value}
                    variants={valueVariants[name]?.[value] ?? []}
                  />
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <input type="hidden" name="variantId" value={current?.id ?? ""} />

      <div>
        <span className="label">{labels.quantity}</span>
        <div className="flex items-start gap-3">
          <QuantityStepper
            value={quantity}
            max={max}
            disabled={soldOut}
            emptyFallback={1}
            invalid={!!state.error}
            describedBy={state.error ? "add-to-cart-error" : undefined}
            labels={labels}
            onChange={(n) => setWanted(n)}
          />
          <button className="btn btn-accent h-10 min-w-0 flex-1 py-0" disabled={soldOut || isPending}>
            <span className="truncate">{soldOut ? labels.soldOut : labels.addToCart}</span>
          </button>
        </div>
        {state.error && (
          <p id="add-to-cart-error" className="field-error">
            {errorText(state.error, locale)}
          </p>
        )}
      </div>

      {current && current.stock > 0 && (
        <p className="text-sm text-muted">
          <span className="mr-1.5 inline-block size-2 rounded-full bg-green-600" />
          {labels.inStock}
          {current.stock <= 3 && ` (${current.stock})`}
        </p>
      )}
    </form>
  );
}
