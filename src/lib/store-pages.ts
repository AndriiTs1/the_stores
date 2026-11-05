import type { DictKey } from "./i18n";

/**
 * The store's information pages, linked from the footer (/<locale>/info/<slug>).
 * Slugs stay German in every language, like the Swiss "Impressum". No store has texts yet: all are drafts.
 */
export const STORE_PAGES = [
  { slug: "hilfe", title: "pageHelp", group: "service" },
  { slug: "versand", title: "shipping", group: "service" },
  { slug: "rueckgabe", title: "pageReturns", group: "service" },
  { slug: "ueber-uns", title: "pageAbout", group: "service" },
  { slug: "impressum", title: "pageImprint", group: "legal" },
  { slug: "datenschutz", title: "pagePrivacy", group: "legal" },
  { slug: "agb", title: "pageTerms", group: "legal" },
] as const satisfies readonly { slug: string; title: DictKey; group: "service" | "legal" }[];

export type StorePage = (typeof STORE_PAGES)[number];

export function findStorePage(slug: string): StorePage | undefined {
  return STORE_PAGES.find((p) => p.slug === slug);
}
