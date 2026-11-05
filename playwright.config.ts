import { defineConfig } from "@playwright/test";

/**
 * Browser tests against a running storefront with the seeded demo store:
 *   npm run dev            (and npm run db:seed once)
 *   npm run test:e2e       E2E_BASE_URL=… to test another server
 * Files are *.e2e.ts so Vitest (unit tests) never picks them up.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  },
});
