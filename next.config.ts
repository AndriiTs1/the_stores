import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Store pages depend on host + cart cookie, so they render per request.
  // Later: turn Cache Components back on and cache the catalog per store with
  // `use cache` + cacheTag(`store:${id}`), invalidated from the admin actions.
  cacheComponents: false,
  devIndicators: false,
  // Sale became the Outlet part: old links lead there for good (301), by path and on a store's own domain.
  async redirects() {
    return [
      { source: "/s/:site/:locale/sale", destination: "/s/:site/:locale/products?line=outlet", statusCode: 301 },
      { source: "/:locale(de|fr|it|en)/sale", destination: "/:locale/products?line=outlet", statusCode: 301 },
    ];
  },
  // Demo product photos come from Unsplash's image CDN (prisma/demo-photos.ts).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Generated images (link previews, icons; lib/og.ts) read these files at request time by a computed path,
  // which file tracing can't follow: ship them with the functions explicitly.
  outputFileTracingIncludes: {
    "/s/**/*": ["./assets/fonts/*.ttf", "./public/demo/**/*"],
    "/*": ["./assets/fonts/*.ttf"],
  },
};

export default nextConfig;
