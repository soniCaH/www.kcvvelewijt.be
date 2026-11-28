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
import { PsdService, isPartialFanout } from "../psd/service";
import { isSettledMatchStatus } from "../psd/transforms";
import { kickoffMs, startOfBrusselsDayMs } from "../psd/wall-clock";
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
// `matches:team`, up to 12h for `matches:next` and `matches:window` (15 min / 4h / 12h tiers), up to 7d for
// `match:detail`/`opponent:team`) after this deploys. Every cache key these
// handlers write is versioned here so a stale pre-#2491 entry is never read
// as current — see the review that caught this on the first pass.
//
// v3 (#3428): U6–U13 matches lost their score. A v2 entry still carries it, and
// on staging (`CACHE_LONG_TTL`) a v2 key lives 365 days, so a hidden youth
// score would keep serving after deploy.
//
// v4 (#3428 review): match detail fails closed while the match-team index is
// unknown. A v3 detail written during an index failure could carry a youth
// score (staging only; production never saw v3).
//
// v5 (#3705): `matches:team` and `match:detail` gained `kcvv_team_label`. A v4
// entry has none, so the calendar feed and the match page would keep showing
// no team for up to 7 days after deploy.
//
// One constant for every match-shaped cache key, `opponent.ts` included, so a
// shape change can never bump one and forget the other.
export const CACHE_VERSION = "v5";

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

  return matchesCache
    .getOrFetch(
      cacheKey,
      fetchMatches,
      (matches) => nextMatchesTtl(matches),
      undefined,
      { shouldServeStale, isPartial: isPartialFanout },
    )
    .pipe(
      // Serve-time filter (#3467): "next" is computed at fetch time, so a
      // cached copy can list a match that has since kicked off. Drop it on
      // every serve rather than blocking on a refresh. The stored value stays
      // unfiltered, so `nextMatchesTtl` still sees the started match and
      // refreshes at matchday cadence. Same comparison as `getNextMatches` in
      // `psd/service.ts` (`psdGameToMs(m) >= now`), both on the real kickoff
      // instant (#3491).
      Effect.map((matches) =>
        matches.filter((m) => kickoffMs(m.date) >= Date.now()),
      ),
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

  return matchesCache
    .getOrFetch(cacheKey, fetchMatches, matchesWindowTtl, undefined, {
      shouldServeStale,
      isPartial: isPartialFanout,
    })
    .pipe(
      // Serve-time filter (#3629): the window's lower bound (start of the
      // Brussels day) is fixed at fetch time, and the 12 h tier lets a list
      // outlive its day: yesterday's matches would keep showing. Drop them on
      // every serve (fresh, stale or just fetched). The stored value stays
      // unfiltered, so `matchesWindowTtl` still sees it.
      Effect.map((matches) => {
        const startOfToday = startOfBrusselsDayMs(Date.now());
        return matches.filter((m) => kickoffMs(m.date) >= startOfToday);
      }),
    );
};

/**
 * Every coming match of every visible team, to the end of the season (#3920):
 * the Studio's Matchbal picker. A flat 24 h tier: the picker stores only the
 * id, so a match added or moved today may show up a day late here, and up to
 * two days late in the Studio (the web route's CDN keeps its own day).
 */
export const getUpcomingMatchesHandler = (): Effect.Effect<
  readonly Match[],
  BffError,
  PsdService | KvCacheService | WorkerEnvTag | PsdGateService
> => {
  const cacheKey = `matches:upcoming:${CACHE_VERSION}`;
  const fetchMatches = Effect.gen(function* () {
    const service = yield* PsdService;
    return yield* service.getUpcomingMatches();
  });

  return matchesCache
    .getOrFetch(cacheKey, fetchMatches, TTL.UPCOMING_MATCHES, undefined, {
      shouldServeStale,
      isPartial: isPartialFanout,
    })
    .pipe(
      // Same serve-time filter as `getMatchesWindowHandler` (#3629): a list
      // fetched yesterday still holds yesterday's matches.
      Effect.map((matches) => {
        const startOfToday = startOfBrusselsDayMs(Date.now());
        return matches.filter((m) => kickoffMs(m.date) >= startOfToday);
      }),
    );
};

const HOUR_MS = 60 * 60 * 1000;

