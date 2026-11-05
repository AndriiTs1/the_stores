import { describe, expect, it } from "vitest";
import { parseLine, resolveLine, withLine } from "./lines";

describe("lines", () => {
  it("parseLine: the three slugs, anything else none", () => {
    expect(parseLine("outlet")).toBe("OUTLET");
    expect(parseLine("new")).toBe("NEW");
    expect(parseLine("second-story")).toBe("PRELOVED");
    expect(parseLine(["second-story", "new"])).toBe("PRELOVED");
    for (const v of ["PRELOVED", "sale", "", undefined, null, 1]) expect(parseLine(v)).toBeNull();
  });

  it("resolveLine: Outlet by default, the first non-empty one when empty, a wish only when it has products", () => {
    expect(resolveLine(null, ["OUTLET", "NEW", "PRELOVED"])).toBe("OUTLET");
    expect(resolveLine(null, ["NEW", "PRELOVED"])).toBe("NEW");
    expect(resolveLine("PRELOVED", ["OUTLET", "PRELOVED"])).toBe("PRELOVED");
    expect(resolveLine("NEW", ["OUTLET", "PRELOVED"])).toBe("OUTLET");
    expect(resolveLine(null, [])).toBeNull();
  });

  it("withLine: adds or replaces ?line=, keeps the rest", () => {
    expect(withLine("/s/demo/de/collections/herren", "PRELOVED")).toBe("/s/demo/de/collections/herren?line=second-story");
    expect(withLine("/s/demo/de/search?q=jacke&line=new", "OUTLET")).toBe("/s/demo/de/search?q=jacke&line=outlet");
    expect(withLine("/s/demo/de?line=new#selection", null)).toBe("/s/demo/de#selection");
  });
});
