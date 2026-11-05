/** A link from the store settings: a full URL as is, else a path after the locale ("/" = the catalogue). */
export function storeHref(href: string | null | undefined, base: string, locale: string): string | null {
  if (!href) return null;
  if (/^https?:\/\//.test(href)) return href;
  return `${base}/${locale}${href === "/" ? "" : href}`;
}