/**
 * A match is "in play" from kickoff until kickoff + 2 h (#3669): 90 min,
 * half-time and stoppage, rounded up. PSD has no live scores, so a refetch in
 * that window returns the same score-less "scheduled" match. An entry fetched
 * at or after kickoff is therefore not refreshed before kickoff + 2 h; one
 * already stale at kickoff may refresh once. Every "past kickoff, still
 * scheduled" rule starts at the end of this window.
 */
export const IN_PLAY_MS = 2 * HOUR_MS;

/** True from kickoff + 2 h on: the in-play window is over (`IN_PLAY_MS`). */
export const isPastInPlay = (kickoff: number, now: number): boolean =>
  now - kickoff >= IN_PLAY_MS;

/**
 * A "scheduled" match from kickoff + 2 h (`IN_PLAY_MS`) up to kickoff + 48 h:
 * its result is still pending.
 */
const isResultPending = (m: Match, now: number): boolean => {
  if (m.status !== "scheduled" || !hasValidKickoff(m)) return false;
  const kickoff = kickoffMs(m.date);
  return isPastInPlay(kickoff, now) && now - kickoff < 48 * HOUR_MS;
};

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
 * Evaluated against the CACHED list on read: while any match is past
 * kickoff + 2 h but still "scheduled" — result pending — refresh at matchday
 * cadence (15 min) so the score lands minutes after PSD publishes it. While the
 * match is in play (kickoff to kickoff + 2 h, `IN_PLAY_MS`) there is nothing
 * to fetch, so the daily tier holds. The 48h grace window bounds the churn for
 * matches that never settle (e.g. silently dropped fixtures). Statuses that
 * already changed (postponed/cancelled/stopped) need no faster refresh — the
 * list is correct for them.
 */
export const teamMatchesTtl = (
  matches: readonly Match[],
  now: number = Date.now(),
): number => {
  const resultPending = matches.some((m) => isResultPending(m, now));
  return resultPending ? TTL.MATCH_DETAIL_MATCHDAY : TTL.MATCHES_TEAM;
};

/**
 * Soft cache TTL (seconds) for the club-wide next-matches list (#3628).
 *
 * getNextMatches computes "next" per team AT FETCH TIME (kickoff >= now), so
 * once a cached entry's kickoff passes, the list advertises a match that
 * already started. Three tiers, all ≥15 min (#2321):
 *   any listed kickoff in the past → 15 min (matchday cadence; the refetch
 *                                     recomputes to future-only, so this
 *                                     clears itself after one refresh)
 *   nearest kickoff < 24 h away    → 4 h
 *   otherwise                      → 12 h (quiet: nothing changes sooner)
 *
 * An empty list (or one with no parseable kickoff) has no nearest kickoff: it
 * takes the 4 h tier, as before #3628. PSD returns nothing before it publishes
 * fixtures (season rollover) or briefly on a hiccup, and a 12 h tier would keep
 * the homepage agenda empty for up to 12 h after fixtures appear.
 *
 * Trade-off: in the 12 h tier a fixture added sooner than the cached nearest
 * kickoff (a new cup match, a match moved earlier) stays hidden until the next
 * refresh, up to 12 h.
 */
export const nextMatchesTtl = (
  matches: readonly Match[],
  now: number = Date.now(),
): number => {
  const kickoffs = validKickoffs(matches);
  if (kickoffs.some((k) => k < now)) return TTL.MATCH_DETAIL_MATCHDAY;
  return proximityListTtl(kickoffs, now);
};

/**
 * Soft cache TTL (seconds) for the matches-window list (#3629): the same
 * ladder as `nextMatchesTtl`, with the pending test of `teamMatchesTtl`.
 *
 * The window also holds finished matches earlier today, so a past kickoff does
 * NOT mean "refresh fast": only a kickoff 2 h or more past (`IN_PLAY_MS`), still
 * `scheduled` inside the 48 h grace window (`isResultPending`), does → 15 min. Otherwise the nearest FUTURE
 * kickoff picks 4 h (< 24 h away) or 12 h; past kickoffs are ignored. A list
 * with no future kickoff (empty, or only finished matches) takes 4 h, as before.
 */
export const matchesWindowTtl = (
  matches: readonly Match[],
  now: number = Date.now(),
): number => {
  const valid = matches.filter(hasValidKickoff);
  if (valid.some((m) => isResultPending(m, now))) {
    return TTL.MATCH_DETAIL_MATCHDAY;
  }
  return proximityListTtl(
    valid.map((m) => kickoffMs(m.date)).filter((k) => k >= now),
    now,
  );
};

