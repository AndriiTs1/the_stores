import { afterEach, describe, expect, it, vi } from "vitest";
import { platformAlternates, platformUrl } from "./platform";

describe("platformAlternates", () => {
  it("home: all four languages, x-default is the root (it picks the language)", () => {
    expect(platformAlternates("")).toEqual({
      languages: { de: "/de", fr: "/fr", it: "/it", en: "/en", "x-default": "/" },
    });
  });

  it("subpage: all four languages, x-default is the German page", () => {
    expect(platformAlternates("/impressum")).toEqual({
      languages: {
        de: "/de/impressum",
        fr: "/fr/impressum",
        it: "/it/impressum",
        en: "/en/impressum",
        "x-default": "/de/impressum",
      },
    });
  });
});

describe("platformUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("https for a real domain, http on localhost", () => {
    vi.stubEnv("ROOT_DOMAIN", "Example.ch");
    expect(platformUrl().href).toBe("https://example.ch/");
    vi.stubEnv("ROOT_DOMAIN", "localhost:3000");
    expect(platformUrl().href).toBe("http://localhost:3000/");
  });
});
