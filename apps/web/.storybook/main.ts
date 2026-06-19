import type { StorybookConfig } from "@storybook/nextjs-vite";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    // Foundation docs are authored as MDX with an explicit `<Meta title="Foundation/…" />`
    // and register directly as native Docs pages (no `.stories.tsx` wrappers).
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@storybook/addon-mcp",
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: [
    "../public",
    // Curated local fixture pool for stories — see
    // apps/web/test/fixtures/images/README.md. Served at
    // `/test-fixtures/images/...` so VR snapshots don't depend on
    // remote placeholder services.
    { from: "../test/fixtures/images", to: "/test-fixtures/images" },
  ],
  viteFinal: async (cfg) => {
    cfg.resolve ??= {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias as Record<string, string> | undefined),
      "@test-fixtures": resolve(__dirname, "../test/fixtures"),
    };
    return cfg;
  },
};
export default config;
