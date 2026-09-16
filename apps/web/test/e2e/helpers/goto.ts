import { test, type Page, type Response } from "@playwright/test";

/** Bounded wait for the `load` event, in ms. */
const LOAD_TIMEOUT_MS = 10_000;

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
 * Trade-off: under a genuinely slow load, this gives up after
 * `LOAD_TIMEOUT_MS` and the caller's assertions run against whatever
 * finished loading by then. That is a real, if narrow, coverage reduction,
 * not a silent pass — assertions still fail against a page that is really
 * broken; they are just not guaranteed to see every last subresource first.
 * No caller needs a different bound today, so the timeout isn't a
 * parameter — a `{ timeout: 0 }` call would mean Playwright's "wait
 * forever", silently reinstating the exact unbounded wait this helper
 * exists to remove. Add a parameter only once a real caller needs one.
 */
export async function gotoBounded(
  page: Page,
  path: string,
): Promise<Response | null> {
  // `test.info()` reads the currently-running test's info from Playwright's
  // own async-local context — safe to call here because `gotoBounded` only
  // ever runs inside a test body.
  const testTitle = test.info().title;

  const gotoStarted = Date.now();
  // Logged directly (not as a `TestInfo` annotation) for immediate
  // visibility in the raw CI log as the run happens: the `list` and
  // `github` reporters print console output live, while an annotation only
  // surfaces later — in the `html` report artifact, the only one of the
  // suite's four configured reporters (`github`, `list`, `html`,
  // `../../reporters/github-summary.ts`) that renders arbitrary
  // annotations at all. `github-summary`'s own annotation read is scoped to
  // `type: "skip"` (see its `onEnd`), so a goto-timing annotation would not
  // reach the job summary either.
  //
  // Attributed with the test's own title: `fullyParallel: true` with
  // `workers: 2` interleaves every test's log lines, so an unattributed
  // `[goto] <path> → <ms>` line can't be traced back to which test produced
  // a slow (or timed-out) number.
  const response = await page
    .goto(path, { waitUntil: "domcontentloaded" })
    .finally(() => {
      console.log(
        `[goto] "${testTitle}" ${path} → ${Date.now() - gotoStarted}ms`,
      );
    });

  // Bounded, best-effort wait for the load event, so a slow subresource can
  // no longer consume the rest of the shared test budget the way the
  // unbounded wait used to — this cap, not the `domcontentloaded` goto by
  // itself, is what actually bounds the flake.
  //
  // The `catch` logs too: before this helper existed, a route whose `load`
  // never fired failed loudly with a navigation timeout naming the route.
  // Silently swallowing the timeout here would trade that for a *worse*
  // failure mode — the caller's assertions would fail 10s later against a
  // still-loading page, complaining about broken images or console errors
  // with no hint that the load wait ever expired. Logging here is what
  // keeps that diagnosis intact.
  await page
    .waitForLoadState("load", { timeout: LOAD_TIMEOUT_MS })
    .catch(() => {
      console.log(
        `[goto] "${testTitle}" ${path} → load wait exceeded its ${LOAD_TIMEOUT_MS}ms bound, proceeding without it`,
      );
    });

  return response;
}
