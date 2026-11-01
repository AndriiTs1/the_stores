/** Highest quantity the stepper allows: online stock, but never above 99 (two digits). */
export const MAX_QUANTITY = 99;

export function quantityLimit(stock: number) {
  return Math.max(1, Math.min(MAX_QUANTITY, stock));
}

/**
 * What a keystroke in the quantity field means: digits only, capped at `max`.
 * null = nothing usable yet (empty, "0", letters) — the field may be empty while typing.
 */
export function normalizeQuantityInput(raw: string, max: number): number | null {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return null;
  const n = Number(digits);
  if (n < 1) return null;
  return Math.min(n, quantityLimit(max));
}
