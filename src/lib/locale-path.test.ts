import { describe, expect, it } from "vitest";
import { chooseLocale, pickFromAcceptLanguage, switchLocaleHref } from "./locale-path";

describe("switchLocaleHref", () => {
  it("replaces the locale segment after /s/<site>", () => {
    expect(switchLocaleHref("/s/demo/de/p/hoodie-hilltop", "/s/demo", "it")).toBe("/s/demo/it/p/hoodie-hilltop");
  });

  it("works on a subdomain (no prefix)", () => {
    expect(switchLocaleHref("/de/cart", "", "fr")).toBe("/fr/cart");
  });

  it("never touches a slug that contains the locale", () => {
    expect(switchLocaleHref("/s/demo/de/p/de-luxe-shirt", "/s/demo", "en")).toBe("/s/demo/en/p/de-luxe-shirt");
    expect(switchLocaleHref("/de/p/de", "", "it")).toBe("/it/p/de");
  });

  it("keeps query and hash", () => {
    expect(switchLocaleHref("/s/demo/de?c=hoodies#grid", "/s/demo", "fr")).toBe("/s/demo/fr?c=hoodies#grid");
    expect(switchLocaleHref("/s/demo/de/order/abc?session_id=cs_1", "/s/demo", "it")).toBe(
      "/s/demo/it/order/abc?session_id=cs_1",
    );
    expect(switchLocaleHref("/de/p/x?v=123#top", "", "en")).toBe("/en/p/x?v=123#top");
  });

  it("handles the store root and a trailing slash", () => {
    expect(switchLocaleHref("/s/demo/de", "/s/demo", "en")).toBe("/s/demo/en");
    expect(switchLocaleHref("/s/demo/de/", "/s/demo", "en")).toBe("/s/demo/en");
    expect(switchLocaleHref("/de", "", "it")).toBe("/it");
  });

  it("on a subdomain, a proxy-rewritten pathname maps back to the public one", () => {
    expect(switchLocaleHref("/s/demo/de/cart", "", "fr")).toBe("/fr/cart");
  });
});

describe("pickFromAcceptLanguage", () => {
  const supported = ["de", "fr", "it", "en"];
  it("takes the best supported language by weight", () => {
    expect(pickFromAcceptLanguage("es-ES,es;q=0.9,it-CH;q=0.8,en;q=0.7", supported)).toBe("it");
    expect(pickFromAcceptLanguage("en;q=0.5,fr-CH", supported)).toBe("fr");
  });
  it("returns undefined when nothing matches", () => {
    expect(pickFromAcceptLanguage("es,pt;q=0.8", supported)).toBeUndefined();
    expect(pickFromAcceptLanguage(null, supported)).toBeUndefined();
  });
});

describe("chooseLocale (platform root redirect)", () => {
  const base = { cookie: undefined, supported: ["de", "fr", "it", "en"], fallback: "de" };
  it("takes the browser language, with region tags and weights", () => {
    expect(chooseLocale({ ...base, acceptLanguage: "fr-CH,fr;q=0.9,de;q=0.8" })).toBe("fr");
    expect(chooseLocale({ ...base, acceptLanguage: "IT-ch" })).toBe("it");
    expect(chooseLocale({ ...base, acceptLanguage: "es;q=1,en;q=0.5,de;q=0.4" })).toBe("en");
  });
  it("falls back to German when nothing matches or the header is missing", () => {
    expect(chooseLocale({ ...base, acceptLanguage: "es-ES,pt;q=0.8" })).toBe("de");
    expect(chooseLocale({ ...base, acceptLanguage: null })).toBe("de");
    expect(chooseLocale({ ...base, acceptLanguage: "" })).toBe("de");
  });
  it("a language picked in the switcher wins; an unknown cookie is ignored", () => {
    expect(chooseLocale({ ...base, cookie: "it", acceptLanguage: "fr" })).toBe("it");
    expect(chooseLocale({ ...base, cookie: "xx", acceptLanguage: "fr" })).toBe("fr");
  });
});
