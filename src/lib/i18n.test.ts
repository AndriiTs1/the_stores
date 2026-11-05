import { describe, expect, it } from "vitest";
import { ogLocale } from "./i18n";

describe("ogLocale", () => {
  it("the Swiss variant of each language", () => {
    expect(["de", "fr", "it", "en"].map(ogLocale)).toEqual(["de_CH", "fr_CH", "it_CH", "en_CH"]);
  });
});
