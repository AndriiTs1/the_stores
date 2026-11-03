import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { isLocale } from "@/lib/i18n";
import { DEFAULT_STORE_SLUG } from "@/lib/platform";

/**
 * Multi-tenant routing.
 *
 *  localhost:3000              → default store: /s/<DEFAULT_STORE_SLUG>, which picks the language
 *  localhost:3000/en           → default store in that language: /s/<DEFAULT_STORE_SLUG>/en
 *  localhost:3000/s/demo/de → store "demo" opened by path (handy for previews)
 *  demo.localhost:3000/de   → store "demo" on a subdomain of ROOT_DOMAIN
 *  shop.client-domain.ch/de          → store looked up by custom domain (Domain table)
 *  localhost:3000/platform     → internal list of stores (admin password)
 *
 * Every store request ends up at /s/<site>/..., and x-store-base tells pages
 * which prefix to put in front of their links.
 */
const ROOT_DOMAIN = (process.env.ROOT_DOMAIN ?? "localhost:3000").toLowerCase();

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const { pathname } = req.nextUrl;

  let site: string | null = null;
  let base = "";
  let rewritePath: string | null = null;

  if (pathname.startsWith("/s/")) {
    site = pathname.split("/")[2] ?? null;
    base = `/s/${site}`;
  } else if (host !== ROOT_DOMAIN && host !== `www.${ROOT_DOMAIN}`) {
    site = host.endsWith(`.${ROOT_DOMAIN}`)
      ? host.slice(0, -(ROOT_DOMAIN.length + 1))
      : host.split(":")[0]; // custom domain
    rewritePath = `/s/${encodeURIComponent(site)}${pathname === "/" ? "" : pathname}`;
  }

  // Store admin and the internal /platform area: HTTP Basic auth until real staff login is built.
  const storePath = rewritePath ? pathname : pathname.replace(/^\/s\/[^/]+/, "");
  const isProtected = site
    ? storePath.startsWith("/admin")
    : pathname === "/platform" || pathname.startsWith("/platform/");
  if (isProtected && !isAdminAuthorized(req.headers.get("authorization"))) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Shop admin"' },
    });
  }

  // The platform has no home page of its own: / and /<locale> open the default store.
  if (!site) {
    const locale = pathname.split("/")[1] ?? "";
    if (pathname === "/" || (isLocale(locale) && pathname === `/${locale}`)) {
      const url = req.nextUrl.clone();
      url.pathname = `/s/${DEFAULT_STORE_SLUG}${pathname === "/" ? "" : `/${locale}`}`;
      return NextResponse.redirect(url);
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-store-base", base);

  if (rewritePath) {
    const url = req.nextUrl.clone();
    url.pathname = rewritePath;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
