import type { StorybookConfig } from "@storybook/nextjs-vite";

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
  staticDirs: ["../public"],
};
export default config;
