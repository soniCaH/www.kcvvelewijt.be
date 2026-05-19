import {
  type TestRunnerConfig,
  getStoryContext,
  waitForPageReady,
} from "@storybook/test-runner";
import { toMatchImageSnapshot } from "jest-image-snapshot";

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

type ViewportName = keyof typeof VIEWPORTS;

// Fixed timestamp pinned to 2026-01-15T12:00:00.000Z. Stories that derive
// "today" or relative dates render against this exact moment so baselines
// don't churn day-to-day. Derived from the ISO string at module load so
// the comment and the runtime value can never drift.
const FIXED_NOW_MS = Date.parse("2026-01-15T12:00:00.000Z");
// Seed for the mulberry32 PRNG below — any positive 32-bit integer works;
// changing it would invalidate every baseline that exercises Math.random.
const PRNG_SEED = 0x1234abcd;
// Cap on the per-viewport image-load wait. A broken image must not hang the
// runner, but we still need long enough for a real srcset swap to settle.
const IMAGE_LOAD_TIMEOUT_MS = 1500;
// Cap on the per-viewport `page.waitForLoadState("networkidle")` wait. Storybook
// keeps a few long-poll connections open for HMR, so networkidle is a soft
// signal — if it doesn't resolve in time we still fall through to the explicit
// per-image load + decode pair below, which is what actually guarantees a
// stable screenshot.
const NETWORK_IDLE_TIMEOUT_MS = 3000;

// Runs in the page context BEFORE any story script. Stubs sources of
// non-determinism that would otherwise produce per-run pixel drift:
//   - Date / Date.now → fixed instant so "today" / "x minutes ago" labels stay
//     stable across runs. `new StubDate()` intentionally returns a real
//     `Date` instance — value semantics are all the runtime cares about and
//     hooking up the prototype chain risks breaking unrelated `instanceof`
//     checks inside Storybook.
//   - Math.random → deterministic mulberry32 PRNG. The runner re-seeds via
//     `globalThis.__VR_RESET_PRNG__()` between stories (see preVisit) so PRNG
//     consumption order doesn't depend on which other story rendered first
//     in the same test file.
// Animations are disabled separately via Playwright's `animations: "disabled"`
// screenshot option plus a stylesheet injected per story (see postVisit).
function determinismInitScript({
  fixedNowMs,
  prngSeed,
}: {
  fixedNowMs: number;
  prngSeed: number;
}) {
  const RealDate = Date;
  function StubDate(
    this: unknown,
    ...args: ConstructorParameters<typeof Date>
  ) {
    if (!(this instanceof StubDate)) return new RealDate(fixedNowMs).toString();
    if (args.length === 0) return new RealDate(fixedNowMs);
    return new (RealDate as new (
      ...a: ConstructorParameters<typeof Date>
    ) => Date)(...args);
  }
  StubDate.prototype = RealDate.prototype;
  StubDate.now = () => fixedNowMs;
  StubDate.parse = RealDate.parse.bind(RealDate);
  StubDate.UTC = RealDate.UTC.bind(RealDate);
  Object.setPrototypeOf(StubDate, RealDate);
  (globalThis as { Date: DateConstructor }).Date =
    StubDate as unknown as DateConstructor;

  let s = prngSeed >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  (globalThis as { __VR_RESET_PRNG__?: () => void }).__VR_RESET_PRNG__ = () => {
    s = prngSeed >>> 0;
  };
}

