import { NextResponse, type NextRequest } from "next/server";

/**
 * Multi-tenant routing.
 *
 *  localhost:3000              → platform home (src/app/page.tsx)
 *  localhost:3000/s/demo/de → store "demo" opened by path (handy for previews)
 *  demo.localhost:3000/de   → store "demo" on a subdomain of ROOT_DOMAIN
 *  shop.client-domain.ch/de          → store looked up by custom domain (Domain table)
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

  // Admin area: HTTP Basic auth until real staff login is built.
  const storePath = rewritePath ? pathname : pathname.replace(/^\/s\/[^/]+/, "");
  if (site && storePath.startsWith("/admin") && !isAdminAuthorized(req)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Shop admin"' },
    });
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

function isAdminAuthorized(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return process.env.NODE_ENV !== "production"; // open in dev only
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  const [, pass] = atob(auth.slice(6)).split(":");
  return pass === password;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
