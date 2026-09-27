import { expect, type Locator } from "@playwright/test";

/**
 * Waits until React has attached its event listeners to `locator`'s
 * element — call this before the first click on a prerendered,
 * `"use client"` interactive control.
 *
 * #3196 (flake ledger class N): a plain `onClick` on a server-rendered
 * client component is `visible` and `stable` the instant the server HTML
 * paints — Playwright's own actionability checks (and `locator.count()` /
 * `toBeVisible()`) are satisfied by the static markup alone. Nothing
 * responds to a click until React's hydration commit attaches the
 * listener, and a click that lands first is silently dropped: no
 * re-render, no error, no retry. Whatever the test does next then waits
 * its full timeout for something that will now never appear — the same
 * shape every time, not a variable-duration race.
 *
 * Signal: React sets an own property key starting with `__reactProps` on a
 * DOM node once that node has hydrated (or, on a client-only render,
 * mounted) — the key carries a per-render instance id
 * (`__reactProps$<id>`), so this matches the prefix rather than the full
 * key. Polled with `expect.poll` at its own default timeout — this helper
 * never raises a timeout; a genuinely broken hydration still fails the
 * test at the suite's normal budget.
 */
export async function waitForHydrated(locator: Locator): Promise<void> {
  await locator.waitFor();
  await expect
    .poll(() =>
      locator.evaluate((el) =>
        Object.keys(el).some((key) => key.startsWith("__reactProps")),
      ),
    )
    .toBe(true);
}
