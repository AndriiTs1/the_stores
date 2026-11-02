import { describe, expect, it } from "vitest";
import { getDict } from "./i18n";
import { trustItems } from "./trust";

const nbsp = " ";
const base = {
  currency: "CHF",
  shippingFlat: 900,
  freeShippingFrom: 10000,
  returnDays: null,
  originalGoods: false,
  paymentMethods: [],
};

describe("trustItems", () => {
  it("a store with nothing set promises only its shipping rates", () => {
    const items = trustItems(base, true, getDict("de"), "de");
    expect(items).toEqual([{ id: "shipping", title: "Versand", text: `CHF${nbsp}9.00 · gratis ab CHF${nbsp}100.00` }]);
  });

  it("flat rate only, or free shipping", () => {
    expect(trustItems({ ...base, freeShippingFrom: null }, false, getDict("en"), "en")[0].text).toBe(`CHF${nbsp}9.00`);
    expect(trustItems({ ...base, shippingFlat: 0 }, false, getDict("fr"), "fr")[0].text).toBe("Gratuite");
  });

  it("returns and originality only when the store sets them", () => {
    const items = trustItems({ ...base, returnDays: 30, originalGoods: true }, false, getDict("it"), "it");
    expect(items.map((i) => [i.id, i.text])).toEqual([
      ["shipping", `CHF${nbsp}9.00 · gratuita da CHF${nbsp}100.00`],
      ["returns", "Entro 30 giorni"],
      ["original", "Nuovi e originali"],
    ]);
  });

  it("payment methods only with Stripe configured; unknown methods are left out", () => {
    const store = { ...base, paymentMethods: ["card", "twint", "bitcoin"] };
    expect(trustItems(store, false, getDict("de"), "de").map((i) => i.id)).toEqual(["shipping"]);
    expect(trustItems(store, true, getDict("de"), "de").at(-1)).toEqual({
      id: "payment",
      title: "Zahlung",
      text: "Karte · TWINT",
    });
  });
});
