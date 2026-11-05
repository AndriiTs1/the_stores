import { describe, expect, it } from "vitest";
import { storeInitials } from "./store-icon";

describe("storeInitials", () => {
  it("first letters of the first two words, in capitals", () => {
    expect(storeInitials("The stores")).toBe("TS");
    expect(storeInitials("THE STORES")).toBe("TS");
    expect(storeInitials("Sport-Haus Meier & Co")).toBe("SH");
  });

  it("one word gives one letter; accents and digits stay", () => {
    expect(storeInitials("Alpina")).toBe("A");
    expect(storeInitials("élan 24")).toBe("É2");
  });

  it("no letters at all", () => {
    expect(storeInitials("  & ")).toBe("?");
  });
});
