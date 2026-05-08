import type { StorybookConfig } from "@storybook/nextjs-vite";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    // Foundation MDX is rendered via sibling .stories.tsx wrappers so the
    // test-runner (which excludes type=docs entries) can baseline them. The
    // wrappers import each .mdx as a React component — see
    // src/stories/foundation/<Name>.stories.tsx.
    "!../src/stories/foundation/**/*.mdx",
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
