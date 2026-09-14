import { Effect } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import {
  PsdApi,
  MatchesArray,
  MatchDetail,
  PlayerSeasonStats,
  type Match,
  type PlayerSeasonStats as PlayerSeasonStatsType,
} from "@kcvv/api-contract";
import { PsdService } from "../psd/service";
import { isSettledMatchStatus } from "../psd/transforms";
import { shouldServeStale, type BffError } from "../psd/errors";
import { KvCacheService, TTL, TypedKvCache } from "../cache/kv-cache";
import { WorkerEnvTag } from "../env";
import { PsdGateService } from "../psd/gate";
import { withErrorMapping } from "./error-mapping";

const matchesCache = TypedKvCache(MatchesArray);
const matchDetailCache = TypedKvCache(MatchDetail);
const playerStatsCache = TypedKvCache(PlayerSeasonStats);

// #2491: `transformPsdGame`/`getMatchDetail` gained a `venue` field, and
// `apps/web/src/lib/utils/ical.ts` lost the local fallback that used to
// synthesise one — so a cached pre-#2491 entry under the OLD key would ship
// with no `LOCATION` line on a home fixture for up to its full TTL (24h for
// `matches:team`, 4h for `matches:next`/`matches:window`, up to 7d for
// `match:detail`/`opponent:team`) after this deploys. Every cache key these
// handlers write is versioned here so a stale pre-#2491 entry is never read
// as current — see the review that caught this on the first pass.
const CACHE_VERSION = "v2";

export const getMatchesByTeamHandler = (
  teamId: number,
): Effect.Effect<
  readonly Match[],
  BffError,
  PsdService | KvCacheService | WorkerEnvTag | PsdGateService
> => {
  const cacheKey = `matches:team:${CACHE_VERSION}:${teamId}`;
  const fetchMatches = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getTeamMatches(teamId);
  });

  return matchesCache.getOrFetch(
    cacheKey,
    fetchMatches,
    (matches) => teamMatchesTtl(matches),
    undefined,
    { shouldServeStale },
  );
};

export const getNextMatchesHandler = (): Effect.Effect<
  readonly Match[],
  BffError,
  PsdService | KvCacheService | WorkerEnvTag | PsdGateService
> => {
  const cacheKey = `matches:next:${CACHE_VERSION}`;
  const fetchMatches = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getNextMatches();
  });

  return matchesCache.getOrFetch(
    cacheKey,
    fetchMatches,
    (matches) => nextMatchesTtl(matches),
    undefined,
    {
      shouldServeStale,
      // Correctness guard: "next" is computed at fetch time, so a stale copy can
      // advertise a match that has already kicked off. Never serve that — refresh
      // blocking so the list recomputes to future-only.
      mustBlockOnStale: (matches) =>
        matches.some((m) => new Date(m.date).getTime() < Date.now()),
    },
  );
};

export const getMatchesWindowHandler = (): Effect.Effect<
  readonly Match[],
  BffError,
  PsdService | KvCacheService | WorkerEnvTag | PsdGateService
> => {
  const cacheKey = `matches:window:${CACHE_VERSION}`;
  const fetchMatches = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getMatchesWindow();
  });

  return matchesCache.getOrFetch(
    cacheKey,
    fetchMatches,
    TTL.MATCHES_WINDOW,
    undefined,
    { shouldServeStale },
  );
};

const HOUR_MS = 60 * 60 * 1000;

/**
 * Soft cache TTL (seconds) for a team's season match list.
 *
 * PSD keeps a played match at status "scheduled" (numeric 0, no goals) until
 * staff enter the score, so a list snapshot taken before full-time stays
 * score-less. Under the flat 24h TTL that pre-match snapshot pinned every list
 * consumer (kalender, homepage first-teams block, team agenda/fixtures) for up
 * to a day after kickoff — while the match-detail page, on its own
 * proximity-aware TTL, already showed the final score.
 *
 * Evaluated against the CACHED list on read: while any match is past kickoff
 * but still "scheduled" — result pending — refresh at matchday cadence (5 min)
 * so the score lands minutes after PSD publishes it. The 48h grace window
 * bounds the churn for matches that never settle (e.g. silently dropped
 * fixtures). Statuses that already changed (postponed/cancelled/stopped) need
 * no faster refresh — the list is correct for them.
 */
export function teamMatchesTtl(
  matches: readonly Match[],
  now: number = Date.now(),
): number {
  const resultPending = matches.some((m) => {
    const kickoff = new Date(m.date).getTime();
    return (
      m.status === "scheduled" && now > kickoff && now - kickoff < 48 * HOUR_MS
    );
  });
  return resultPending ? TTL.MATCH_DETAIL_MATCHDAY : TTL.MATCHES_TEAM;
}

/**
 * Soft cache TTL (seconds) for the club-wide next-matches list.
 *
 * getNextMatches computes "next" per team AT FETCH TIME (kickoff >= now), so
 * once a cached entry's kickoff passes, the list advertises a match that
 * already started — the homepage agenda and MatchStrip kept it for up to the
 * flat 4h window. Cap at matchday cadence while any listed kickoff is in the
 * past; the refetch recomputes the list to future-only, so the condition
 * clears itself after one refresh (no grace window needed).
 */
