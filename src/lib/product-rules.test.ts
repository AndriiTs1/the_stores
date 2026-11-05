import { describe, expect, it } from "vitest";
import { checkProductRules, ProductRuleError, sellerMaySell } from "./product-rules";

describe("product rules", () => {
  it("a private seller sells only PRELOVED; other sellers any line", () => {
    expect(sellerMaySell("PRIVATE", "PRELOVED")).toBe(true);
    expect(sellerMaySell("PRIVATE", "NEW")).toBe(false);
    expect(sellerMaySell("PRIVATE", "OUTLET")).toBe(false);
    for (const seller of ["HOUSE", "BRAND", "SHOP"] as const) {
      for (const line of ["NEW", "OUTLET", "PRELOVED"] as const) expect(sellerMaySell(seller, line)).toBe(true);
    }
  });

  it("PRIVATE + NEW is refused with a readable error", () => {
    expect(() => checkProductRules({ sellerType: "PRIVATE", line: "NEW", condition: null })).toThrow(
      /private seller can only sell second-hand/,
    );
    try {
      checkProductRules({ sellerType: "PRIVATE", line: "NEW", condition: null });
    } catch (e) {
      expect(e).toBeInstanceOf(ProductRuleError);
      expect((e as ProductRuleError).code).toBe("private-seller-preloved-only");
    }
  });

  it("a condition exactly for PRELOVED", () => {
    expect(() => checkProductRules({ sellerType: "PRIVATE", line: "PRELOVED", condition: "GOOD" })).not.toThrow();
    expect(() => checkProductRules({ sellerType: "HOUSE", line: "PRELOVED", condition: null })).toThrow(/condition/);
    expect(() => checkProductRules({ sellerType: "HOUSE", line: "NEW", condition: "GOOD" })).toThrow(/Only second-hand/);
    expect(() => checkProductRules({ sellerType: "HOUSE", line: "OUTLET", condition: null })).not.toThrow();
  });
});
