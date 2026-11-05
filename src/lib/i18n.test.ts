import { describe, expect, it } from "vitest";
import { dictVariants, getDict, ogLocale, trVariants } from "./i18n";

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
