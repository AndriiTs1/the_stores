import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Store pages depend on host + cart cookie, so they render per request.
  // Later: turn Cache Components back on and cache the catalog per store with
  // `use cache` + cacheTag(`store:${id}`), invalidated from the admin actions.
  cacheComponents: false,
  devIndicators: false,
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
