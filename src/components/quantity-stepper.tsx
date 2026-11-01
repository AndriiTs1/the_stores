"use client";

import { useState } from "react";

export type StepperChange = "step" | "type" | "commit";

/**
 * [−] [n] [+] — used in the cart and on the product page. No native validation, no browser bubbles:
 * typing above `max` snaps to `max` right away; an empty field or 0 waits and is restored on blur
 * (to the last valid value, or to `emptyFallback`). Enter commits the typed value at once.
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
  // While typing, the field shows the raw text; otherwise the current value.
  const [text, setText] = useState<string | null>(null);
  const limit = Math.max(1, max);

  const step = (e: React.MouseEvent, next: number) => {
    e.preventDefault(); // with JS: no form submit
    onChange(next, "step");
  };

  const commitTyped = () => {
    const n = Number(text);
    if (text !== null && n >= 1) onChange(Math.min(n, limit), "commit");
    else if (text !== null && emptyFallback !== undefined) onChange(emptyFallback, "commit");
    setText(null);
  };

  return (
    <div className="w-32">
      <div
        className={`flex h-10 items-stretch overflow-hidden rounded-md border ${invalid ? "border-accent" : "border-line"} ${
          disabled ? "opacity-40" : ""
        }`}
      >
        <button
          type={buttonName ? "submit" : "button"}
          name={buttonName}
          value={value - 1}
          disabled={disabled || value <= 1}
          aria-label={labels.decrease}
          onClick={(e) => step(e, value - 1)}
          className="w-10 shrink-0 text-lg leading-none hover:bg-surface disabled:text-line disabled:hover:bg-transparent"
        >
          −
        </button>
        <input
          name={name}
          inputMode="numeric"
          autoComplete="off"
          aria-label={labels.quantity}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={text ?? String(value)}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 3);
            const n = Number(raw);
            if (raw !== "" && n > limit) {
              // Above the limit: snap to it right away, no error.
              setText(String(limit));
              onChange(limit, "type");
            } else {
              setText(raw);
              if (n >= 1) onChange(n, "type");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTyped();
            }
          }}
          onBlur={commitTyped}
          className="w-12 min-w-0 border-x border-line bg-background text-center text-sm tabular-nums outline-none focus:bg-surface"
        />
        <button
          type={buttonName ? "submit" : "button"}
          name={buttonName}
          value={value + 1}
          disabled={disabled || value >= limit}
          aria-label={labels.increase}
          onClick={(e) => step(e, value + 1)}
          className="w-10 shrink-0 text-lg leading-none hover:bg-surface disabled:text-line disabled:hover:bg-transparent"
        >
          +
        </button>
      </div>
      {/* Fixed-height slot: the hint never changes the layout height. */}
      <p aria-live="polite" className="mt-1 h-4 truncate text-center text-[11px] text-muted">
        {!disabled && max > 0 && max <= 99 && value >= max ? labels.maxAvailable.replace("{n}", String(max)) : ""}
      </p>
    </div>
  );
}
