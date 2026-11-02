import { NextResponse, type NextRequest } from "next/server";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { LOCALE_COOKIE, pickFromAcceptLanguage } from "@/lib/locale-path";

/**
 * Platform home → /<locale>: the last choice (NEXT_LOCALE cookie), else the browser's
 * Accept-Language, else German. Same rule as a store root (s/[site]/route.ts).
 */
export function GET(req: NextRequest) {
  const fromCookie = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    (fromCookie && (SUPPORTED_LOCALES as readonly string[]).includes(fromCookie) ? fromCookie : undefined) ??
    pickFromAcceptLanguage(req.headers.get("accept-language"), SUPPORTED_LOCALES) ??
    "de";

  const res = NextResponse.redirect(new URL(`/${locale}`, req.url));
  res.headers.set("Vary", "Cookie, Accept-Language");
  return res;
}
