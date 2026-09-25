import path from "node:path";
import { createRequire } from "node:module";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname = import.meta.dirname;
const require = createRequire(import.meta.url);

// Wires the Storybook test addon (#3146, spec §4.13) — installed and
// registered in `.storybook/main.ts` since #3086 but dark until now: no test
// plugin, no browser block, no project. `storybookTest()` turns every story
// into a Vitest test that mounts it in a real browser and runs its `play`
// function — smoke-testing every story in the process, not only the ones
// that define `play` (measured #3083 correction: 208 stories, not 11). No
// a11y-in-CI, no interaction debugger, no extra addon-vitest feature beyond
// the plugin + browser block itself — "for play only" per the acceptance
// criterion. Coverage is not special-cased: `--coverage` on `pnpm run
// test:storybook -- --coverage` uses the same `v8` provider as the `unit`
// project (browser-mode-compatible), just via this file's own `test.coverage`
// (Vitest does not share coverage config across separate config files the
// way it does across `projects` in one file).
//
// A SEPARATE CONFIG FILE, invoked via its own `pnpm run test:storybook` —
// never folded into `vitest.config.ts`'s own project list, and never run in
// the same `vitest` CLI invocation as the `unit` suite. Measured 2026-09-25,
// two distinct, unrelated regressions in the `unit` project's tests the
// moment both projects were defined together (as a `test.projects` array,
// tried first, in ONE file or across separate files referenced by string —
// both reproduce it identically):
//   1. `process.env.NODE_ENV` flips from Vitest's default `"test"` to
//      `"development"` for the WHOLE Node process — `storybookTest()`
//      resolving `.storybook/main.ts` → `@storybook/nextjs-vite`'s own
//      Next-config loading sets it as a side effect, and `process.env` is
//      shared by every project in a single Vitest invocation. Next's own
//      `next/image` loader skips its `remotePatterns` hostname validation
//      only under `NODE_ENV === "test"` (`next/dist/shared/lib/
//      image-loader.js`) — 12 unit-test files / 28 tests broke with
//      `Invalid src prop … hostname "cdn.sanity.io" is not configured`.
//   2. Separately, Vite's own SSR module-resolution `conditions` (visible as
//      `--conditions development` on the spawned worker process) also leak
//      across projects sharing one Vitest run — 5 further unit-test files
//      broke importing `next/dist/server/og/image-response.js` with
//      `Cannot find module 'react-server-dom-webpack/static'`, a condition-
//      gated subpath Next only exports under certain resolve conditions.
// Neither is fixable from inside a shared config (the first was patched
// with an explicit `test.env` override before the second surfaced) without
// auditing every conditional codepath both packages branch on — a truly
// separate config file + CLI invocation sidesteps the whole class: nothing
// this file's plugins do can leak into a process that never loads it.
//
// Entirely separate from the VR layer too (`test-storybook` / `pnpm vr:*`,
// `.storybook/test-runner.ts`): that runner captures pixels against
// `storybook-static` and only visits stories opted in via the `vr` tag
// (`--includeTags vr --excludeTags vr-skip`, see `docs/agents/
// testing-ops.md` → "Opt-in via the `vr` tag"). This project never captures
// a screenshot and never touches `test/vr/__snapshots__/`.
export default defineConfig({
  plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
      "@test-fixtures": path.resolve(dirname, "./test/fixtures"),
      // `@storybook/nextjs-vite` aliases the bare `react`/`react-dom`
      // specifiers to Next's own vendored copies (`next/dist/compiled/
      // react`, a single file, not a package directory) so Storybook's
      // render output matches what `next build` ships. Vite forwards that
      // alias into esbuild's dependency-optimizer as a package-prefix
      // alias, and esbuild auto-expands ANY unlisted subpath against it —
      // `import "react/compiler-runtime"` (imported unconditionally by
      // `@portabletext/react`'s dist, present in React 19 whether or not
      // the compiler is enabled) becomes `next/dist/compiled/react/
      // index.js/compiler-runtime`, which fails to resolve because the
      // target is a file, not a directory ("Not a directory (os error
      // 20)"). The plugin already special-cases `react/jsx-runtime` and
      // `react/jsx-dev-runtime` the same way for the same reason; this is
      // one more subpath its list doesn't cover. Point it at the real
      // `react` package's own file instead of Next's copy —
      // `compiler-runtime` is a plain runtime helper, not part of Next's
      // SSR/RSC surface, so this does not reintroduce a React-copy
      // mismatch the way aliasing `react` itself would.
      "react/compiler-runtime": require.resolve("react/compiler-runtime"),
    },
  },
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: "chromium" }],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    // No `environment`/`exclude` copied from `vitest.config.ts`'s own
    // `test` block — `storybookTest()` owns story discovery via
    // `.storybook/main.ts`'s own `stories` glob, not Vitest's test-file
    // globbing.
    //
    // Three files cannot be IMPORTED under this browser project at all
    // (measured 2026-09-25) — `ReferenceError: __dirname is not defined`,
    // thrown while loading `next/server`'s `userAgent()` (`ua-parser-js`)
    // before Storybook's own per-story tag filtering ever gets a chance to
    // run, so a story-level `!test` tag cannot exclude them (that only
    // skips an already-importable story, not an import-time crash). All
    // three import a route's `loading.tsx`, which imports data constants
    // from its sibling `page.tsx`, which pulls in `next/server`
    // transitively via `src/lib/effect/runtime.ts`. None of the three
    // carries the `vr` tag, so the VR layer never exercised this path
    // either — this is a pre-existing coupling this wiring surfaced, not a
    // regression, and decoupling `loading.tsx` from `page.tsx`'s server
    // constants (or lazy-loading `next/server` in the Effect runtime) is
    // out of scope for #3146. Each file carries a matching comment.
    exclude: [
      "src/app/(landing)/jeugd/(index)/JeugdLanding.loading.stories.tsx",
      "src/app/(main)/ploegen/(index)/TeamsLanding.loading.stories.tsx",
      "src/app/(landing)/nieuws/NewsListingClient.stories.tsx",
    ],
  },
});
