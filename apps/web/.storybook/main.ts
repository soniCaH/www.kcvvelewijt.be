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
    // IBM Plex Mono, self-hosted permanently under its OFL licence (#3137) —
    // lives beside .storybook rather than under `public/` so it never ships
    // to production as a dead asset (Next.js self-hosts its own copy via
    // `next/font/google` in app/layout.tsx; Storybook never renders that
    // layout, hence this separate copy — see preview-head.html). Served at
    // `/fonts/ibm-plex-mono/...`, same as if it lived in `public/`.
    { from: "fonts/ibm-plex-mono", to: "/fonts/ibm-plex-mono" },
    // NOTE: Adobe Typekit is deliberately NOT a staticDirs entry. Its cache
    // (scripts/prefetch-typekit.mjs) is read directly off disk by
    // test-runner.ts's `route.fulfill`, never served over HTTP — baking it
    // into `storybook-static` would make CI's public build-artifact upload
    // redistribute Adobe's files, whose terms forbid self-hosting (#3137).
  ],
  viteFinal: async (cfg) => {
    cfg.resolve ??= {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias as Record<string, string> | undefined),
      // Vite stopped applying the tsconfig `@/*` path to `.mdx` importers in
      // 8.1, so `SpacingAndIcons.mdx` fails to resolve `@/lib/icons.redesign`.
      // Declaring it here is version-proof either way.
      "@": resolve(__dirname, "../src"),
      "@test-fixtures": resolve(__dirname, "../test/fixtures"),
    };
    return cfg;
  },
};
export default config;
