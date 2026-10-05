/**
 * Pure-logic self-check for the analytics taxonomy (issue #1974, wired into
 * vitest at #2691 review — the previous `scripts/analytics-taxonomy.test.mjs`
 * asserted the same invariants but nothing ever ran it: `scripts/` is not a
 * pnpm workspace, root `test` is `turbo test`, and no `.github/workflows/*.yml`
 * invokes `node --test`, so it had been silently red since #2503 added
 * `banner_`/`nav_`/`footer_` and stayed red through #2622's `inhoud_`.
 */
import { describe, it, expect } from "vitest";
import {
  prefixes,
  params,
  buildTriggerRegex,
} from "../../../../scripts/analytics-taxonomy.mjs";

/**
 * The canonical GTM Custom-Event trigger RegEx. Must stay byte-identical to
 * the live trigger and to `docs/prd/analytics.md` §3. If you change
 * `prefixes`, update this string in the same commit (that is the point of
 * this assertion).
 */
const CANONICAL_TRIGGER_REGEX =
  "responsibility_|search_|organigram_|related_content_|related_article_|" +
  "article_|event_|player_|match_|team_|clubshop_banner_|kalender_|sponsor_|" +
  "banner_|nav_|footer_|jeugd_|hub_|board_|geschiedenis_|ultras_|membership_|" +
  "error_|gallery_|empty_state_|inhoud_|identity_band_";

describe("analytics-taxonomy", () => {
  it("buildTriggerRegex() equals the canonical string", () => {
    expect(buildTriggerRegex()).toBe(CANONICAL_TRIGGER_REGEX);
  });

  it("every prefix is non-empty, lowercase, and ends with '_'", () => {
    for (const p of prefixes) {
      expect(p, `bad prefix: ${JSON.stringify(p)}`).toMatch(/^[a-z_]+_$/);
    }
  });

  it("prefixes have no duplicates", () => {
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it("params have no duplicate parameterName", () => {
    const names = params.map((p) => p.parameterName);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes, `duplicate param keys: ${dupes.join(", ")}`).toEqual([]);
  });

  it("every param has a parameterName and displayName", () => {
    for (const p of params) {
      expect(
        p.parameterName && p.displayName,
        `incomplete param: ${JSON.stringify(p)}`,
      ).toBeTruthy();
    }
  });
});
