import { describe, expect, it } from "vitest";
import { seasonTag, twoLines } from "./og-text";
import { cutOutSvg } from "./og";

describe("seasonTag", () => {
  it("autumn/winter and spring/summer, from English or German", () => {
    expect(seasonTag({ de: "Herbst / Winter 2026", en: "Autumn / Winter 2026" })).toBe("AW 26");
    expect(seasonTag({ de: "Frühling / Sommer 2027" })).toBe("SS 27");
  });

  it("no season or no year: none", () => {
    expect(seasonTag({ en: "The collection" })).toBeNull();
    expect(seasonTag({ en: "Autumn / Winter" })).toBeNull();
    expect(seasonTag(null)).toBeNull();
  });
});

describe("twoLines", () => {
  it("splits between words, balancing the lines", () => {
    expect(twoLines("THE STORES")).toEqual(["THE", "STORES"]);
    expect(twoLines("SPORT HAUS MEIER AG")).toEqual(["SPORT HAUS", "MEIER AG"]);
    expect(twoLines("ALPINA")).toEqual(["ALPINA"]);
  });
});

describe("cutOutSvg", () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#eee"/><path d="M0 0"/></svg>';

  it("drops the full-size background, keeps the drawing", () => {
    expect(cutOutSvg(svg)).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><path d="M0 0"/></svg>');
  });

  it("traces the drawing in the outline colour", () => {
    expect(cutOutSvg(svg, "#888")).toContain('<g stroke="#888" stroke-width="3" stroke-linejoin="round"><path d="M0 0"/></g></svg>');
  });
});
