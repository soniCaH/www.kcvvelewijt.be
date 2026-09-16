import {
  expect,
  type ConsoleMessage,
  type Page,
  type Request,
  type Response,
} from "@playwright/test";
import { gotoBounded } from "./goto";

export interface SmokeOptions {
  path: string;
  /** HTTP status the page is expected to return. Defaults to 200. */
  expectedStatus?: number;
  /**
   * Substrings (or RegExps) of console.error texts to ignore. Use sparingly —
   * production code should not emit console.error in the routes we exercise.
   * The default ignore-list covers known third-party noise (cookie consent,
   * analytics) that is not actionable from the page-level smoke layer.
   */
  ignoreConsoleErrors?: Array<string | RegExp>;
}

const DEFAULT_IGNORE_CONSOLE_ERRORS: Array<string | RegExp> = [
  // Next/Image priority hints — informational, not a regression signal.
  /priority/i,
  // Adobe Typekit init race between two afterInteractive scripts; pre-existing
  // quirk in apps/web/src/app/layout.tsx. Fix would require lifting Typekit
  // into a client component to use `onLoad`.
  /Typekit load error/,
  // Chromium logs "Failed to load resource: status of <code>" for every
  // sub-resource that 4xx/5xx. THIS FILTER INTENTIONALLY MAKES THE SMOKE
  // LAYER TOLERANT OF ASSET-GAP NOISE — visible-image breakage is covered
  // by the broken-image check below, but CSS background images, font 4xx,
  // missing prefetch payloads, and other non-`<img>` assets do NOT fail
  // the test. They are still captured into `failedRequests` for the
  // diagnostics block when a real console.error fires, but on their own
  // they are advisory, not load-bearing. Real JS runtime errors
  // (TypeError, ReferenceError, unhandled rejections) are NOT filtered
  // and still fail the smoke assertion.
  /^Failed to load resource:/,
];

/**
 * Smoke-test a single route. Asserts the structural contract every page on the
 * site is expected to satisfy — does not assert content. Intended as a
 * cross-route reusable check, not a per-route deep assertion.
 *
 * Contract enforced (per PRD `docs/prd/page-level-testing-rework.md` §Decisions item 4):
 *   - HTTP status matches `expectedStatus` (default 200)
 *   - `<h1>` rendered and visible
 *   - primary `<nav>` visible
 *   - `<footer>` visible
 *   - no broken images (`naturalWidth > 0` for all visible `<img>`s)
 *   - no `console.error` (modulo the default + caller-supplied ignore-list)
 */
export async function smokeTest(
  page: Page,
  options: SmokeOptions,
): Promise<void> {
  const { path, expectedStatus = 200 } = options;
  const ignoreConsoleErrors = [
    ...DEFAULT_IGNORE_CONSOLE_ERRORS,
    ...(options.ignoreConsoleErrors ?? []),
  ];

  // When the page itself is expected to return 4xx, the browser logs a
  // "Failed to load resource: the server responded with a status of <code>"
  // for the page request. That's redundant with the explicit status check
  // below, so suppress it for the expected status only — other sub-resource
  // errors at different statuses still surface.
  const expectedResourceErrorPattern =
    expectedStatus >= 400 && expectedStatus < 500
      ? new RegExp(`Failed to load resource:.*status of ${expectedStatus}`, "i")
      : null;

  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  // Named handlers so we can detach them after the run — keeps listeners
  // from accumulating if the same Page is ever reused (Playwright retries,
  // future helper re-use, etc.).
  const consoleHandler = (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (expectedResourceErrorPattern?.test(text)) return;
    if (ignoreConsoleErrors.some((m) => matches(text, m))) return;
    consoleErrors.push(text);
  };

  // The browser logs only "Failed to load resource: status of <code>" without
  // the URL. Capture failed-request URLs separately so the diff message tells
  // the engineer which sub-resource is the actual culprit.
  const requestFailedHandler = (req: Request) => {
    failedRequests.push(
      `${req.method()} ${req.url()} (${req.failure()?.errorText ?? "unknown"})`,
    );
  };
  const responseHandler = (response: Response) => {
    const status = response.status();
    if (status < 400) return;
    // Don't flag the main page navigation as a sub-resource failure when the
    // test deliberately expects a non-2xx status (e.g. the 404 route smoke).
    if (response.request().isNavigationRequest() && status === expectedStatus) {
      return;
    }
    failedRequests.push(
      `${response.request().method()} ${response.url()} → ${status}`,
    );
  };

  page.on("console", consoleHandler);
  page.on("requestfailed", requestFailedHandler);
  page.on("response", responseHandler);

  try {
    // #2977/#2985: goto used to default to waitUntil: "load", which blocks
    // on every subresource (fonts, images, background BFF reads) — on a
    // slow-TTFB route (e.g. /kalender's 19-call BFF fan-out) or a contended
    // CI runner, that wait was unbounded, sharing the same 30s test budget
    // as every assertion below, and was the direct cause of the navigation
    // timeouts this issue is about. `gotoBounded` (helpers/goto.ts) is the
    // shared fix: `domcontentloaded` goto + a bounded, best-effort wait for
    // "load" — see its own doc comment for why bounding the wait, not just
    // relocating it, is what actually fixes this.
    const response = await gotoBounded(page, path);
    expect(response, `goto(${path}) returned no response`).not.toBeNull();
    expect(response!.status(), `${path} status`).toBe(expectedStatus);

    // The bounded wait above runs BEFORE the structural assertions (same
    // relative order as the pre-fix code) so h1/nav/footer are checked
    // against a rendered, styled page rather than racing render-blocking
    // CSS at bare DOMContentLoaded.
    //
    // Trade-off: under a genuinely slow load, `gotoBounded` gives up after
    // its timeout and the broken-image check below runs against whatever
    // finished loading by then. That's a real, if narrow, coverage
    // reduction, not a silent pass — the check still fails on any image
    // that has already resolved broken; images still in flight are just
    // not yet checkable (`complete` is false for those, so the filter
    // below already skips them rather than reporting them as broken).

    await expect(page.locator("h1").first(), `${path} <h1>`).toBeVisible();
    await expect(page.locator("nav").first(), `${path} <nav>`).toBeVisible();
    await expect(
      page.locator("footer").first(),
      `${path} <footer>`,
    ).toBeVisible();

    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs
        .filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src);
    });
    expect(brokenImages, `${path} broken images`).toEqual([]);

    // Fold failed sub-resource URLs into the console-error diff so the message
    // includes the offending URL(s), not just "Failed to load resource: 4xx".
    const consoleErrorsWithContext =
      consoleErrors.length > 0 && failedRequests.length > 0
        ? [...consoleErrors, "", "Failed sub-resources:", ...failedRequests]
        : consoleErrors;
    expect(consoleErrorsWithContext, `${path} console.error`).toEqual([]);
  } finally {
    page.off("console", consoleHandler);
    page.off("requestfailed", requestFailedHandler);
    page.off("response", responseHandler);
  }
}

function matches(text: string, m: string | RegExp): boolean {
  return typeof m === "string" ? text.includes(m) : m.test(text);
}