export function nextMatchesTtl(
  matches: readonly Match[],
  now: number = Date.now(),
): number {
  const started = matches.some((m) => new Date(m.date).getTime() < now);
  return started ? TTL.MATCH_DETAIL_MATCHDAY : TTL.NEXT_MATCHES;
}

/** True when the detail already carries report data (a non-empty lineup or events). */
export function hasMatchReportData(detail: MatchDetail): boolean {
  const lineup = detail.lineup;
  const hasLineup =
    lineup !== undefined && (lineup.home.length > 0 || lineup.away.length > 0);
  const hasEvents = detail.events !== undefined && detail.events.length > 0;
  return hasLineup || hasEvents;
}

/** Base TTL tier from kickoff proximity (before the report-pending override). */
function proximityTtl(kickoff: number, finished: boolean, now: number): number {
  if (finished && now - kickoff >= 48 * HOUR_MS) return TTL.MATCH_DETAIL_PAST;

  const distanceMs = Math.abs(kickoff - now);
  if (distanceMs < 3 * HOUR_MS) return TTL.MATCH_DETAIL_LIVE;
  if (distanceMs < 24 * HOUR_MS) return TTL.MATCH_DETAIL_MATCHDAY;
  if (distanceMs < 7 * 24 * HOUR_MS) return TTL.MATCH_DETAIL_WEEK;
  return TTL.MATCH_DETAIL_DEFAULT;
}

/** Report state of a match detail, feeding the report-pending TTL override. */
interface MatchReportState {
  /** True when the detail already carries a non-empty lineup or events. */
  hasReportData: boolean;
  /** PSD's own `viewGameReport` flag — a report exists upstream. */
  hasReport: boolean;
}

/**
 * Soft cache TTL (seconds) for a match-detail response, derived from kickoff
 * proximity. The rate-limited PSD hop is then refreshed often only when it
 * matters (live / matchday) and rarely for distant or settled matches.
 *
 *   finished ≥48h ago (with report) → 7d   (immutable)
 *   |kickoff − now| < 3h → 60s   (live)
 *                   < 24h → 300s  (matchday)
 *                   < 7d  → 3600s (this week)
 *   else              → 24h  (distant)
 *
 * Report-pending override: PSD publishes the match report (lineups / events) a
 * few hours after full-time, so a past match whose `/info` payload is still
 * preview-shaped (no report data) is a stale snapshot, not settled data. While
 * a report is still expected — PSD's own `hasReport` flag is set (it exists
 * upstream, our snapshot just missed it) or we are within 48h of kickoff (grace
 * window for it to appear) — cap the TTL at a matchday cadence so the report
 * self-heals within minutes instead of being pinned behind the 7d / weekly TTL.
 *
 * `report` defaults to "settled with report" so a caller that only cares about
 * proximity gets the base ladder.
 */
export function matchDetailTtl(
  date: Date,
  status: string,
  report: MatchReportState = { hasReportData: true, hasReport: false },
  now: number = Date.now(),
): number {
  const kickoff = new Date(date).getTime();
  const natural = proximityTtl(kickoff, isSettledMatchStatus(status), now);

  const reportPending =
    now > kickoff &&
    !report.hasReportData &&
    (report.hasReport || now - kickoff < 48 * HOUR_MS);

  return reportPending ? Math.min(natural, TTL.MATCH_DETAIL_MATCHDAY) : natural;
}

export const getMatchDetailHandler = (
  matchId: number,
): Effect.Effect<
  MatchDetail,
  BffError,
  PsdService | KvCacheService | WorkerEnvTag | PsdGateService
> => {
  const cacheKey = `match:detail:${CACHE_VERSION}:${matchId}`;
  const fetchDetail = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getMatchDetail(matchId);
  });

  return matchDetailCache.getOrFetch(
    cacheKey,
    fetchDetail,
    (detail) =>
      matchDetailTtl(detail.date, detail.status, {
        hasReportData: hasMatchReportData(detail),
        hasReport: detail.hasReport,
      }),
    undefined,
    { shouldServeStale },
  );
};

export const getPlayerStatsHandler = (
  memberId: number,
): Effect.Effect<
  PlayerSeasonStatsType,
  BffError,
  PsdService | KvCacheService | WorkerEnvTag | PsdGateService
> =>
  Effect.gen(function* () {
    const service = yield* PsdService;
    const seasonId = yield* service.getCurrentSeasonId();

    const fetchStats = service.getPlayerStats(memberId);

    const cacheKey = `stats:player:${memberId}:${seasonId}`;
    return yield* playerStatsCache.getOrFetch(
      cacheKey,
      fetchStats,
      TTL.PLAYER_STATS,
      undefined,
      {
        shouldServeStale,
      },
    );
  });

export const MatchesApiLive = HttpApiBuilder.group(
  PsdApi,
  "matches",
  (handlers) =>
    handlers
      .handle("getMatchesByTeam", ({ path: { teamId } }) =>
        withErrorMapping(getMatchesByTeamHandler(teamId)),
      )
      .handle("getNextMatches", () => withErrorMapping(getNextMatchesHandler()))
      .handle("getMatchesWindow", () =>
        withErrorMapping(getMatchesWindowHandler()),
      )
      .handle("getMatchDetail", ({ path: { matchId } }) =>
        withErrorMapping(getMatchDetailHandler(matchId)),
      )
      .handle("getPlayerStats", ({ path: { memberId } }) =>
        withErrorMapping(getPlayerStatsHandler(memberId)),
      ),
);
