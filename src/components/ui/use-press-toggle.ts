"use client";

import { useEffect, useRef } from "react";

/**
 * Pointer handling shared by our popovers (Select, LanguagePicker), the same for mouse, touch and pen:
 * - press on the trigger toggles (mouse opens on pointerdown; touch/pen on click, so the opening tap
 *   can't land on an item that appears under the finger);
 * - a press anywhere outside closes and is swallowed (pointerdown and the following click),
 *   so it never focuses or clicks what is underneath.
 */
export function usePressToggle({
  open,
  onShow,
  onClose,
  disabled,
}: {
  open: boolean;
  onShow: () => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const openOnClick = useRef(false);
  const latest = useRef({ onShow, onClose });
  useEffect(() => {
    latest.current = { onShow, onClose };
  });

  useEffect(() => {
    if (!open) return;
    let swallowClickUntil = 0;
    const isInside = (target: EventTarget | null) =>
      target instanceof Node && (contentRef.current?.contains(target) || triggerRef.current?.contains(target));
    const onClick = (e: MouseEvent) => {
      document.removeEventListener("click", onClick, true);
      if (e.timeStamp <= swallowClickUntil && !isInside(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (isInside(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      swallowClickUntil = e.timeStamp + 1000;
      document.addEventListener("click", onClick, true);
      latest.current.onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      // The swallowing click listener removes itself when the click arrives (or on the next one).
      setTimeout(() => document.removeEventListener("click", onClick, true), 1000);
    };
  }, [open]);

  const triggerProps = {
    onPointerDown: (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      openOnClick.current = false;
      if (open) {
        e.preventDefault();
        onClose();
      } else if (e.pointerType === "mouse") {
        e.preventDefault(); // focus goes into the popover, not the button
        onShow();
      } else {
        openOnClick.current = true;
      }
    },
    onClick: () => {
      if (openOnClick.current && !open) onShow();
      openOnClick.current = false;
    },
  };

  return { triggerRef, contentRef, triggerProps };
}
