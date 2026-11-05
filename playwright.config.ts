import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests against a running storefront with the seeded demo store:
 *   npm run dev            (and npm run db:seed once)
 *   npm run test:e2e       E2E_BASE_URL=… to test another server
 * Files are *.e2e.ts so Vitest (unit tests) never picks them up.
 * Phone layout (mobile-layout.e2e.ts) also runs in WebKit as an iPhone and in Chromium at 360px.
 */
const MOBILE_LAYOUT = "**/mobile-layout.e2e.ts";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
  },
  projects: [
    { name: "chromium", testIgnore: MOBILE_LAYOUT, use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "iphone-webkit", testMatch: MOBILE_LAYOUT, use: { ...devices["iPhone 14"] } },
    {
      name: "chromium-360",
      testMatch: MOBILE_LAYOUT,
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true },
    },
  ],
});
