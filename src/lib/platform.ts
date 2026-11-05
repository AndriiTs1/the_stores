import { SUPPORTED_LOCALES } from "./i18n";

/** Working name of the platform — the one place it is set. */
export const PLATFORM_NAME = "The Stores";

/**
 * Store that the platform root (/ and /<locale>) opens: DEFAULT_STORE_SLUG, else the seeded "demo"
 * (created by `npm run db:seed`).
 */
export const DEFAULT_STORE_SLUG = (process.env.DEFAULT_STORE_SLUG || "demo").toLowerCase();

/**
 * Hosts that serve the platform itself rather than a store (the proxy sends their / to the default store):
 * ROOT_DOMAIN and www.ROOT_DOMAIN, and on Vercel also the deployment's own addresses: on a preview the branch and
 * deployment URLs (VERCEL_BRANCH_URL, VERCEL_URL), so previews need no ROOT_DOMAIN of their own; in production the
 * deployment URL (VERCEL_URL), so a production build opened by its own address (the dashboard thumbnail) works too.
 */
export function rootHosts(env: Record<string, string | undefined> = process.env): Set<string> {
  const root = (env.ROOT_DOMAIN ?? "localhost:3000").toLowerCase();
  const hosts = new Set([root, `www.${root}`]);
  const own =
    env.VERCEL_ENV === "preview"
      ? [env.VERCEL_BRANCH_URL, env.VERCEL_URL]
      : env.VERCEL_ENV === "production"
        ? [env.VERCEL_URL]
        : [];
  for (const url of own) if (url) hosts.add(url.toLowerCase());
  return hosts;
}

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
