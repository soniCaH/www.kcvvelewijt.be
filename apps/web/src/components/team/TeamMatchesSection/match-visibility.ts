import type { ScheduleRow } from "@/components/match/types";
import { toMatchDisplayZone } from "@/lib/utils/dates";

/**
 * Pure match-selection logic behind `<TeamMatchesSection>`, split out of that
 * `"use client"` component so `page.tsx` (a server component) can import the
 * SAME predicate that decides what the section renders, rather than
 * re-deriving a second version of it (#2636 finding 2). Also the shared home
 * for `findNextMatch`, previously duplicated verbatim in
 * `/ploegen/[slug]/wedstrijden/page.tsx` (#2636 finding 11).
 *
 * Before this split, `#wedstrijden`'s seam, `<section>` and sticky-nav entry
 * were driven by the page's own `inCompetition` flag alone, while
 * `<TeamMatchesSection>` could still self-hide beneath them (every league
 * fixture postponed/cancelled/forfeited/stopped, or stuck at `"scheduled"`
 * in the past) — an empty section behind a live nav chip, which is exactly
 * the render/nav drift the AC requires staying in sync.
 */

const RECENT_COUNT = 3;

/**
 * Real kickoff instant. A BFF match date is Brussels wall-clock in UTC fields,
 * so its raw `getTime()` runs 1-2 h late against `now` (#3491).
 */
const kickoffMs = (m: ScheduleRow): number =>
  toMatchDisplayZone(m.date).toMillis();

export function findNextMatch(
  matches: readonly ScheduleRow[],
  now: Date,
): ScheduleRow | undefined {
  return matches
    .filter((m) => m.status === "scheduled" && kickoffMs(m) >= now.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}

export function recentResults(
  matches: readonly ScheduleRow[],
  excludeId: number | undefined,
  now: Date,
): ScheduleRow[] {
  return matches
    .filter(
      (m) =>
        m.status === "finished" &&
        kickoffMs(m) < now.getTime() &&
        m.id !== excludeId,
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, RECENT_COUNT);
}

/**
 * Whether `<TeamMatchesSection>` would render anything for this match list —
 * a featured next fixture, a recent result, or both. `now` defaults to the
 * current time for callers that have no reason to pin one.
 *
 * `/ploegen/[slug]/page.tsx` is not one of those callers, and MUST pass its
 * own `now` through to both this call and `<TeamMatchesSection now={now}>`
 * (review round 3, PR #2774). The two are not "a few milliseconds apart":
 * the page is ISR-cached for up to 15 minutes with the nav chip and the seam
 * baked into that cached HTML, while `<TeamMatchesSection>` is a
 * `"use client"` component that re-derives its own guard on hydration, with
 * a clock read that can be up to the whole cache window later. A team with
 * one scheduled fixture and no finished-and-past ones flips
 * `hasVisibleMatches` from true to false the moment that fixture's kickoff
 * passes (PSD leaves the status at `"scheduled"` until it syncs the result) —
 * a page cached minutes earlier ships `showWedstrijden: true`, and the
 * client then renders `null` under a seam and a nav chip that already
 * committed to showing it. One instant, threaded through both call sites,
 * closes that; two independent `new Date()` reads do not.
 *
 * A single allocation-free `some()`, not a call through `findNextMatch` +
 * `recentResults` — those sort and slice to pick a *specific* next match and
 * up to three *specific* recent results, work this existence check does not
 * need. `<TeamMatchesSection>` itself does not call this function either: its
 * own guard is `!next && recent.length === 0` on the `next`/`recent` it
 * already derived for rendering — which is exactly this predicate's
 * definition, so the two can never disagree without also duplicating the
 * derivation, at zero extra cost, PROVIDED both sides read the same `now`.
 */
export function hasVisibleMatches(
  matches: readonly ScheduleRow[],
  now: Date = new Date(),
): boolean {
  return matches.some(
    (m) =>
      (m.status === "scheduled" && kickoffMs(m) >= now.getTime()) ||
      (m.status === "finished" && kickoffMs(m) < now.getTime()),
  );
}
