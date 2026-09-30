import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: [
      "src/**/*.test.ts",
      "convex/**/*.test.ts",
      "scripts/**/*.test.ts",
    ],
    environment: "node",
    environmentMatchGlobs: [["convex/mutations.test.ts", "edge-runtime"]],
    globals: true,
    restoreMocks: true,
    clearMocks: true,
  },
});
