import type { StorybookConfig } from "@storybook/nextjs-vite";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// `staticDirs` below must exist at config-eval time or Storybook refuses to
// start. `scripts/prefetch-typekit.mjs` (run once per Storybook build — see
// the `build-storybook` / `vr:build-storybook` package.json scripts) fills
// this directory with the actual prefetched CSS + font files; this guard
// just guarantees the directory itself is there even before that script has
// ever run (a fresh checkout, or plain `pnpm storybook` dev). Gitignored —
// see root .gitignore — because the fetched content carries Adobe's Typekit
// terms, not this repo's licence (#3137).
mkdirSync(resolve(__dirname, ".typekit-cache/fonts"), { recursive: true });

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
    // Adobe Typekit, prefetched once per run — see scripts/prefetch-typekit.mjs
    // and the mkdirSync guard above. Served at `/typekit-cache/...` so
    // preview-head.html links to it instead of the live use.typekit.net CDN
    // (#3137).
    { from: ".typekit-cache", to: "/typekit-cache" },
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
