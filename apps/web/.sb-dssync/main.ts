// Scoped Storybook config for design-sync: UI + Layout stories only.
// Mirrors ../.storybook/main.ts but narrows the stories glob so the design-sync
// reference build (the fidelity oracle) indexes only the synced scope.
import type { StorybookConfig } from "@storybook/nextjs-vite";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    "../src/components/design-system/**/*.stories.@(ts|tsx)",
    "../src/components/layout/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: [
    "../public",
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
