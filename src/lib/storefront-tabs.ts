/** The phone bottom bar's tabs, in order. */
export const TABS = ["start", "categories", "wishlist", "account"] as const;
export type Tab = (typeof TABS)[number];

/**
 * Path inside the store, without the store prefix: "/s/demo/de/cart" → "/de/cart" (opened by path, base "/s/demo"),
 * "/de/cart" stays as is on the store's own (sub)domain (base "").
 */
export function storePath(pathname: string, base: string): string {
  if (base && (pathname === base || pathname.startsWith(`${base}/`))) return pathname.slice(base.length);
  return pathname.replace(/^\/s\/[^/]+/, ""); // pathname as rewritten by the proxy (/s/<site>/…)
}

/** Where a tab leads: a path after the locale ("" = the store home). */
const TAB_PATH: Record<Tab, string> = { start: "", categories: "/categories", wishlist: "/wishlist", account: "/account" };

export function tabHref(tab: Tab, base: string, locale: string): string {
  return `${base}/${locale}${TAB_PATH[tab]}`;
}

/**
 * The tab a page belongs to, from its path inside the store ("/de/collections/herren"):
 * home and product pages → Start; the category screen and every listing reached from it → Categories;
 * the account screen and the information pages it links to → Account. Search, cart, checkout → none.
 */
export function activeTab(path: string, locale: string): Tab | null {
  const home = `/${locale}`;
  if (path !== home && !path.startsWith(`${home}/`)) return null;
  const rest = path.slice(home.length).replace(/\/$/, "");
  if (rest === "" || rest.startsWith("/p/")) return "start";
  if (/^\/(categories|collections|brands|sale)(\/|$)/.test(rest)) return "categories";
  if (/^\/wishlist(\/|$)/.test(rest)) return "wishlist";
  if (/^\/(account|info)(\/|$)/.test(rest)) return "account";
  return null;
}
