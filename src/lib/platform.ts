import { SUPPORTED_LOCALES } from "./i18n";

/** Working name of the platform — the one place it is set. */
export const PLATFORM_NAME = "The Stores";

/**
 * Store that the platform root (/ and /<locale>) opens: DEFAULT_STORE_SLUG, else the seeded "demo"
 * (created by `npm run db:seed`).
 */
export const DEFAULT_STORE_SLUG = (process.env.DEFAULT_STORE_SLUG || "demo").toLowerCase();

/** Absolute URL of the platform (ROOT_DOMAIN), for metadataBase: http on localhost, https elsewhere. */
export function platformUrl() {
  const host = (process.env.ROOT_DOMAIN ?? "localhost:3000").toLowerCase();
  return new URL(`${/^localhost(:|$)/.test(host) ? "http" : "https"}://${host}`);
}

/** hreflang links for a platform page: `path` is what follows the locale ("/impressum"). */
export function platformAlternates(path: string) {
  return {
    languages: {
      ...Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `/${l}${path}`])),
      "x-default": `/de${path}`,
    },
  };
}
