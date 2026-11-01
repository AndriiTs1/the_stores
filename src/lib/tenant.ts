import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "./db";
import { isLocale } from "./i18n";

/**
 * The proxy rewrites every tenant request to /s/<site>/...
 * <site> is either a store slug ("demo") or a full custom host ("shop.client-domain.ch").
 */
export const getStore = cache(async (site: string) => {
  const key = decodeURIComponent(site).toLowerCase();
  const store = key.includes(".")
    ? (await db.domain.findUnique({ where: { host: key }, include: { store: true } }))?.store
    : await db.store.findUnique({ where: { slug: key } });
  if (!store) notFound();
  return store;
});

export type Store = Awaited<ReturnType<typeof getStore>>;

export async function getStoreAndLocale(site: string, locale: string) {
  const store = await getStore(site);
  if (!isLocale(locale) || !store.locales.includes(locale)) notFound();
  return { store, locale };
}

/**
 * URL prefix for links inside a store.
 * "" when the shop is served on its own (sub)domain, "/s/<slug>" when opened by path.
 */
export async function getBase() {
  return (await headers()).get("x-store-base") ?? "";
}

/** hreflang links for a storefront page: `path` is what follows the locale ("" for the catalog, "/cart", …). */
export async function languageAlternates(site: string, path: string) {
  const store = await getStore(site);
  const base = await getBase();
  const href = (l: string) => `${base}/${l}${path}`;
  return {
    languages: Object.fromEntries([
      ...store.locales.map((l) => [l, href(l)]),
      ["x-default", href(store.defaultLocale)],
    ]) as Record<string, string>,
  };
}

/** Absolute origin of the current request, for metadataBase. */
export async function requestOrigin() {
  const h = await headers();
  return new URL(`${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost"}`);
}
