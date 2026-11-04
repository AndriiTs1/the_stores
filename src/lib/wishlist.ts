/**
 * The wishlist ("Merkliste"): product ids, newest first, one list per store.
 * Screens talk to a Wishlist; where it is kept is a WishlistStorage. Today that is the browser
 * (localStorage, no sign-up); later a customer-account storage can implement the same interface.
 */

/** Where a store's list is kept. */
export interface WishlistStorage {
  load(): string[];
  save(ids: string[]): void;
  /** Calls back when the list changed elsewhere (e.g. another browser tab). Returns an unsubscribe. */
  subscribe(onChange: () => void): () => void;
}

/** Enough for any real list; keeps the stored value and the server lookup small. */
export const MAX_ITEMS = 100;

export const wishlistKey = (storeSlug: string) => `merkliste:${storeSlug}`;

/** Stored JSON → ids; anything unexpected (old format, hand edits) → a clean list. */
export function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const ids = value.filter((v): v is string => typeof v === "string" && v.length > 0 && v.length <= 64);
    return [...new Set(ids)].slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/** Saved → removed; not saved → added in front. */
export function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids].slice(0, MAX_ITEMS);
}

/**
 * localStorage under `merkliste:<storeSlug>`. Every access is guarded: in a private window, with blocked
 * site data or on the server, reading gives an empty list and saving does nothing.
 */
export function browserWishlistStorage(storeSlug: string, getStorage: () => Storage = () => window.localStorage) {
  const key = wishlistKey(storeSlug);
  return {
    load() {
      try {
        return parseIds(getStorage().getItem(key));
      } catch {
        return [];
      }
    },
    save(ids) {
      try {
        getStorage().setItem(key, JSON.stringify(ids));
      } catch {
        // No storage: the list lives until the page is closed.
      }
    },
    subscribe(onChange) {
      try {
        const onStorage = (e: StorageEvent) => e.key === key && onChange();
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
      } catch {
        return () => {};
      }
    },
  } satisfies WishlistStorage;
}

export type Wishlist = {
  /** The same array until the list changes (safe for useSyncExternalStore). */
  get(): string[];
  toggle(id: string): void;
  remove(id: string): void;
  subscribe(listener: () => void): () => void;
};

/** A list kept in memory and written through to `storage`. */
export function createWishlist(storage: WishlistStorage): Wishlist {
  let ids: string[] | null = null;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  const get = () => (ids ??= storage.load());
  const set = (next: string[]) => {
    ids = next;
    storage.save(next);
    notify();
  };

  return {
    get,
    toggle: (id) => set(toggleId(get(), id)),
    remove: (id) => get().includes(id) && set(get().filter((x) => x !== id)),
    subscribe(listener) {
      listeners.add(listener);
      const off = storage.subscribe(() => {
        ids = storage.load();
        notify();
      });
      return () => {
        listeners.delete(listener);
        off();
      };
    },
  };
}
