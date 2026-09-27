import { type TestRunnerConfig, getStoryContext } from "@storybook/test-runner";
import type { Page } from "@playwright/test";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VR_FROZEN_NOW_ISO } from "../test/vr/frozen-clock.ts";
import {
  VR_VIEWPORT_NAMES,
  type VrViewportName,
  unscopedViewportOverrideMessage,
} from "../test/vr/viewport-scoping.ts";
import { STRUCTURAL_ASSERTIONS } from "../test/vr/structural-assertions.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Populated by `scripts/prefetch-typekit.mjs`, run once per VR invocation
// from `vr:run` (CI) and `scripts/vr-docker.mjs` (local Docker) — see that
// script's docblock for why the cache lives here instead of inside
// `storybook-static`. Loaded once per worker process; if the prefetch step
// never ran, this is `{}` and every Typekit request falls through to the
// deny-and-record path below instead of silently reaching the network.
const TYPEKIT_CACHE_DIR = join(__dirname, ".typekit-cache");
type TypekitCacheEntry = { file: string; contentType: string };
function loadTypekitManifest(): Record<string, TypekitCacheEntry> {
  try {
    return JSON.parse(
      readFileSync(join(TYPEKIT_CACHE_DIR, "manifest.json"), "utf8"),
    ) as Record<string, TypekitCacheEntry>;
  } catch {
    return {};
  }
}
const TYPEKIT_MANIFEST = loadTypekitManifest();
const TYPEKIT_HOSTS = new Set(["use.typekit.net"]);

// Explicit, reviewed abort list — off-machine requests these hosts make
// (YouTube/Vimeo embed iframes, the Big Buck Bunny / Sintel MP4 hosts) are
// known and harmless, so aborting them does NOT count toward the
// denied-request throw below. Embed stories are vr.disabled, but the
// test-runner still mounts the iframe during discovery, and the resulting
// load can keep the browser context's `networkidle` busy long enough that
// the *next* story in the same `.stories.tsx` file runs out its budget;
// blocking these hosts means a future story that ever auto-plays (or a
// regression that does) can't take the suite down either.
const KNOWN_ABORT_HOSTS =
  /(?:^|\.)(?:youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com|vimeo\.com|vimeocdn\.com|commondatastorage\.googleapis\.com)$/;

// Off-machine URLs the deny-by-default route in `prepare` has aborted since
// the last check. Module-scoped so `postVisit` can see what `prepare`'s
// route handler recorded — reset to empty every time it's read (see
// throwIfDenied below), so a denial is attributed to the one story whose
// mount/capture window it fell in, not every story for the rest of the file.
let deniedUrls: string[] = [];

function throwIfDenied(storyId: string): void {
  if (deniedUrls.length === 0) return;
  const offending = deniedUrls;
  deniedUrls = [];
  throw new Error(
    `[VR] Story "${storyId}" triggered ${offending.length} denied ` +
      `off-machine request(s), which must not happen: ${offending.join(", ")}`,
  );
}

/**
 * Runs after the capture flow (the viewport loop and everything feeding
 * it), whether it threw or not. Always clears `deniedUrls` — a `try/catch`
 * around that flow, not a bare call after it, because a failing
 * `toMatchImageSnapshot`/structural assertion/etc. would otherwise skip
 * straight past the denial check, leaving both unreported (never checked)
 * and uncleared (bleeding into the next story's mount-phase check). A
 * capture failure takes priority over a denial — it's rethrown as-is, with
 * the denial reported via `console.warn` alongside it rather than swapped
 * in as the thrown error, so neither piece of information is lost. A clean
 * capture with a recorded denial throws on the denial, same as
 * `throwIfDenied` above.
 */
function reportDeniedAfterCapture(
  storyId: string,
  captureError: unknown,
): void {
  const offending = deniedUrls;
  deniedUrls = [];
  if (offending.length === 0) {
    if (captureError) throw captureError;
    return;
  }
  const denialMessage =
    `[VR] Story "${storyId}" triggered ${offending.length} denied off-machine ` +
    `request(s), which must not happen: ${offending.join(", ")}`;
  if (captureError) {
    console.warn(
      `${denialMessage} (reported alongside the capture failure below)`,
    );
    throw captureError;
  }
  throw new Error(denialMessage);
}

const VIEWPORTS: Record<VrViewportName, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

type ViewportName = VrViewportName;

