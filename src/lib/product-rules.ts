/**
 * Rules every product write follows (seed, demo update, admin, later the seller portal and imports). The database
 * enforces the same with a CHECK (condition ⇔ PRELOVED) and triggers (a private seller sells only PRELOVED); these
 * checks come first and give a readable message.
 */
export type Line = "NEW" | "OUTLET" | "PRELOVED";
export type SellerKind = "HOUSE" | "BRAND" | "SHOP" | "PRIVATE";

export class ProductRuleError extends Error {
  constructor(
    readonly code: "private-seller-preloved-only" | "condition-preloved-only" | "preloved-needs-condition",
    message: string,
  ) {
    super(message);
    this.name = "ProductRuleError";
  }
}

/** Whether a seller of this kind may sell in this line: a private person only second-hand (PRELOVED). */
export const sellerMaySell = (seller: SellerKind, line: Line) => seller !== "PRIVATE" || line === "PRELOVED";

/** Throws a ProductRuleError when the product breaks a rule. */
export function checkProductRules(p: { sellerType: SellerKind; line: Line; condition: string | null | undefined }) {
  if (!sellerMaySell(p.sellerType, p.line)) {
    throw new ProductRuleError(
      "private-seller-preloved-only",
      `A private seller can only sell second-hand items (Second Story), not ${p.line}.`,
    );
  }
  if (p.line === "PRELOVED" && !p.condition) {
    throw new ProductRuleError("preloved-needs-condition", "A second-hand item needs its condition.");
  }
  if (p.line !== "PRELOVED" && p.condition) {
    throw new ProductRuleError("condition-preloved-only", "Only second-hand items have a condition.");
  }
}
