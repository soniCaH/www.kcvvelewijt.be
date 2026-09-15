import { defineConfig, devices } from "@playwright/test";

// Phase 0.5 — Page-level Playwright e2e suite.
// PRD: docs/prd/page-level-testing-rework.md
// This config is dedicated to the e2e suite and is NOT shared with the
// Storybook test-runner (which has its own internal config) or the legacy
// VR config at apps/web/playwright.config.ts.

const EXTERNAL_BASE_URL = process.env.BASE_URL;
const BASE_URL = EXTERNAL_BASE_URL ?? "http://localhost:3000";

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
        command: "pnpm --filter @kcvv/web exec next start",
        url: BASE_URL,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
      },
});