// Stories that derive "today" or relative dates render against this exact
// moment so baselines don't churn day-to-day. Shared with any story fixture
// that needs to anchor against the same instant — see frozen-clock.ts.
const FIXED_NOW_MS = Date.parse(VR_FROZEN_NOW_ISO);
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
// Cap on each stage of `waitForFontsSettled` below (the targeted `fonts.load`
// pass and the `fonts.ready` backstop each get their own budget). A missing
// or broken face must not hang the runner — see that function's docblock for
// why the wait needs two capped stages instead of a single `fonts.ready`
// await.
const FONT_LOAD_TIMEOUT_MS = 2000;
// Cap on the one `iframe.html` navigation in `prepare`. Playwright's default is
// 30s and the CI opening burst sits right on that cliff: every Jest worker
// cold-launches Chromium and parses the whole preview bundle at the same
// instant, so the first navigation of a run costs an order of magnitude more
// than every later one (which lands on warm OS + V8 caches). Three workers all
// timed out at exactly 30s while 177 of 180 suites passed (#2721). Note this
// is Playwright's navigation budget, NOT Jest's `--testTimeout` — that one
// governs the surrounding test and must stay comfortably above this value.
const INITIAL_NAVIGATION_TIMEOUT_MS = 90000;

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
    return new (
      RealDate as new (...a: ConstructorParameters<typeof Date>) => Date
    )(...args);
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

