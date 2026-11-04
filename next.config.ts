import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Store pages depend on host + cart cookie, so they render per request.
  // Later: turn Cache Components back on and cache the catalog per store with
  // `use cache` + cacheTag(`store:${id}`), invalidated from the admin actions.
  cacheComponents: false,
  devIndicators: false,
};

export default nextConfig;
