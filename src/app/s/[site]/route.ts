import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, pickFromAcceptLanguage } from "@/lib/locale-path";
import { getStore } from "@/lib/tenant";

/**
 * Store root → a language the store offers: the last choice (NEXT_LOCALE cookie),
 * else the browser's Accept-Language, else the store default.
 * A route handler, since there is no root layout at this level.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/s/[site]">) {
  const { site } = await ctx.params;
  const store = await getStore(site);
  const base = req.headers.get("x-store-base") ?? "";

  const fromCookie = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    (fromCookie && store.locales.includes(fromCookie) ? fromCookie : undefined) ??
    pickFromAcceptLanguage(req.headers.get("accept-language"), store.locales) ??
    store.defaultLocale;

  const res = NextResponse.redirect(new URL(`${base}/${locale}`, req.url));
  res.headers.set("Vary", "Cookie, Accept-Language");
  return res;
}
