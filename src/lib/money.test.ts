import { describe, expect, it } from "vitest";
import { computeCart, discountLabel, discountPercent, formatMoney } from "./money";

const store = { shippingFlat: 900, freeShippingFrom: 10000, vatRateBp: 810 };

describe("computeCart", () => {
  it("1 × 89.90 → shipping charged", () => {
    expect(computeCart([{ unitPrice: 8990, quantity: 1 }], store)).toEqual({
      subtotal: 8990,
      shipping: 900,
      total: 9890,
      vatAmount: 741,
      count: 1,
    });
  });

  it("2 × 89.90 → free shipping", () => {
    expect(computeCart([{ unitPrice: 8990, quantity: 2 }], store)).toEqual({
      subtotal: 17980,
      shipping: 0,
      total: 17980,
      vatAmount: 1347,
      count: 2,
    });
  });

  it("exactly 100.00 → free shipping", () => {
    expect(computeCart([{ unitPrice: 10000, quantity: 1 }], store).shipping).toBe(0);
  });

  it("99.95 → shipping charged", () => {
    const t = computeCart([{ unitPrice: 9995, quantity: 1 }], store);
    expect(t.shipping).toBe(900);
    expect(t.total).toBe(10895);
  });

  it("empty cart → nothing to pay", () => {
    expect(computeCart([], store)).toEqual({ subtotal: 0, shipping: 0, total: 0, vatAmount: 0, count: 0 });
  });

  it("several lines are summed", () => {
    const t = computeCart(
      [
        { unitPrice: 3990, quantity: 2 },
        { unitPrice: 4990, quantity: 1 },
      ],
      store,
    );
    expect(t).toMatchObject({ subtotal: 12970, shipping: 0, count: 3 });
  });
});

describe("formatMoney", () => {
  // A no-break space after "CHF", so a price never wraps between currency and amount.
  it("francs: CHF in front, point decimals, Swiss thousands separator — in every language", () => {
    for (const locale of ["de", "fr", "it", "en"]) {
      expect(formatMoney(8990, locale)).toBe("CHF\u00a089.90");
      expect(formatMoney(108990, locale)).toBe("CHF\u00a01'089.90");
    }
    expect(formatMoney(2500, "fr")).toBe("CHF\u00a025.00");
  });
});

describe("discountPercent", () => {
  it("whole percent off, rounded down", () => {
    expect(discountPercent(12990, 14990)).toBe(13); // 13.34 %
    expect(discountLabel(13)).toBe("\u221213%");
    expect(discountPercent(8000, 10000)).toBe(20);
    expect(discountPercent(7999, 10000)).toBe(20); // 20.01 %
    expect(discountPercent(8001, 10000)).toBe(19); // 19.99 %
  });

  it("no label without a higher compare-at price", () => {
    expect(discountPercent(12990, null)).toBeNull();
    expect(discountPercent(12990, 12990)).toBeNull();
    expect(discountPercent(12990, 9990)).toBeNull();
    expect(discountPercent(9950, 10000)).toBeNull(); // under 1 %
  });
});
