import { describe, expect, it } from "vitest";
import { computeCart } from "./money";

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
