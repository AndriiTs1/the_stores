import { describe, expect, it } from "vitest";
import { browserWishlistStorage, createWishlist, MAX_ITEMS, parseIds, toggleId, wishlistKey } from "./wishlist";

/** A Storage backed by a Map, shared like the browser's localStorage. */
function fakeStorage(data = new Map<string, string>()): Storage {
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

const listFor = (slug: string, storage: Storage) => createWishlist(browserWishlistStorage(slug, () => storage));

describe("wishlist: add and remove", () => {
  it("adds in front, a second tap removes, and it is saved for the next visit", () => {
    const storage = fakeStorage();
    const list = listFor("demo", storage);
    list.toggle("a");
    list.toggle("b");
    expect(list.get()).toEqual(["b", "a"]);
    list.toggle("a");
    expect(list.get()).toEqual(["b"]);
    expect(listFor("demo", storage).get()).toEqual(["b"]); // a new page load reads it back
    list.remove("b");
    list.remove("not-there");
    expect(list.get()).toEqual([]);
  });

  it("tells subscribers about every change; get() keeps the same array until then", () => {
    const list = listFor("demo", fakeStorage());
    let calls = 0;
    const off = list.subscribe(() => calls++);
    const before = list.get();
    expect(list.get()).toBe(before);
    list.toggle("a");
    expect(calls).toBe(1);
    expect(list.get()).not.toBe(before);
    off();
    list.toggle("b");
    expect(calls).toBe(1);
  });

  it("never holds more than MAX_ITEMS, dropping the oldest", () => {
    let ids: string[] = [];
    for (let i = 0; i <= MAX_ITEMS; i++) ids = toggleId(ids, `p${i}`);
    expect(ids).toHaveLength(MAX_ITEMS);
    expect(ids[0]).toBe(`p${MAX_ITEMS}`);
    expect(ids).not.toContain("p0");
  });
});

describe("wishlist: empty state", () => {
  it("a store nobody saved anything in starts empty", () => {
    expect(listFor("demo", fakeStorage()).get()).toEqual([]);
  });

  it("an unreadable stored value counts as empty, duplicates and odd entries are dropped", () => {
    expect(parseIds(null)).toEqual([]);
    expect(parseIds("{not json")).toEqual([]);
    expect(parseIds('{"a":1}')).toEqual([]);
    expect(parseIds('["a", 3, "", "a", "b"]')).toEqual(["a", "b"]);
  });
});

describe("wishlist: one list per store", () => {
  it("stores keep separate lists in the same browser", () => {
    const storage = fakeStorage();
    const demo = listFor("demo", storage);
    const other = listFor("other-shop", storage);
    demo.toggle("a");
    other.toggle("x");
    expect(demo.get()).toEqual(["a"]);
    expect(other.get()).toEqual(["x"]);
    expect(storage.getItem(wishlistKey("demo"))).toBe('["a"]');
    expect(storage.getItem("merkliste:other-shop")).toBe('["x"]');
  });
});

describe("wishlist without storage", () => {
  it("works for the visit but saves nothing when the browser refuses storage", () => {
    const blocked = () => {
      throw new DOMException("denied", "SecurityError");
    };
    const list = createWishlist(browserWishlistStorage("demo", blocked));
    expect(list.get()).toEqual([]);
    list.toggle("a");
    expect(list.get()).toEqual(["a"]);
    expect(createWishlist(browserWishlistStorage("demo", blocked)).get()).toEqual([]);
  });

  it("a full storage (quota) does not break toggling", () => {
    const full = fakeStorage();
    full.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
    const list = listFor("demo", full);
    list.toggle("a");
    expect(list.get()).toEqual(["a"]);
  });
});
