import {
  type TestRunnerConfig,
  getStoryContext,
  waitForPageReady,
} from "@storybook/test-runner";
import { toMatchImageSnapshot } from "jest-image-snapshot";

// Phase 1 tracer bullet: only these story IDs participate in VR.
//
// Belt-and-braces filtering:
//   1. `--includeTags vr` (set in apps/web/Dockerfile.vr + apps/web/package.json)
//      narrows test-runner discovery to story FILES with `tags: ["vr"]` in
//      their meta — cheap and coarse.
//   2. PHASE1_STORIES below narrows the EXPORTS within those tagged files —
//      precise. Without it, every export in a tagged file would be screenshotted
//      (e.g. all 25 SectionTransition variants), which exceeds Phase 1's
//      "5 stories × 3 viewports = 15 baselines" scope (PRD §12).
//
// Phase 2 collapses to tag-only when every export in a tagged file is
// intended to be a baseline.
const PHASE1_STORIES = new Set([
  "layout-pagefooter--standalone",
  "ui-sectiontransition--single-diagonal-left",
  "ui-sectiontransition--single-diagonal-right",
  "ui-sectionstack--playground",
  "ui-sectionstack--homepage-full-stack",
]);

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

type ViewportName = keyof typeof VIEWPORTS;

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },
  async postVisit(page, context) {
    if (!PHASE1_STORIES.has(context.id)) return;

    const story = await getStoryContext(page, context);
    const vrParams = (story.parameters?.vr ?? {}) as {
      disable?: boolean;
      viewports?: ReadonlyArray<ViewportName>;
    };
    if (vrParams.disable) return;

    const allViewportNames = Object.keys(VIEWPORTS) as ViewportName[];
    const requestedViewports = vrParams.viewports ?? allViewportNames;

    // Fail fast on bad inputs: an empty array is almost certainly a typo (the
    // story author meant to disable VR via `vr.disable: true` instead), and
    // unknown names would silently no-op the screenshot — exactly the kind of
    // silent skip VR is supposed to catch.
    if (requestedViewports.length === 0) {
      throw new Error(
        `[VR] Story "${context.id}" declared parameters.vr.viewports = []. ` +
          `Use parameters.vr.disable = true to opt out instead.`,
      );
    }
    const unknown = requestedViewports.filter((name) => !(name in VIEWPORTS));
    if (unknown.length > 0) {
      throw new Error(
        `[VR] Story "${context.id}" requested unknown viewport(s): ` +
          `${unknown.join(", ")}. Valid: ${allViewportNames.join(", ")}.`,
      );
    }

    await waitForPageReady(page);
    // Belt-and-braces font stabilisation: waitForPageReady covers most cases,
    // but document.fonts.ready guarantees web fonts are committed before paint.
    await page.evaluate(() => document.fonts?.ready);

    for (const name of requestedViewports) {
      const vp = VIEWPORTS[name];
      await page.setViewportSize(vp);
      await page.evaluate(() => document.fonts?.ready);
      const image = await page.screenshot({
        fullPage: true,
        animations: "disabled",
      });
      expect(image).toMatchImageSnapshot({
        customSnapshotIdentifier: `${context.id}--${name}`,
        customSnapshotsDir: "test/vr/__snapshots__",
        customDiffDir: "test/vr/__diff_output__",
        failureThreshold: 0.001,
        failureThresholdType: "percent",
      });
    }
  },
};

export default config;
