import { describe, expect, it } from "vitest";
import { normalizeQuantityInput, quantityLimit } from "./quantity";

describe("normalizeQuantityInput", () => {
  it("caps at the stock", () => {
    expect(normalizeQuantityInput("1000", 7)).toBe(7);
    expect(normalizeQuantityInput("8", 7)).toBe(7);
  });
  it("drops non-digits", () => {
    expect(normalizeQuantityInput("12a", 99)).toBe(12);
    expect(normalizeQuantityInput("1 2", 99)).toBe(12);
  });
  it("leading zero", () => {
    expect(normalizeQuantityInput("05", 99)).toBe(5);
  });
  it("nothing usable → null (field may stay empty while typing)", () => {
    expect(normalizeQuantityInput("0", 7)).toBeNull();
    expect(normalizeQuantityInput("00", 7)).toBeNull();
    expect(normalizeQuantityInput("abc", 7)).toBeNull();
    expect(normalizeQuantityInput("", 7)).toBeNull();
  });
  it("never above 99, never below 1 as a limit", () => {
    expect(normalizeQuantityInput("150", 500)).toBe(99);
    expect(quantityLimit(0)).toBe(1);
    expect(quantityLimit(250)).toBe(99);
  });
});
