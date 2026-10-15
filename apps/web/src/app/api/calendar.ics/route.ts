import { NextRequest, NextResponse } from "next/server";
import { Effect } from "effect";
import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { runPromise } from "@/lib/effect/runtime";
import {
  BffService,
  BFF_FAN_OUT_CONCURRENCY,
} from "@/lib/effect/services/BffService";
import { TeamRepository } from "@/lib/repositories/team.repository";
import {
  EventRepository,
  type EventListItemVM,
} from "@/lib/repositories/event.repository";
import type { Match } from "@kcvv/api-contract";
import {
  buildIcalFeed,
  CALENDAR_EVENTS_PARAM,
  CALENDAR_EVENTS_PARAM_VALUE,
  getFeedVariantMeta,
  normalizeCacheKey,
  resolveFeedVariant,
  type MatchSide,
} from "@/lib/utils/ical";
import { parsePsdId } from "@/lib/utils/psd-id";

export const runtime = "nodejs";

// 15 min — this feed is built from live PSD match data (bff.getMatches), so its
// cache (unstable_cache revalidate + Cache-Control) is aligned to the BFF
// freshness window rather than holding fixtures for 12h.
const CACHE_MAX_AGE = 900;
const MAX_TEAM_IDS = 20;

function parseSide(raw: string | null): MatchSide {
  if (raw === "home" || raw === "away") return raw;
  return "all";
}

/** Every known team's `psdId`, in Sanity order — the all-teams feed and the only ids `teamIds` may select. */
const knownTeamIds = Effect.gen(function* () {
  const repo = yield* TeamRepository;
  const teams = yield* repo.findAll();
  return teams
    .filter((t) => t.psdId != null)
    .map((t) => Number(t.psdId))
    .filter((id) => !isNaN(id) && id > 0);
});

/**
 * `knownTeamIds`, or `null` when the Sanity read fails. A failed read must not
 * take down a feed whose matches are already cached: the caller then keys on
 * the strict ids alone, and the all-teams feed reads the list only on a miss.
 */
async function fetchKnownTeamIds(): Promise<number[] | null> {
  try {
    // Section read: the feed still works without the known-team filter.
    return await runPromise(knownTeamIds.pipe(Effect.orDie));
  } catch (error) {
    unstable_rethrow(error);
    console.warn(
      "[Calendar API] team lookup failed; keying on strict ids only.",
      error,
    );
    return null;
  }
}

/**
 * `teamIds` → the one list both the cache key and the fan-out use (#3486):
 * strict ids only (`parsePsdId`), deduped, sorted, known-team `psdId`s only,
 * capped at `MAX_TEAM_IDS` after dedupe. `?teamIds=1,1,01`, `?teamIds=1,x1`
 * and `?teamIds=1` therefore share one cache entry and one PSD call. Empty
 * when nothing valid remains — the caller falls back to the all-teams feed,
 * as for an absent `teamIds`. `knownIds` `null` (the team read failed) skips
 * the known-team filter, so a known selection still lands on its usual key.
 */
function selectTeamIds(
  raw: string | null,
  knownIds: readonly number[] | null,
): number[] {
  if (!raw) return [];
  const known = knownIds && new Set(knownIds);
  const ids = new Set(
    raw
      .split(",")
      .map((s) => parsePsdId(s.trim()))
      .filter((id): id is number => id !== null && (!known || known.has(id))),
  );
  return [...ids].sort((a, b) => a - b).slice(0, MAX_TEAM_IDS);
}

/** `teamIds` `null` = the all-teams feed whose list could not be read up front; it is read here, on a cache miss only. */
async function fetchMatchesUncached(
  teamIds: readonly number[] | null,
): Promise<readonly Match[]> {
  const program = Effect.gen(function* () {
    const ids = teamIds ?? (yield* knownTeamIds);
    const bff = yield* BffService;
    const results = yield* Effect.all(
      ids.map((id) => bff.getMatches(id)),
      { concurrency: BFF_FAN_OUT_CONCURRENCY },
    );

    return results.flat();
  });

  // Subject read: this cached function's whole return value is the matches
  // feed, and `unstable_cache` must never commit a degraded body (see
  // `fetchUpcomingEventsCached`'s doc below for the same rule) — the route's
  // own outer `try/catch` in `GET` turns an unhandled failure into a 500
  // (#2864).
  return runPromise(program.pipe(Effect.orDie));
}

/**
 * Fixtures, cached under a matches-only key (`normalizeCacheKey`, no longer
 * events-aware — #2711 round 2). `events` never changes which teams/sides are
 * in scope, so this cache is shared by an `events=1` and an `events=0`
 * request for the same `teamIds`/`side` instead of duplicating the PSD
 * fan-out per flag value. Built fresh per request because the key itself is
 * request-dependent (`teamIds`/`side`); `unstable_cache` still dedupes across
 * requests that land on the same key, same as pre-#2704.
 */
