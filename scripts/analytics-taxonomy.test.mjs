/**
 * Pure-logic self-check for the analytics taxonomy (issue #1974). No creds,
 * no network — guards the invariants the GTM/GA4 sync scripts rely on.
 *
 *   node --test scripts/analytics-taxonomy.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { prefixes, params, buildTriggerRegex } from "./analytics-taxonomy.mjs";

/**
 * The canonical GTM Custom-Event trigger RegEx. Must stay byte-identical to the
 * live trigger and to `apps/web/CLAUDE.md`. If you change `prefixes`, update
 * this string in the same commit (that is the point of the assertion).
 */
const CANONICAL_TRIGGER_REGEX =
  "responsibility_|search_|organigram_|related_content_|related_article_|" +
  "article_|event_|player_|match_|team_|clubshop_banner_|kalender_|sponsor_|" +
  "jeugd_|hub_|board_|geschiedenis_|ultras_|membership_|error_|gallery_";

test("buildTriggerRegex() equals the canonical string", () => {
  assert.equal(buildTriggerRegex(), CANONICAL_TRIGGER_REGEX);
});

test("every prefix is non-empty, lowercase, and ends with '_'", () => {
  for (const p of prefixes) {
    assert.match(p, /^[a-z_]+_$/, `bad prefix: ${JSON.stringify(p)}`);
  }
});

test("prefixes have no duplicates", () => {
  assert.equal(new Set(prefixes).size, prefixes.length);
});

test("params have no duplicate parameterName", () => {
  const names = params.map((p) => p.parameterName);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  assert.deepEqual(dupes, [], `duplicate param keys: ${dupes.join(", ")}`);
});

test("every param has a parameterName and displayName", () => {
  for (const p of params) {
    assert.ok(p.parameterName && p.displayName, `incomplete param: ${JSON.stringify(p)}`);
  }
});
