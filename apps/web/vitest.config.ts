import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/test/e2e/**",
      "**/tests/e2e/**",
      "**/tests/visual/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/e2e/",
        "tests/e2e/",
        "tests/visual/",
        "*.config.ts",
        "*.config.js",
        ".next/",
        "dist/",
      ],
    },
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