// `kickoffMs` throws a RangeError on an invalid date, so drop those first.
export const hasValidKickoff = (m: Pick<Match, "date">): boolean =>
  Number.isFinite(new Date(m.date).getTime());

const validKickoffs = (matches: readonly Match[]): number[] =>
  matches.filter(hasValidKickoff).map((m) => kickoffMs(m.date));

/** 4 h when the nearest of `kickoffs` is < 24 h away or there is none, else 12 h. */
const proximityListTtl = (kickoffs: readonly number[], now: number): number =>
  kickoffs.length > 0 && Math.min(...kickoffs) - now >= 24 * HOUR_MS
    ? TTL.NEXT_MATCHES_QUIET
    : TTL.NEXT_MATCHES;

/** True when the detail already carries report data (a non-empty lineup or events). */
const hasMatchReportData = (detail: MatchDetail): boolean => {
  const lineup = detail.lineup;
  const hasLineup =
    lineup !== undefined && (lineup.home.length > 0 || lineup.away.length > 0);
  const hasEvents = detail.events !== undefined && detail.events.length > 0;
  return hasLineup || hasEvents;
};

/** Base TTL tier from kickoff proximity (before the report-pending override). */
const proximityTtl = (
  kickoff: number,
  finished: boolean,
  now: number,
): number => {
  if (finished && now - kickoff >= 48 * HOUR_MS) return TTL.MATCH_DETAIL_PAST;

  // In play (#3669): a refetch shows nothing new. The extra 15 min covers an
  // entry fetched up to 15 min before kickoff (the pre-kickoff ladder), so it
  // too stays fresh until kickoff + 2 h. From then the ladder below (15 min)
  // re-evaluates against `fetchedAt`, so the longer value costs nothing later.
  if (now > kickoff && !isPastInPlay(kickoff, now)) {
    return IN_PLAY_MS / 1000 + TTL.MATCH_DETAIL_LIVE;
  }

  const distanceMs = Math.abs(kickoff - now);
  if (distanceMs < 3 * HOUR_MS) return TTL.MATCH_DETAIL_LIVE;
  if (distanceMs < 24 * HOUR_MS) return TTL.MATCH_DETAIL_MATCHDAY;
  if (distanceMs < 7 * 24 * HOUR_MS) return TTL.MATCH_DETAIL_WEEK;
  return TTL.MATCH_DETAIL_DEFAULT;
};

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
 *   kickoff < now < kickoff + 2h → 2h15 (in play, #3669: an entry fetched at or
 *                   after kickoff is not refreshed before kickoff + 2h)
 *   |kickoff − now| < 3h → 900s  (live)
 *                   < 24h → 900s  (matchday)
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
export const matchDetailTtl = (
  date: Date,
  status: string,
  report: MatchReportState = { hasReportData: true, hasReport: false },
  now: number = Date.now(),
): number => {
  const kickoff = kickoffMs(date);
  const natural = proximityTtl(kickoff, isSettledMatchStatus(status), now);

  const reportPending =
    isPastInPlay(kickoff, now) &&
    !report.hasReportData &&
    (report.hasReport || now - kickoff < 48 * HOUR_MS);

  return reportPending ? Math.min(natural, TTL.MATCH_DETAIL_MATCHDAY) : natural;
};

/**
 * Kickoff + 2 h or more past (`IN_PLAY_MS`) and still "scheduled" (no result
 * yet): a stale preview is the wrong answer, not just an old one, so the read
 * fetches it now (one `/info` call). While the match is in play there is no
 * result to fetch. Postponed / stopped / cancelled never settle, so they never
 * wait.
 */
export const needsInlineRefresh = (
  detail: Pick<MatchDetail, "date" | "status">,
  now: number = Date.now(),
): boolean => {
  return (
    detail.status === "scheduled" &&
    hasValidKickoff(detail) &&
    isPastInPlay(kickoffMs(detail.date), now)
  );
};

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
    {
      shouldServeStale,
      // Only a detail built while `/teams` failed (#3705).
      isPartial: isPartialFanout,
      refreshInline: (detail) => needsInlineRefresh(detail),
    },
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
      .handle("getUpcomingMatches", () =>
        withErrorMapping(getUpcomingMatchesHandler()),
      )
      .handle("getMatchDetail", ({ path: { matchId } }) =>
        withErrorMapping(getMatchDetailHandler(matchId)),
      )
      .handle("getPlayerStats", ({ path: { memberId } }) =>
        withErrorMapping(getPlayerStatsHandler(memberId)),
      ),
);
