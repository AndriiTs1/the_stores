"use client";

import { useEffect, useId, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { usePressToggle } from "./use-press-toggle";

export type SelectOption = { value: string; label: string };

/**
 * Select styled like `.input`: Radix Popover (non-modal) + an ARIA listbox.
 * Radix Select was replaced because on touch a tap on the open trigger did not close it
 * (it locks `pointer-events` on <body>), so pointer handling is done here explicitly.
 *
 * - The list opens right under the field and is exactly as wide.
 * - Plain forms: pass `name` (+ `defaultValue`) — a hidden input carries the value, also before hydration.
 * - react-hook-form: use inside <Controller> with `value` / `onValueChange` / `onBlur`.
 */
export function Select({
  options,
  name,
  value,
  defaultValue,
  onValueChange,
  onBlur,
  id,
  placeholder,
  disabled,
  invalid,
  describedBy,
  className = "",
  "aria-label": ariaLabel,
}: {
  options: SelectOption[];
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  const selectedIndex = options.findIndex((o) => o.value === current);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-o${i}`;

  const show = () => {
    setActive(Math.max(0, selectedIndex));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };
  const choose = (i: number) => {
    const v = options[i]?.value;
    if (v === undefined) return;
    setUncontrolled(v);
    if (v !== current) onValueChange?.(v);
    close();
  };

  const { triggerRef, contentRef, triggerProps } = usePressToggle({ open, onShow: show, onClose: close, disabled });

  // Keep the highlighted option visible while moving with the keyboard.
  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || open) return;
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
      e.preventDefault();
      show();
    }
  };

  const typeahead = useRef({ text: "", at: 0 });
  const onListKeyDown = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    const move = (i: number) => {
      e.preventDefault();
      setActive(Math.min(last, Math.max(0, i)));
    };
    switch (e.key) {
      case "ArrowDown":
        return move(active + 1);
      case "ArrowUp":
        return move(active - 1);
      case "Home":
      case "PageUp":
        return move(0);
      case "End":
      case "PageDown":
        return move(last);
      case "Enter":
      case " ":
        e.preventDefault();
        return choose(active);
      case "Tab":
        e.preventDefault();
        return close();
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const t = typeahead.current;
          t.text = e.timeStamp - t.at < 700 ? t.text + e.key.toLowerCase() : e.key.toLowerCase();
          t.at = e.timeStamp;
          const i = options.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
          if (i >= 0) move(i);
        }
    }
  };

  const label = options[selectedIndex]?.label;

  return (
    <Popover.Root open={open} onOpenChange={(o) => (o ? show() : close())} modal={false}>
      {name && <input type="hidden" name={name} value={current ?? ""} />}
      <Popover.Anchor asChild>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          data-state={open ? "open" : "closed"}
          {...triggerProps}
          onKeyDown={onTriggerKeyDown}
          onBlur={onBlur}
          className={`input flex items-center justify-between gap-2 text-left disabled:opacity-50 ${className}`}
        >
          <span className={`min-w-0 truncate ${label ? "" : "text-muted"}`}>{label ?? placeholder ?? " "}</span>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          ref={contentRef}
          side="bottom"
          align="start"
          sideOffset={4}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            listRef.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(e) => e.preventDefault()} // focus is returned by close()
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            close();
          }}
          onPointerDownOutside={(e) => e.preventDefault()} // handled by the capture listener above
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-line bg-background text-sm shadow-lg"
        >
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={id}
            aria-label={id ? undefined : ariaLabel}
            aria-activedescendant={optionId(active)}
            onKeyDown={onListKeyDown}
            className="max-h-72 overflow-y-auto overscroll-contain p-1 outline-none"
          >
            {options.map((o, i) => (
              <li
                key={o.value}
                id={optionId(i)}
                role="option"
                aria-selected={i === selectedIndex}
                data-highlighted={i === active || undefined}
                onPointerDown={(e) => e.preventDefault()} // keep focus in the list
                onPointerMove={(e) => e.pointerType === "mouse" && setActive(i)}
                // click, not pointerdown/up: a finger that scrolled the list never produces a click
                onClick={() => choose(i)}
                className="relative flex h-9 cursor-default select-none items-center rounded pl-3 pr-8 data-[highlighted]:bg-surface aria-selected:font-semibold"
              >
                <span className="truncate">{o.label}</span>
                {i === selectedIndex && (
                  <svg aria-hidden viewBox="0 0 16 16" className="absolute right-2 size-4">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