// Stylesheet injected per story before screenshot. CSS keyframes/transitions
// would otherwise fire when the viewport resizes between mobile/tablet/desktop
// captures, leaving the second and third screenshots mid-animation.
const DETERMINISM_STYLESHEET = `
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
}
input, textarea {
  caret-color: transparent !important;
}
`;

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },
  // `prepare` runs once per page lifecycle, BEFORE the test-runner's only
  // page.goto(iframe.html). Installing init scripts here guarantees they run
  // before any Storybook code so Date.now / Math.random are stubbed for every
  // story render. We replicate the default prepare body — a single page.goto —
  // because overriding `prepare` opts out of test-runner's default
  // implementation entirely. Re-audit this body against
  // `node_modules/@storybook/test-runner/dist/index.js` `defaultPrepare` after
  // every dep bump.
  async prepare({ page, browserContext, testRunnerConfig: cfg }) {
    try {
      await browserContext.addInitScript(determinismInitScript, {
        fixedNowMs: FIXED_NOW_MS,
        prngSeed: PRNG_SEED,
      });
    } catch (err) {
      throw new Error(
        `[VR] Failed to install determinism stubs in prepare(): ${
          (err as Error).message
        }`,
      );
    }

    // Abort all external video network: YouTube / Vimeo iframes (embed stories
    // are vr.disabled, but Storybook test-runner still mounts the iframe during
    // the smoke-test, and the resulting load keeps the browser context's
    // `networkidle` busy long enough that the *next* story in the same
    // .stories.tsx file — typically an upload-path width/aspect story — runs
    // out the 30s smoke-test budget on `waitForPageReady`. Same defence covers
    // the Big Buck Bunny / Sintel MP4 hosts: `<video>` is rendered post-click
    // only, but blocking the host means a future story that ever auto-plays
    // (or a regression that does) can't take the suite down.
    await browserContext.route(
      (url) =>
        /(?:^|\.)(?:youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com|vimeo\.com|vimeocdn\.com)$/.test(
          url.hostname,
        ) || url.hostname === "commondatastorage.googleapis.com",
      (route) => route.abort(),
    );

    const targetURL = process.env.TARGET_URL;
    if (!targetURL) {
      throw new Error(
        "[VR] TARGET_URL is not set; the test-runner did not pass it through.",
      );
    }
    const iframeURL = new URL("iframe.html", targetURL).toString();

    if (cfg?.getHttpHeaders) {
      const headers = await cfg.getHttpHeaders(iframeURL);
      await browserContext.setExtraHTTPHeaders(headers);
    }

    // Mirror defaultPrepare's connection-refused message so VR users get the
    // same "is your storybook running?" hint they would without our override.
    await page.goto(iframeURL, { waitUntil: "load" }).catch((err) => {
      const message = (err as Error).message ?? "";
      if (message.includes("ERR_CONNECTION_REFUSED")) {
        throw new Error(
          `[VR] Could not access the Storybook instance at ${targetURL}. Is it running?\n\n${message}`,
        );
      }
      throw err;
    });
  },
  // Re-seed the PRNG before each story so consumption order is independent of
  // which other story rendered first in the same `.stories.tsx` file. Without
  // this, every story past the first inherits whatever state the previous
  // story left behind.
  async preVisit(page) {
    await page.evaluate(() => {
      (globalThis as { __VR_RESET_PRNG__?: () => void }).__VR_RESET_PRNG__?.();
    });
  },
  async postVisit(page, context) {
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

    await page.addStyleTag({ content: DETERMINISM_STYLESHEET });
    // Park the mouse off-canvas before any screenshot so a stray cursor
    // position from the previous story can't trigger `:hover` styles on
    // whichever element happens to sit under (0, 0) (the Playwright default).
    // Hover transitions are zero-duration via DETERMINISM_STYLESHEET, but the
    // end-state — `group-hover:scale-105`, `hover:-translate-y-1`, the green
    // top-border clip-path swap — would still snap on and produce a diff.
    await page.mouse.move(-1, -1);
    await waitForPageReady(page);
    await page.evaluate(() => document.fonts?.ready);

    for (const name of requestedViewports) {
      const vp = VIEWPORTS[name];
      await page.setViewportSize(vp);
      // `page.setViewportSize` returns as soon as the browser has accepted the
      // resize, but CSS reflow + the next paint pass happen asynchronously.
      // Poll on the document's own `clientWidth` so we don't proceed until the
      // page has actually adopted the new viewport — without this, the
      // screenshot can land mid-reflow and capture content laid out for the
      // previous viewport inside the new viewport's clip box (#1731 desktop
      // failure mode). Soft-capped so a story that somehow never adopts the
      // width can't hang the runner.
      await page
        .waitForFunction(
          (expectedWidth) =>
            document.documentElement.clientWidth === expectedWidth,
          vp.width,
          { timeout: 2000 },
        )
        .catch(() => {
          // Fall through — the rAF wait below will still flush layout.
        });
      await page.evaluate(() => document.fonts?.ready);
      // Viewport changes can re-trigger Next/Image's responsive `srcset`,
      // swapping in a different file. Without this wait the screenshot races
      // the swap and the same story flickers between runs. Capped at
      // IMAGE_LOAD_TIMEOUT_MS so a story with a broken image doesn't hang
      // the whole runner — failures emit a console.warn so the cause is
      // discoverable from CI logs without re-running locally.
      // `next/image` lazy-loads via the `loading="lazy"` attribute AND an
      // intersection observer. Flipping the attribute alone does not
      // retrigger the IO; CI screenshots showed below-fold images still
      // empty even after the eager flip. Scroll to bottom + back to top
      // first so every IO callback fires, then flip the attribute as a
      // belt-and-braces, then wait. Test-runner-only.
      await page.evaluate(async () => {
        const fullHeight = document.documentElement.scrollHeight;
        window.scrollTo(0, fullHeight);
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        window.scrollTo(0, 0);
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      });
      // After `setViewportSize`, the browser may pick a different `srcset`
      // candidate for every `<img>` and kick off a fresh network request. Wait
      // for the network to settle so the per-image load/decode pair below
      // operates on the final candidate, not the previous one. Soft-capped so
      // Storybook's HMR long-poll can't hang the runner.
      await page
        .waitForLoadState("networkidle", { timeout: NETWORK_IDLE_TIMEOUT_MS })
        .catch(() => {
          // networkidle is a soft signal — fall through to the explicit
          // per-image waits, which are what actually gate the screenshot.
        });
      await page.evaluate(
        async ([loadTimeoutMs]: [number]) => {
          for (const img of Array.from(document.images)) {
            if (img.loading === "lazy") img.loading = "eager";
          }
          const imageWaits = Array.from(document.images)
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise<void>((resolve) => {
                  img.addEventListener("load", () => resolve(), { once: true });
                  img.addEventListener(
                    "error",
                    () => {
                      console.warn(`[VR] image failed to load: ${img.src}`);
                      resolve();
                    },
                    { once: true },
                  );
                }),
            );
          if (imageWaits.length > 0) {
            await Promise.race([
              Promise.all(imageWaits),
              new Promise((resolve) => setTimeout(resolve, loadTimeoutMs)),
            ]);
          }
          // `img.complete === true` (and the `load` event having fired) only
          // means bytes arrived — the bitmap may still be undecoded and not
          // yet committed to the compositor when `page.screenshot()` runs,
          // producing intermittent low-res / placeholder-bleed diffs in CI.
          // `HTMLImageElement.decode()` resolves only once the bitmap is
          // decoded and ready to paint, which is the actual guarantee
          // `page.screenshot()` needs. This is the fix for #1731 (NewsGrid
          // tablet tile flake) and is intentionally applied to every image,
          // not just NewsGrid's, so any future story with srcset-driven
          // tiles inherits the same guarantee.
          await Promise.allSettled(
            Array.from(document.images).map((img) =>
              img.decode().catch(() => {
                console.warn(`[VR] image failed to decode: ${img.src}`);
              }),
            ),
          );
        },
        [IMAGE_LOAD_TIMEOUT_MS] as [number],
      );
      // Wait for two animation frames so that ResizeObserver callbacks
      // (e.g. useScrollHint in FilterTabs) and the React re-renders they
      // trigger have been painted before the screenshot is taken.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );
      // `fullPage: true` would extend horizontally past `vp.width` whenever
      // a story has horizontal overflow (e.g. UI/HorizontalSlider) — and
      // that overflow can be a few px wider on Apple Silicon than on x86,
      // producing size-mismatch failures unrelated to actual rendering.
      // Clip every screenshot to `vp.width` while still using the full
      // scrollHeight, so baselines are always exactly viewport-width.
      const fullHeight = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      const image = await page.screenshot({
        animations: "disabled",
        clip: { x: 0, y: 0, width: vp.width, height: fullHeight },
      });
      expect(image).toMatchImageSnapshot({
        customSnapshotIdentifier: `${context.id}--${name}`,
        customSnapshotsDir: "test/vr/__snapshots__",
        customDiffDir: "test/vr/__diff_output__",
        // 0.05% — tight enough to catch real visual regressions while absorbing
        // sub-pixel anti-aliasing noise. ARM ↔ x86 drift no longer needs
        // absorbing locally because the kcvv-vr-bot canonicalises baselines on
        // CI (KCVV_VR_BOT_TOKEN is configured). Real regressions (diagonal seam
        // hairlines, layout reflows, gradient breaks) produce >0.05% diffs.
        failureThreshold: 0.0005,
        failureThresholdType: "percent",
      });
    }
  },
};

export default config;
