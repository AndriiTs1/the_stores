/**
 * Same page in another language: replace only the locale segment, keep query and hash.
 *
 *   base "/s/demo": "/s/demo/de/p/de-luxe-shirt?v=1#top" → "/s/demo/en/p/de-luxe-shirt?v=1#top"
 *   base "" (subdomain / custom domain): "/de/cart" → "/fr/cart"
 *
 * The locale is always the first segment after the store prefix, so a slug containing "de" is never touched.
 */
export function switchLocaleHref(href: string, base: string, locale: string): string {
  const url = new URL(href, "http://x");
  const path = url.pathname;
  let rest: string;
  if (base && (path === base || path.startsWith(`${base}/`))) rest = path.slice(base.length);
  else rest = path.replace(/^\/s\/[^/]+/, ""); // pathname as rewritten by the proxy (/s/<site>/…)
  const segments = rest.split("/").filter(Boolean);
  segments[0] = locale;
  return `${base}/${segments.join("/")}${url.search}${url.hash}`;
}

/** Cookie remembering the shopper's language choice. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** First supported language from an Accept-Language header, by q-weight. */
export function pickFromAcceptLanguage(header: string | null, supported: readonly string[]): string | undefined {
  if (!header) return undefined;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter((x) => x.lang && x.q > 0)
    .sort((a, b) => b.q - a.q);
  return ranked.find((x) => supported.includes(x.lang))?.lang;
}

/** Language for a redirect from a root URL: the remembered choice, else Accept-Language, else `fallback`. */
export function chooseLocale(input: {
  cookie: string | undefined;
  acceptLanguage: string | null;
  supported: readonly string[];
  fallback: string;
}): string {
  const { cookie, acceptLanguage, supported, fallback } = input;
  if (cookie && supported.includes(cookie)) return cookie;
  return pickFromAcceptLanguage(acceptLanguage, supported) ?? fallback;
}
