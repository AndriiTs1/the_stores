import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The "@/…" imports of the app (tsconfig paths), for tests of modules that use them.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
