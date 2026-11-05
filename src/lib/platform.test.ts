import { afterEach, describe, expect, it, vi } from "vitest";
import { platformAlternates, platformUrl, rootHosts } from "./platform";

describe("platformAlternates", () => {
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

describe("rootHosts", () => {
  const vercel = { VERCEL_BRANCH_URL: "thestores-git-x-team.vercel.app", VERCEL_URL: "thestores-abc123-team.vercel.app" };

  it("ROOT_DOMAIN and its www, localhost:3000 by default", () => {
    expect([...rootHosts({ ROOT_DOMAIN: "Example.ch" })]).toEqual(["example.ch", "www.example.ch"]);
    expect([...rootHosts({})]).toEqual(["localhost:3000", "www.localhost:3000"]);
  });

  it("a Vercel preview adds its branch and deployment addresses", () => {
    const hosts = rootHosts({ VERCEL_ENV: "preview", ...vercel });
    expect(hosts.has("thestores-git-x-team.vercel.app")).toBe(true);
    expect(hosts.has("thestores-abc123-team.vercel.app")).toBe(true);
    expect(hosts.has("localhost:3000")).toBe(true);
  });

  it("production and local runs ignore the Vercel addresses", () => {
    expect([...rootHosts({ VERCEL_ENV: "production", ROOT_DOMAIN: "example.ch", ...vercel })]).toEqual([
      "example.ch",
      "www.example.ch",
    ]);
    expect(rootHosts({ VERCEL_ENV: "development", ...vercel }).size).toBe(2);
  });
});
