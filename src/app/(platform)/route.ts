import { NextResponse, type NextRequest } from "next/server";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { chooseLocale, LOCALE_COOKIE } from "@/lib/locale-path";

/**
 * Platform home → /<locale>: the last choice (NEXT_LOCALE cookie), else the browser's
 * Accept-Language, else German. Same rule as a store root (s/[site]/route.ts).
 */
export function GET(req: NextRequest) {
  const locale = chooseLocale({
    cookie: req.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: req.headers.get("accept-language"),
    supported: SUPPORTED_LOCALES,
    fallback: "de",
  });

  const res = NextResponse.redirect(new URL(`/${locale}`, req.url));
  res.headers.set("Vary", "Cookie, Accept-Language");
  return res;
}
