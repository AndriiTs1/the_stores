/**
 * The page's #hash as an external store (useSyncExternalStore). It changes through links (hashchange),
 * Back/Forward (popstate) and our own pushHash/replaceHash — history.pushState fires neither event,
 * so those dispatch HASH_EVENT.
 */
const HASH_EVENT = "storefront:hash";

export function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener(HASH_EVENT, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(HASH_EVENT, onChange);
  };
}

export const readHash = () => window.location.hash;

/** Same page, new hash ("" removes it): a new history entry (push) or in place (replace). */
function setHash(hash: string, mode: "push" | "replace") {
  const url = `${window.location.pathname}${window.location.search}${hash}`;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(HASH_EVENT));
}

export const pushHash = (hash: string) => setHash(hash, "push");
export const replaceHash = (hash: string) => setHash(hash, "replace");