function fetchMatches(
  teamIds: readonly number[] | null,
  cacheKey: string,
): Promise<readonly Match[]> {
  return unstable_cache(() => fetchMatchesUncached(teamIds), [cacheKey], {
    revalidate: CACHE_MAX_AGE,
  })();
}

/**
 * Club activities (#2704) — the same merged feed `/kalender` renders
 * (`EventRepository.findUpcomingForList()`), upcoming-only by construction
 * (its GROQ filters, not a re-filter here).
 *
 * Cached under its own fixed key, decoupled from `teamIds`/`side` (#2711
 * review) — the flag is club-wide, so every distinct team selection a
 * subscriber can make would otherwise re-run this same two-query Sanity read
 * on its own 15-minute cycle.
 *
 * Deliberately *not* degraded inside this cached callback: `unstable_cache`
 * only overwrites its entry when the wrapped function resolves, so letting a
 * Sanity failure throw here means Next never caches it — the existing
 * last-good value (or nothing, if there isn't one yet) survives, matching
 * this repo's ISR rule ("caught ⇒ CACHED, throw ⇒ last-good", see root
 * CLAUDE.md's Effect & Server Component Patterns). `fetchEvents` below
 * degrades to `[]`, but only for its own return value — since #2711 round 2
 * removed the combined-body cache entirely (this function's own `ical:events`
 * entry is the *only* cache either read touches), that degrade can no longer
 * reach any cache at all, at any layer.
 */
const fetchUpcomingEventsCached = unstable_cache(
  (): Promise<EventListItemVM[]> =>
    runPromise(
      Effect.gen(function* () {
        const eventRepo = yield* EventRepository;
        return yield* eventRepo.findUpcomingForList();
      }).pipe(Effect.orDie),
    ),
  ["ical:events"],
  { revalidate: CACHE_MAX_AGE },
);

/** Degrades the read above to `[]` on failure — see its doc for why the catch lives here, outside the cache boundary. */
async function fetchEvents(): Promise<EventListItemVM[]> {
  try {
    return await fetchUpcomingEventsCached();
  } catch (error) {
    console.warn(
      "[Calendar API] event-feed lookup failed; rendering matches only.",
      error,
    );
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawTeamIds = searchParams.get("teamIds");
  const side = parseSide(searchParams.get("side"));
  // Resolved once, here, from the `events=1` query flag. Threaded through to
  // `buildIcalFeed` (NAME/X-WR-CALDESC, resolved inside `generateIcal`) and
  // `getFeedVariantMeta` (the download filename) — neither re-derives it
  // (#2717). The inline check below, on `variant` itself, is a different
  // concern: whether to fetch the activities feed over the network at all,
  // so the flag being off skips the Sanity read entirely rather than
  // fetching a result `buildIcalFeed` would render anyway.
  const variant = resolveFeedVariant(
    searchParams.get(CALENDAR_EVENTS_PARAM) === CALENDAR_EVENTS_PARAM_VALUE,
  );

  try {
    // Outside the matches cache on purpose (#3486): the key is built from
    // this list, so it must be resolved before the cache is looked up.
    // `findAll` is itself a revalidating Sanity fetch, not a fresh read, and a
    // failure only drops the known-team filter (see `fetchKnownTeamIds`).
    const knownIds = await fetchKnownTeamIds();
    const selected = selectTeamIds(rawTeamIds, knownIds);
    const matchesCacheKey = normalizeCacheKey(
      selected.length > 0 ? selected : null,
      side,
    );
    // Neither read's own cache can ever hold a degraded body: the matches
    // cache never sees a failure caught inside it (a Sanity/PSD blip on the
    // *events* side never reaches this fetch at all), and the events read's
    // own cache only ever stores a resolved value (see its doc). Composing
    // them into the final ICS string happens per request, uncached — cheap
    // string building over a few hundred matches, next to the I/O it
    // replaces (#2711 round 2).
    const [matches, events] = await Promise.all([
      fetchMatches(selected.length > 0 ? selected : knownIds, matchesCacheKey),
      variant === "matches-and-events"
        ? fetchEvents()
        : Promise.resolve<EventListItemVM[]>([]),
    ]);

    const icalOutput = buildIcalFeed(matches, events, variant, side);
    const { filename } = getFeedVariantMeta(variant);

    return new NextResponse(icalOutput, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": `max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
      },
    });
  } catch (error) {
    console.error("[Calendar API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
