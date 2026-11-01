"use client";

import { useMemo, useState } from "react";

export type PickerVariant = {
  id: string;
  options: Record<string, string>;
  price: string;
  compareAt: string | null;
  stock: number;
};

type Labels = { addToCart: string; soldOut: string; inStock: string; quantity: string };

export function VariantPicker({
  initialVariantId,
  variants,
  optionNames,
  optionLabels,
  valueLabels,
  labels,
  action,
}: {
  /** From ?v= — keeps the chosen size/colour across a language switch or reload. */
  initialVariantId?: string;
  variants: PickerVariant[];
  optionNames: string[];
  optionLabels: Record<string, string>;
  /** option name → stored value → label in the page language */
  valueLabels: Record<string, Record<string, string>>;
  labels: Labels;
  action: (formData: FormData) => void;
}) {
  // Start on the variant from the URL, else the first one in stock.
  const initial = variants.find((v) => v.id === initialVariantId) ?? variants.find((v) => v.stock > 0) ?? variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(initial?.options ?? {});

  const values = useMemo(
    () => Object.fromEntries(optionNames.map((name) => [name, [...new Set(variants.map((v) => v.options[name]))]])),
    [variants, optionNames],
  );

  const current = variants.find((v) => optionNames.every((n) => v.options[n] === selected[n]));

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
    <form action={action} className="space-y-6">
      <div>
        <p className="font-display text-2xl font-bold tabular-nums">
          <span className={current?.compareAt ? "text-accent" : ""}>{current?.price}</span>
          {current?.compareAt && (
            <span className="ml-3 text-base font-normal text-muted line-through">{current.compareAt}</span>
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
                  className={`min-w-12 rounded-md px-3 py-2 text-sm font-medium ring-1 transition ${
                    active ? "bg-foreground text-background ring-foreground" : "ring-line hover:ring-foreground"
                  } ${available ? "" : "text-muted line-through"}`}
                >
                  {valueLabels[name]?.[value] ?? value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <input type="hidden" name="variantId" value={current?.id ?? ""} />

      <div className="flex items-end gap-3">
        <label className="w-20 shrink-0">
          <span className="label">{labels.quantity}</span>
          <input
            className="input"
            type="number"
            name="quantity"
            min={1}
            max={Math.max(1, Math.min(99, current?.stock ?? 1))}
            defaultValue={1}
          />
        </label>
        <button className="btn btn-accent min-w-0 flex-1" disabled={!current || current.stock === 0}>
          <span className="truncate">{current && current.stock > 0 ? labels.addToCart : labels.soldOut}</span>
        </button>
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
