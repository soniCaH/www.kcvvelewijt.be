import type { Page, Response } from "@playwright/test";

/** Bounded-wait timeout for the best-effort `load` wait, in ms. */
const DEFAULT_LOAD_TIMEOUT_MS = 10_000;

/**
 * Navigate to `path` without risking the suite's shared per-test timeout on
 * a slow-TTFB route or a contended CI runner.
 *
 * #2977: `page.goto()` defaults to `waitUntil: "load"`, which blocks on
 * every subresource (fonts, images, background BFF reads). On a slow-TTFB
 * route (e.g. `/kalender`'s 19-call BFF fan-out) — or simply a contended CI
 * runner, which #2977's own investigation also caught `/hulp` and
 * `/wedstrijd/[matchId]` under despite neither being fan-out-heavy — that
 * wait was unbounded and shared the same 30s test budget as every assertion
 * that ran after it. That was the direct cause of the navigation timeouts
 * both #2977 and this issue (#2985) exist to fix.
 *
 * Switching `goto` alone to `domcontentloaded` does NOT fix that on its
 * own: an unbounded `waitForLoadState("load")` called right after still
 * waits for the exact same event under the exact same budget — the timeout
 * just moves to a different stack frame. The actual fix is BOUNDING that
 * wait, not just relocating it — this helper does both together so no call
 * site can apply one without the other.
 *
 * Trade-off: under a genuinely slow load, this gives up after `timeout`ms
 * and the caller's assertions run against whatever finished loading by
 * then. That is a real, if narrow, coverage reduction, not a silent pass —
 * assertions still fail against a page that is really broken; they are
 * just not guaranteed to see every last subresource first.
 */
export async function gotoBounded(
  page: Page,
  path: string,
  options: { timeout?: number } = {},
): Promise<Response | null> {
  const { timeout = DEFAULT_LOAD_TIMEOUT_MS } = options;

  const gotoStarted = Date.now();
  let response: Response | null = null;
  try {
    response = await page.goto(path, { waitUntil: "domcontentloaded" });
  } finally {
    // Logged directly rather than as a TestInfo annotation: this suite's
    // configured CI reporters (`github` + `list`) don't render
    // TestInfo.annotations, so an annotation here would be silently inert.
    console.log(`[goto] ${path} → ${Date.now() - gotoStarted}ms`);
  }

  // Bounded, best-effort wait for the load event, so a slow subresource can
  // no longer consume the rest of the shared test budget the way the
  // unbounded wait used to — this cap, not the `domcontentloaded` goto by
  // itself, is what actually bounds the flake.
  await page.waitForLoadState("load", { timeout }).catch(() => {});

  return response;
}