// Runs in the page context. `document.fonts.ready` alone is NOT a reliable
// "fonts are applied" signal in this repo: Adobe Typekit injects its
// `@font-face` rules ASYNCHRONOUSLY, so `ready` can resolve *before* Freight
// is even pending — `ShareElements.tsx`'s `useAutoFit` documents the exact
// same race (SHARE-1: "Adobe Typekit injects its @font-face ASYNCHRONOUSLY,
// so `fonts.ready` can resolve BEFORE Freight is even pending"), and #2584
// independently measured `ready` flipping back to "loading" at t≈600ms once
// Freight's real fetch actually started. `VIEWPORTS` captures `mobile`
// first, so it was the capture most likely to land inside that window — the
// viewport order is evidence of the race, not its cause, so it stays put.
//
// Fix, mirroring `useAutoFit`'s `fonts.load(font, text)` + `fonts.ready`
// backstop pattern: force every distinct font-family/weight/style
// combination actually RENDERED on the page via a targeted `fonts.load()`
// first — that's a real network/cache fetch of the exact face in use, not a
// readiness flag that can race the loader — THEN fall back to `fonts.ready`
// for anything a later reflow might still need that wasn't on screen yet.
// Do NOT simplify this back to a bare `fonts.ready` await: that is precisely
// the signal this function exists to replace. Both stages are soft-capped,
// like every other wait in this runner, so a missing or broken face can't
// hang a story.
async function waitForFontsSettled(timeoutMs: number) {
  const fonts = document.fonts;
  if (!fonts) return;

  // Font shorthand -> the on-screen text that actually uses it, concatenated
  // across every contributing element. Mirrors useAutoFit's fonts.load(font,
  // text) call (SHARE-1): passing real text means the Font Loading API's
  // glyph probe covers what this render needs instead of the spec default
  // sample ("BESbswy"), which matters the day any freight-* face stops
  // declaring `unicode-range: U+0-10FFFF` (harmless no-op today, since every
  // live face still does).
  const textByFont = new Map<string, string>();
  const addFace = (
    style: string,
    weight: string,
    family: string,
    text: string,
  ) => {
    if (!family) return;
    textByFont.set(
      `${style} ${weight} 16px ${family}`,
      (textByFont.get(`${style} ${weight} 16px ${family}`) ?? "") + text,
    );
  };

  for (const el of Array.from(document.querySelectorAll("*"))) {
    const text = el.textContent ?? "";
    const cs = getComputedStyle(el);
    addFace(cs.fontStyle, cs.fontWeight, cs.fontFamily, text);

    // `::first-letter` is the one pseudo-element font override in this
    // codebase (`DropCapParagraph.tsx` sets `first-letter:font-display-big
    // first-letter:font-black` — a different face/weight than the element
    // itself; `globals.css` declares no other pseudo `font-family` rule, so
    // this stays narrow rather than walking every pseudo speculatively). A
    // plain `getComputedStyle(el)` never sees it, which left the drop cap's
    // freight-big-pro/900 face untargeted and falling through to the `ready`
    // backstop below — exactly the failure mode this function exists to
    // close, on the single largest glyph in an `ArticleBody` capture.
    const firstLetter = getComputedStyle(el, "::first-letter");
    addFace(
      firstLetter.fontStyle,
      firstLetter.fontWeight,
      firstLetter.fontFamily,
      text.charAt(0),
    );
  }

  // `FontFaceSet.load()` rejects its returned promise on a bad shorthand per
  // spec (and in Chromium, the only engine this runner drives) — it does not
  // throw synchronously, so there is nothing here to catch. A rejection just
  // resolves out of `allSettled` below like a slow-but-successful load would.
  const loads = Array.from(textByFont, ([font, text]) =>
    fonts.load(font, text),
  );

  await Promise.race([
    Promise.allSettled(loads),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
  await Promise.race([
    fonts.ready,
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

// Replaces `@storybook/test-runner`'s vendored `waitForPageReady` (#3137,
// flake ledger class G — see #3108's root cause): three uncapped
// `page.waitForLoadState` calls plus an uncapped `document.fonts.ready`
// evaluate. Cut down to what isn't already covered elsewhere in this file,
// rather than mirroring the vendored shape one-for-one:
//   - `load` is dropped — `prepare`'s one `page.goto(..., { waitUntil: "load" })`
//     already awaited it, Storybook never re-navigates between stories (it's
//     an SPA), so a second `load` wait always resolves instantly and checks
//     nothing new.
//   - `fonts.ready` is dropped — the very next line calls
//     `waitForFontsSettled`, which races the same signal itself (see its own
//     docblock for why a bare `fonts.ready` isn't trustworthy on its own).
//     Racing it twice risked leaking an uncleared `setTimeout` handle on the
//     loser of each race, for no additional signal.
// `domcontentloaded` and `networkidle` stay — both still capped (native
// Playwright timeouts, no manual `Promise.race`/`setTimeout` to leak),
// `networkidle` soft (`.catch`) for the same HMR-long-poll reason as
// `NETWORK_IDLE_TIMEOUT_MS` above.
async function waitForPageReadyCapped(page: Page, timeoutMs: number) {
  await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs });
  await page
    .waitForLoadState("networkidle", { timeout: timeoutMs })
    .catch(() => {
      // Soft signal — see NETWORK_IDLE_TIMEOUT_MS above for why.
    });
}

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });

    // Tripwire for the module.register() workaround — see
    // .storybook/allow-module-register.cjs for the full story. This file is
    // loaded through Storybook's serverRequire, which is the very call that
    // registers the loader, so by the time setup() runs the counter must have
    // moved. Zero means Storybook stopped calling it and the workaround is
    // dead code. Nothing else would ever tell us: no version is pinned, so
    // Renovate has nothing to surface.
    if (globalThis.__KCVV_MODULE_REGISTER_CALLS__ === 0) {
      throw new Error(
        "@storybook/test-runner no longer calls module.register(). The " +
          "workaround is obsolete: delete apps/web/.storybook/" +
          "allow-module-register.cjs, delete apps/web/.storybook/" +
          "test-runner-jest.config.mjs, and remove this check.",
      );
    }
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

    const targetURL = process.env.TARGET_URL;
    if (!targetURL) {
      throw new Error(
        "[VR] TARGET_URL is not set; the test-runner did not pass it through.",
      );
    }
    // Read before the route below is registered — the allowlist compares
    // against this exact origin, not just "127.0.0.1/localhost on any port",
    // which would also let through a stray request to the BFF (:8787) or a
    // `next dev` server (:3000) running on the same machine.
    const storybookOrigin = new URL(targetURL).origin;
    const iframeURL = new URL("iframe.html", targetURL).toString();

    // Deny by default: a VR page may not fetch anything off this machine
    // (#3137, flake ledger class G). #3108 root-caused a story-file stall to
    // two live font CDNs (Adobe Typekit, Google Fonts) that the accessibility
    // addon's cross-origin stylesheet preloader re-fetches on every single
    // story — 8 third-party requests for one story, and an unreachable host
    // took the whole story file down because the vendored page-ready wait
    // blocked on the `load` event uncapped (see waitForPageReadyCapped
    // above). The fix is an enforcement route, not a bigger deny-list: allow
    // only the Storybook origin itself and inert `data:`/`blob:` URLs
    // (inlined images, no network at all); fulfil the one Typekit host from
    // the prefetched cache instead of letting it reach the network; abort a
    // small explicit list of known-harmless embed hosts; and record + log
    // (and `postVisit` fails the story on) anything else — so the next
    // third-party `<link>` or `<iframe>` anyone adds becomes impossible
    // instead of unnoticed, which is exactly what let the Typekit/Google
    // Fonts links into preview-head.html unnoticed in the first place.
    // `preview-head.html` keeps its live Typekit `<link>` so plain
    // `pnpm storybook` dev (which never registers this route) just works.
    await browserContext.route("**/*", (route) => {
      const request = route.request();
      const url = new URL(request.url());

      if (
        url.protocol === "data:" ||
        url.protocol === "blob:" ||
        url.origin === storybookOrigin
      ) {
        return route.continue();
      }

      if (TYPEKIT_HOSTS.has(url.hostname)) {
        const cached = TYPEKIT_MANIFEST[request.url()];
        if (cached) {
          return route.fulfill({
            path: join(TYPEKIT_CACHE_DIR, cached.file),
            contentType: cached.contentType,
          });
        }
        // No manifest entry — either scripts/prefetch-typekit.mjs never ran,
        // or the kit added a face this run's prefetch didn't capture. Either
        // way, fall through to the deny-and-record path below rather than
        // silently reaching the live network.
      }

      if (KNOWN_ABORT_HOSTS.test(url.hostname)) {
        return route.abort();
      }

      deniedUrls.push(request.url());
      console.warn(`[VR] denied off-machine request: ${request.url()}`);
      return route.abort();
    });

    // Same rule, WebSocket transport: `browserContext.route` above only ever
    // sees HTTP(S) requests, so a `new WebSocket("wss://…")` off this
    // machine would sail straight past it. Registered before any story
    // script can run, for the same reason the HTTP route is. Not calling
    // `ws.connectToServer()` means Playwright never opens the real
    // connection at all — the closest WebSocket equivalent of `route.abort()`
    // — so a denied socket is recorded and closed rather than left dangling.
    await browserContext.routeWebSocket("**/*", (ws) => {
      const url = new URL(ws.url());
      if (url.origin === storybookOrigin) {
        ws.connectToServer();
        return;
      }
      if (KNOWN_ABORT_HOSTS.test(url.hostname)) {
        ws.close();
        return;
      }
      deniedUrls.push(ws.url());
      console.warn(`[VR] denied off-machine WebSocket: ${ws.url()}`);
      ws.close();
    });

    if (cfg?.getHttpHeaders) {
      const headers = await cfg.getHttpHeaders(iframeURL);
      await browserContext.setExtraHTTPHeaders(headers);
    }

    // Mirror defaultPrepare's connection-refused message so VR users get the
    // same "is your storybook running?" hint they would without our override.
    await page
      .goto(iframeURL, {
        waitUntil: "load",
        timeout: INITIAL_NAVIGATION_TIMEOUT_MS,
      })
      .catch((err) => {
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
  async preVisit(page, context) {
    await page.evaluate(() => {
      (globalThis as { __VR_RESET_PRNG__?: () => void }).__VR_RESET_PRNG__?.();
    });

    // Honour a story's `globals: { viewport: { value: "…" } }` (#3188,
    // review round 2 finding 3) — @storybook/addon-vitest's own
    // `setViewport()` already does this before mount (`testStory()` in
    // `@storybook/addon-vitest/dist/vitest-plugin/test-utils.js`); this
    // mirrors it for test-runner so a `play()` fixture that depends on a
    // named viewport (`StandingsTable`'s `StickyColumnsPinned`,
    // `OrganigramExplorer`'s `ZoomOverflowsTheStage`) gets the SAME real
    // geometry regardless of which runner visits it, instead of needing a
    // `vitest-play-only` opt-out that hides it from this one entirely.
    // `getStoryContext` reads Storybook's own `storyStore.loadStory()` —
    // safe to call here even though "the story is not rendered in the
    // browser" yet (test-runner's own preVisit doc comment): that ONLY
    // means not mounted, not that the preview bundle (loaded once by
    // `prepare()`'s `page.goto`) hasn't registered the story's context.
    const story = await getStoryContext(page, context);
    const storyGlobals = (
      story as { storyGlobals?: { viewport?: { value?: string } } }
    ).storyGlobals;
    const viewportValue = storyGlobals?.viewport?.value;
    if (viewportValue) {
      const viewportOptions = (
        story.parameters?.viewport as
          | { options?: Record<string, { styles?: Record<string, string> }> }
          | undefined
      )?.options;
      const entry = viewportOptions?.[viewportValue];
      const width = entry?.styles?.width
        ? Number.parseInt(entry.styles.width, 10)
        : undefined;
      const height = entry?.styles?.height
        ? Number.parseInt(entry.styles.height, 10)
        : undefined;
      if (width && height) {
        await page.setViewportSize({ width, height });
      }
      // An unresolvable value (a typo, or "responsive"/"reset", which carry
      // no `styles` entry at all) is left alone — postVisit's own per-
      // viewport loop still drives the real capture size for a `vr`-tagged
      // story either way, and a non-`vr` story with a bad value simply
      // renders at whatever size `page` already had.
    }
  },
  async postVisit(page, context) {
    // Covers the mount phase — anything the story pulled in between
    // `preVisit` and here. See throwIfDenied above.
    throwIfDenied(context.id);

    const story = await getStoryContext(page, context);
    const vrParams = (story.parameters?.vr ?? {}) as {
      disable?: boolean;
      viewports?: ReadonlyArray<ViewportName>;
    };
    const storyTags = (story.tags ?? []) as readonly string[];
    // `vr:run` (#3188) now visits EVERY story, sharded — one runner
    // decides per story whether to screenshot or just axe-check, instead
    // of two complementary CLI selections (a `--includeTags vr
    // --excludeTags vr-skip` pixel run plus a separate `--excludeTags vr`
    // axe-only run) that between them missed any story combining an
    // inherited `vr` tag with a per-story `vr-skip` override (7 such
    // stories across 6 files got no axe check at all under the old split).
    // A story screenshots only when it carries `vr`, does NOT carry
    // `vr-skip`, and does not set `parameters.vr.disable` — every other
    // story (no `vr` tag at all — `Pages/*` and any component that never
    // got tagged — or `vr-skip`, or `vr.disable`) still gets the a11y
    // check above (Storybook's own render lifecycle populates it
    // regardless of what postVisit does), just no screenshot and no
    // baseline.
    const shouldScreenshot =
      storyTags.includes("vr") && !storyTags.includes("vr-skip");
    // Opt-in structural assertions (#2861, see test/vr/structural-assertions.ts)
    // — a story tag beyond the pixel-snapshot comparison below. Resolved
    // ahead of the `vr.disable` early-return so a story can't silently
    // combine the tag with `vr.disable` and have the assertion never run.
    const applicableAssertions = STRUCTURAL_ASSERTIONS.filter((assertion) =>
      storyTags.includes(assertion.tag),
    );
    if (vrParams.disable || !shouldScreenshot) {
      if (applicableAssertions.length > 0) {
        throw new Error(
          `[VR] Story "${context.id}" is tagged with structural assertion(s) ` +
            `(${applicableAssertions.map((a) => a.tag).join(", ")}) but also ` +
            `sets parameters.vr.disable = true (or carries no "vr" tag, or ` +
            `carries "vr-skip"), which returns before those assertions ever ` +
            `run. Remove the tag or the opt-out.`,
        );
      }
      return;
    }

    const allViewportNames = VR_VIEWPORT_NAMES;
    const requestedViewports = vrParams.viewports ?? allViewportNames;

    // Fail fast on bad inputs: an empty array is almost certainly a typo (the
    // story author meant to disable VR via `vr.disable: true` instead),
    // unknown names would silently no-op the screenshot, and a Storybook
    // viewport override — `globals.viewport.value` (the live Storybook 10
    // API) or `parameters.viewport.defaultViewport` (removed in Storybook
    // 10, inert either way) — with no matching `vr.viewports`/`vr.disable`
    // looks scoped but isn't (the runner reads neither) — all three are
    // exactly the kind of silent skip VR is supposed to catch.
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
    const storyGlobals = (
      story as { storyGlobals?: { viewport?: { value?: string } } }
    ).storyGlobals;
    const effectiveViewport =
      storyGlobals?.viewport?.value ??
      (story.parameters?.viewport as { defaultViewport?: string } | undefined)
        ?.defaultViewport;
    const unscopedMessage = unscopedViewportOverrideMessage(
      context.id,
      effectiveViewport,
      vrParams.viewports !== undefined,
    );
    if (unscopedMessage) {
      throw new Error(unscopedMessage);
    }

    // A story can be tagged for a structural assertion yet scope its own
    // `vr.viewports` to exclude the viewport that assertion needs — another
    // shape of the same silent no-op the two throws above already guard
    // against, so catch it the same way rather than let the assertion just
    // never run for that story.
    const missingAssertionViewport = applicableAssertions.find(
      (assertion) => !requestedViewports.includes(assertion.viewport),
    );
    if (missingAssertionViewport) {
      throw new Error(
        `[VR] Story "${context.id}" is tagged ` +
          `"${missingAssertionViewport.tag}" but parameters.vr.viewports ` +
          `does not include "${missingAssertionViewport.viewport}", so the ` +
          `assertion would never run. ${missingAssertionViewport.description}`,
      );
    }

    // Wrapped so a failing capture (a snapshot mismatch, a structural
    // assertion, any thrown error below) still runs the denial check/clear
    // in reportDeniedAfterCapture — see that function's docblock.
    let captureError: unknown;
    try {
      await page.addStyleTag({ content: DETERMINISM_STYLESHEET });
      // Park the mouse off-canvas before any screenshot so a stray cursor
      // position from the previous story can't trigger `:hover` styles on
      // whichever element happens to sit under (0, 0) (the Playwright default).
      // Hover transitions are zero-duration via DETERMINISM_STYLESHEET, but the
      // end-state — `group-hover:scale-105`, `hover:-translate-y-1`, the green
      // top-border clip-path swap — would still snap on and produce a diff.
      await page.mouse.move(-1, -1);
      await waitForPageReadyCapped(page, NETWORK_IDLE_TIMEOUT_MS);
      await page.evaluate(waitForFontsSettled, FONT_LOAD_TIMEOUT_MS);

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
        // Re-run the targeted font wait per viewport, not only once before the
        // loop: a resize can swap in markup a viewport-conditional component
        // renders only at that breakpoint (e.g. a ResizeObserver-driven
        // change), or flip which face a responsive utility (`sm:font-display`,
        // a weight breakpoint) resolves to — either way a face `getComputedStyle`
        // never saw at the previous viewport, and that face is exactly the one
        // still racing Typekit's async injection (SHARE-1).
        await page.evaluate(waitForFontsSettled, FONT_LOAD_TIMEOUT_MS);
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
                    img.addEventListener("load", () => resolve(), {
                      once: true,
                    });
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
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              );
            }),
        );

        // Structural assertions (#2861) scoped to this viewport — real
        // `scrollWidth` vs `clientWidth` on a fixture, checked on every VR run
        // regardless of what live data happens to contain that day. See
        // test/vr/structural-assertions.ts for the mechanism and
        // structural-assertions.test.ts for why a renamed/removed tag can't
        // make this silently stop running.
        for (const assertion of applicableAssertions) {
          if (assertion.viewport !== name) continue;
          // Scoped to the story's own rendered root, not the bare document —
          // `trackSelector` is documented (structural-assertions.ts) as
          // resolving under `#storybook-root`, so a caller who writes a
          // generic selector (e.g. '[role="region"]') can't accidentally
          // match chrome outside the story or trip `trackCount !== 1` against
          // an autodocs/composed page that renders more than one instance.
          const track = page
            .locator("#storybook-root")
            .locator(assertion.trackSelector);
          const trackCount = await track.count();
          if (trackCount !== 1) {
            throw new Error(
              `[VR] Story "${context.id}" is tagged "${assertion.tag}" but ` +
                `its track selector (${assertion.trackSelector}, queried ` +
                `under #storybook-root) matched ${trackCount} element(s) at ` +
                `the ${name} viewport, expected exactly 1. ` +
                `${assertion.description}`,
            );
          }
          const { scrollWidth, clientWidth } = await track.evaluate((el) => ({
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
          }));
          if (scrollWidth <= clientWidth) {
            throw new Error(
              `[VR] Story "${context.id}" is tagged "${assertion.tag}" but ` +
                `its scroll track did not overflow at the ${name} viewport ` +
                `(scrollWidth=${scrollWidth}, clientWidth=${clientWidth}). ` +
                `${assertion.description}`,
            );
          }
        }

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
          // Without this, `-u` skips any capture that PASSES the threshold, so a
          // sub-threshold drift leaves the stale PNG on disk (flake ledger row
          // 20, #3136). Proved by
          // `pnpm --filter @kcvv/web run vr:accept:sub-threshold`.
          updatePassedSnapshot: true,
        });
      }
    } catch (err) {
      captureError = err;
    }
    // Covers the capture phase — image/font loads triggered while the
    // viewport loop above ran, and the mouse/page-ready/font-settle calls
    // before it. See reportDeniedAfterCapture above.
    reportDeniedAfterCapture(context.id, captureError);
  },
};

export default config;
