// RESERVED FOR PHASE 4 — not invoked by Phase 1's `vr:check` / `vr:ci` scripts.
// Phase 1 captures Storybook baselines via `.storybook/test-runner.ts` (which
// uses jest-image-snapshot, not Playwright's native `toHaveScreenshot`). This
// file exists so Phase 4 can drop in real-page composition snapshots without
// re-bootstrapping Playwright config.
//
// Do not run `npx playwright test` against this — there are no Phase 1 specs
// under `test/vr/`, so it'll exit "no tests found".

import { defineConfig, devices } from "@playwright/test";

// VR baselines live alongside this config. Linear naming
// `<story-id>--<viewport>.png` is enforced inside the @storybook/test-runner
// post-visit hook (.storybook/test-runner.ts) — Playwright's own
// `toHaveScreenshot` is reserved for Phase 4 (real-page composition snapshots).
const VR_SNAPSHOT_DIR = "test/vr/__snapshots__";

export default defineConfig({
  testDir: "./test/vr",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  snapshotPathTemplate: `${VR_SNAPSHOT_DIR}/{arg}--{projectName}.png`,
  use: {
    baseURL: process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
