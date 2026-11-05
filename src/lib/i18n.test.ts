import { describe, expect, it } from "vitest";
import { dictVariants, getDict, ogLocale, plural, trVariants } from "./i18n";

describe("ogLocale", () => {
  it("the Swiss variant of each language", () => {
    expect(["de", "fr", "it", "en"].map(ogLocale)).toEqual(["de_CH", "fr_CH", "it_CH", "en_CH"]);
  });
});

describe("dictVariants / trVariants", () => {
  it("a label in every language", () => {
    expect(dictVariants("showMore")).toHaveLength(4);
    expect(dictVariants("showMore", ["de", "fr"])).toEqual([getDict("de").showMore, getDict("fr").showMore]);
  });

  it("a stored text in every language, German where one is missing", () => {
    expect(trVariants({ de: "Herren", fr: "Hommes" }, ["de", "fr", "it"])).toEqual(["Herren", "Hommes", "Herren"]);
  });
});

describe("plural", () => {
  it("one/other by the language's rules (French: 0 and 1 are singular)", () => {
    const d = getDict("fr");
    expect(plural(1, "fr", d.itemsOne, d.itemsOther)).toBe("1 article");
    expect(plural(0, "fr", d.itemsOne, d.itemsOther)).toBe("0 article");
    expect(plural(12, "fr", d.itemsOne, d.itemsOther)).toBe("12 articles");
    expect(plural(0, "en", getDict("en").itemsOne, getDict("en").itemsOther)).toBe("0 items");
    expect(plural(1, "it", getDict("it").itemsOne, getDict("it").itemsOther)).toBe("1 articolo");
  });
});
