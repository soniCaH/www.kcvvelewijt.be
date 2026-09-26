import { defineConfig, devices } from "@playwright/test";

import { derivePort } from "../../scripts/e2e-dev-port.mjs";

// Phase 0.5 — Page-level Playwright e2e suite.
// PRD: docs/prd/page-level-testing-rework.md
// This config is dedicated to the e2e suite and is NOT shared with the
// Storybook test-runner (which has its own internal config) or the legacy
// VR config at apps/web/playwright.config.ts.

const EXTERNAL_BASE_URL = process.env.BASE_URL;
// A wave's second lane must never reuse another worktree's dev server under
// `webServer.reuseExistingServer` below — it would silently test the wrong
// build (#3141 member 5). `derivePort` keys off this file's own absolute
// path, which differs by worktree, so the port does too; the SAME worktree
// still gets the same port (and therefore a legitimate reuse) run after run.
const DEV_SERVER_PORT = derivePort(__dirname);
const BASE_URL = EXTERNAL_BASE_URL ?? `http://localhost:${DEV_SERVER_PORT}`;

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  // `github-summary` writes flaky/skipped counts to the job summary (#2971):
  // this job exits 0 for a passed test, a retried-then-passed one and a
  // data-guard-skipped one alike, and only the first verified anything.
  reporter: process.env.CI
    ? [
        ["github"],
        ["list"],
        // The `playwright-report` artifact the workflow uploads had no
        // producer — no `html` reporter was registered, so it was always
        // empty. It is the surface you actually read a flaky attempt from.
        ["html", { open: "never" }],
        ["../reporters/github-summary.ts"],
      ]
    : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: EXTERNAL_BASE_URL
    ? undefined
    : {
        // Run from the workspace via pnpm filter so cwd doesn't matter.
        // Local devs invoke from `apps/web/`; CI invokes from repo root.
        // `-p` binds this worktree's own derived port (#3141 member 5) — a
        // bare `next start` would always bind :3000, and a second worktree's
        // `reuseExistingServer` would then quietly reuse it and test the
        // wrong build.
        command: `pnpm --filter @kcvv/web exec next start -p ${DEV_SERVER_PORT}`,
        url: BASE_URL,
        timeout: 180_000,
        // Never true (#3141 finding 9): `reuseExistingServer` matches by URL
        // alone, so a hash collision between two worktrees — or any other
        // process that happens to be listening on this derived port — would
        // silently test the wrong build instead of failing loudly. This
        // trades away reusing your OWN already-running server; if one is up,
        // run against it directly with `BASE_URL=http://localhost:$(pnpm
        // --filter @kcvv/web run --silent e2e:port) pnpm --filter @kcvv/web
        // run test:e2e` instead, which skips `webServer` entirely (see
        // EXTERNAL_BASE_URL above).
        reuseExistingServer: false,
        stdout: "pipe",
        stderr: "pipe",
      },
});
