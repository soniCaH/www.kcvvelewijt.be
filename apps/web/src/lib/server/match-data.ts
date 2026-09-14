import { cache } from "react";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { BffService } from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { transformMatchToSchedule } from "@/components/match/transform";
import {
  pickLastResult,
  pickNextFixture,
  selectSeniorTeams,
  type SeniorTeamCandidate,
} from "@/components/home/FirstTeamsBlock/first-teams";
import type { Match } from "@kcvv/api-contract";
import type { ScheduleRow } from "@/components/match/types";

/**
 * How long a played match stays newsworthy enough to headline the strip.
 * Past this, the strip drops back to fixture-only.
 *
 * Sized against the fixture calendar, not against a news cycle. The original
 * 72 h (#2387) expired on the Tuesday evening after a Saturday kickoff, so the
 * strip ran fixture-only for most of every week, and one bye weekend blanked
 * the result slot entirely. Fifteen days clears a skipped weekend with room to
 * spare, while a genuinely dormant strip — winter break, end of season — still
 * falls back to the fixture alone rather than headlining a stale scoreline.
 *
 * Only the past arm of this window is load-bearing. The check is symmetric
 * (`Math.abs`, #2423) so that a forfeit awarded before kickoff can reach the
 * slot, but how far ahead one may be dated is `pickLastResult`'s own, tighter
 * `SETTLED_LOOKAHEAD_MS` — widening here admits no future match it would not.
 */
export const RESULT_RECENCY_MS = 15 * 24 * 60 * 60 * 1000;

export interface MatchStripData {
  /**
   * Most recent played match, only when inside `RESULT_RECENCY_MS`. Never a
   * pitch-reservation placeholder or a reduced tournament fixture with no
   * scoreline yet: a booking carries no score, and neither does an
   * unconfirmed tournament opponent, so `matchSlot`'s shared
   * `isReducedMatchRow` guard never routes either to the result slot and
   * `pickLastResult` cannot return one (#2688/#2802). Guarded there, not
   * re-checked here — one owner for the rule.
   */
  result: ScheduleRow | null;
  /**
   * Next scheduled fixture. Can be a placeholder — `<MatchStripView>` branches
   * on `.kind` to render the reduced treatment.
   */
  fixture: ScheduleRow | null;
}

/**
 * The A side drives the strip: the first senior team by slug, so
 * `eerste-elftallen-a` precedes `-b`. Shares `selectSeniorTeams` with the
 * homepage's `<FirstTeamsBlock>` wiring so the two cannot drift.
 */
export function pickFirstTeamPsdId(
  teams: readonly SeniorTeamCandidate[],
): number | null {
  const first = selectSeniorTeams(teams)[0];
  return first?.psdId ? Number(first.psdId) : null;
}

/**
 * A team's full season feed, deduplicated per render.
 *
 * The homepage and the `<MatchStrip>` in its layout both want the A side's
 * feed, and nothing else collapses that into one read: Next's `fetch`
 * memoization opts out whenever the caller passes an `AbortSignal`, which
 * `@effect/platform`'s HTTP client always does — so 100% of BFF traffic
 * bypasses it and the dedupe has to be explicit (#2441).
 *
 * This is per-render memoization only. It is not a TTL, and no `unstable_cache`
 * belongs in front of it — see the note on `BffServiceLive` (#2389). For the
 * same reason this helper must stay out of `api/calendar.ics/route.ts`, whose
 * reads *are* wrapped in `unstable_cache`.
 *
 * Reach for it on any surface that can co-render `<MatchStripSlot />` — the
 * (landing) layout mounts it, as do `/ploegen/[slug]`, `/wedstrijd/[matchId]`
 * and `/spelers/[slug]`. Elsewhere (`/kalender`, `/scheurkalender`,
 * `sitemap.ts`) call `bff.getMatches` inside your own `Effect.all`: there is no
 * second reader to dedupe against, and those sites need the tagged error
 * channel this helper flattens away.
 *
 * Rejects on a BFF failure; each call site owns its own fallback, because they
 * disagree about what "no matches" should mean.
 */
export const getTeamMatches = cache(async function getTeamMatches(
  psdId: number,
): Promise<readonly Match[]> {
  return runPromise(
    Effect.gen(function* () {
      const bff = yield* BffService;
      return yield* bff.getMatches(psdId);
    }),
  );
});

/**
 * Fetch the first team's last result and next fixture for `<MatchStrip>`.
 *
 * Reads the A side's full season feed rather than the club-wide
 * `getNextMatches()` — that endpoint only ever returns upcoming matches, so
 * the strip was structurally incapable of showing a score (#2387). The
 * result/fixture split reuses `pickLastResult` / `pickNextFixture` from
 * `first-teams.ts`, so the strip and `<FirstTeamsBlock>` cannot disagree about
 * which match is "the last one".
 *
 * Returns `null` when neither side is available or any call fails: the strip
 * is chrome on landing pages, and a dead upstream must not take the page with
 * it. The homepage surfaces the outage separately, in the match sections that
 * own that story.
 *
 * Wrapped in React `cache()` for request-level deduplication — multiple Server
 * Components calling this in the same render share a single fetch.
 */
export const getFirstTeamStripData = cache(
  async function getFirstTeamStripData(): Promise<MatchStripData | null> {
    try {
      const teams = await runPromise(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAll();
        }),
      );

      const psdId = pickFirstTeamPsdId(teams);
      if (psdId === null) return null;

      const matches = await getTeamMatches(psdId);

      const now = new Date();
      const lastResult = pickLastResult(matches, now);
      const nextFixture = pickNextFixture(matches, now);

      // Symmetric on purpose: `pickLastResult` can return a match dated ahead
      // of now (a forfeit awarded before kickoff), and a one-sided
      // `now - date <= WINDOW` is trivially true for any future date — the
      // window could never expire one (#2423).
      const isRecent =
        lastResult !== undefined &&
        Math.abs(now.getTime() - lastResult.date.getTime()) <=
          RESULT_RECENCY_MS;

      const result = isRecent ? transformMatchToSchedule(lastResult) : null;
      const fixture = nextFixture
        ? transformMatchToSchedule(nextFixture)
        : null;

      if (!result && !fixture) return null;
      return { result, fixture };
    } catch {
      return null;
    }
  },
);
