"use client";

import { useEffect, useState } from "react";
import { normalizeQuantityInput, quantityLimit } from "@/lib/quantity";

export type StepperChange = "step" | "type" | "commit";

const FLASH_MS = 1500;

/**
 * [−] [n] [+] — used in the cart and on the product page. No native validation, no browser bubbles.
 * The field always shows the very number the totals use: every keystroke is normalised
 * (digits only, capped at `max` — the "Max. N" hint flashes when capped). Only "empty" is a
 * separate state, so the user can clear the field to type a new number; on blur an empty field
 * goes back to the last value, or to `emptyFallback`. ↑/↓ change by one within 1..max.
 *
 * `buttonName` makes −/+ real submit buttons (name=value), so a form still works without JavaScript;
 * with JavaScript the click is handled here and the form is not submitted.
 */
export function QuantityStepper({
  value,
  max,
  onChange,
  labels,
  disabled,
  name = "quantity",
  buttonName,
  emptyFallback,
  invalid,
  describedBy,
}: {
  value: number;
  /** Highest allowed quantity (online stock, at most 99). 0 = nothing available. */
  max: number;
  onChange: (quantity: number, kind: StepperChange) => void;
  labels: { decrease: string; increase: string; quantity: string; maxAvailable: string };
  disabled?: boolean;
  name?: string;
  buttonName?: string;
  emptyFallback?: number;
  invalid?: boolean;
  describedBy?: string;
}) {
  const limit = quantityLimit(max);
  const [empty, setEmpty] = useState(false);
  // Counter, so every capped keystroke restarts the 1.5 s highlight of the hint.
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(0), FLASH_MS);
    return () => clearTimeout(t);
  }, [flash]);

  const set = (n: number, kind: StepperChange) => {
    setEmpty(false);
    onChange(Math.min(limit, Math.max(1, n)), kind);
  };

  const step = (e: React.MouseEvent, next: number) => {
    e.preventDefault(); // with JS: no form submit
    set(next, "step");
  };

  const leave = () => {
    if (empty && emptyFallback !== undefined) set(emptyFallback, "commit");
    setEmpty(false);
  };

  const atMax = !disabled && max > 0 && max <= 99 && value >= max;

  return (
    <div className="stepper w-32">
      <div
        className={`flex h-10 items-stretch overflow-hidden rounded-md border transition-shadow focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground/20 focus-within:ring-offset-2 ${
          invalid ? "border-accent" : "border-line"
        } ${disabled ? "opacity-40" : ""}`}
      >
        <button
          type={buttonName ? "submit" : "button"}
          name={buttonName}
          value={value - 1}
          disabled={disabled || value <= 1}
          aria-label={labels.decrease}
          onClick={(e) => step(e, value - 1)}
          className="w-10 shrink-0 text-lg leading-none hover:bg-surface focus-visible:bg-surface disabled:text-line disabled:hover:bg-transparent"
        >
          −
        </button>
        <input
          name={name}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          autoComplete="off"
          aria-label={labels.quantity}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={empty ? "" : String(value)}
          onFocus={(e) => {
            const input = e.currentTarget;
            // After the click has placed the caret, so the selection sticks and a new number replaces the old.
            requestAnimationFrame(() => input.select());
          }}
          onChange={(e) => {
            const raw = e.target.value;
            const n = normalizeQuantityInput(raw, max);
            if (n === null) {
              setEmpty(true); // cleared to type a new number; totals keep the last value
              return;
            }
            if (Number(raw.replace(/\D/g, "")) > limit) setFlash((f) => f + 1);
            set(n, "type");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              set(value + (e.key === "ArrowUp" ? 1 : -1), "step");
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (empty) leave();
              else set(value, "commit");
            }
          }}
          onBlur={leave}
          className="w-12 min-w-0 border-x border-line bg-background text-center text-sm tabular-nums"
        />
        <button
          type={buttonName ? "submit" : "button"}
          name={buttonName}
          value={value + 1}
          disabled={disabled || value >= limit}
          aria-label={labels.increase}
          onClick={(e) => step(e, value + 1)}
          className="w-10 shrink-0 text-lg leading-none hover:bg-surface focus-visible:bg-surface disabled:text-line disabled:hover:bg-transparent"
        >
          +
        </button>
      </div>
      {/* Fixed-height slot: the hint never changes the layout height. */}
      <p
        aria-live="polite"
        className={`mt-1 h-4 truncate text-center text-[11px] transition-colors ${flash ? "text-accent" : "text-muted"}`}
      >
        {atMax ? labels.maxAvailable.replace("{n}", String(max)) : ""}
      </p>
    </div>
  );
}
