import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    // Stop happy-dom from actually navigating/loading iframe `src`es (YouTube /
    // Vimeo embeds in <VideoBlock>, the Google Maps embed in <MapEmbed>, …).
    // Without this, happy-dom fires window.fetch() for each iframe and then
    // aborts it on test teardown, spamming the run with
    // "DOMException [NetworkError]: Failed to execute fetch() … operation was
    // aborted". Tests only assert the iframe element + its attributes, never
    // the loaded page, so disabling child-frame navigation is purely noise
    // removal.
    environmentOptions: {
      happyDOM: {
        settings: {
          navigation: {
            disableChildFrameNavigation: true,
            disableChildPageNavigation: true,
          },
        },
      },
    },
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
      "@test-fixtures": path.resolve(__dirname, "./test/fixtures"),
    },
  },
});
