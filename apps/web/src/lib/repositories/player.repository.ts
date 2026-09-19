import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq, type SanityReadError } from "../sanity/fetch-groq";
import { SANITY_LIST_REVALIDATE, SANITY_TAGS } from "../sanity/cache-tags";
import type {
  PLAYERS_QUERY_RESULT,
  PLAYER_BY_PSD_ID_QUERY_RESULT,
} from "../sanity/sanity.types";
import type { SanityPlayerBase } from "../sanity/types";
import { teamDisplayName } from "../utils/team-display-name";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const PLAYERS_QUERY =
  defineQuery(`*[_type == "player" && archived != true] | order(lastName asc) {
  _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
  birthDate,
  "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
  "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  "celebrationImageUrl": celebrationImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  bio
}`);

/**
 * `currentTeam`'s `showInNavigation != false` mirrors every other
 * team-listing query (`TEAMS_QUERY`, `TEAMS_BY_MEMBER_QUERY`,
 * `app/sitemap.ts`) — a deliberately hidden team should not surface as this
 * player's `teamLabel` or as the "PLOEG" domain-tier card on `<RelatedRow>`
 * (review round 1, #2788). `_id` + `teamImageUrl` feed that card directly —
 * see `toPlayerVM` below — so `/spelers/[slug]` no longer needs a second,
 * near-identical `TeamRepository.findByMemberId` round-trip.
 */
export const PLAYER_BY_PSD_ID_QUERY =
  defineQuery(`*[_type == "player" && psdId == $psdId][0] {
  _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
  birthDate,
  "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
  "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  "celebrationImageUrl": celebrationImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  bio,
  "currentTeam": *[_type == "team" && archived != true && showInNavigation != false && references(^._id)] | order(name asc)[0] {
    _id, name, displayName, "slug": slug.current,
    "teamImageUrl": teamImage.asset->url + "?w=1200&h=800&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(teamImage.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(teamImage.hotspot.y, 0.5))
  }
}`);

/**
 * PSD's `bestPosition` values — four lowercase English strings, matched
 * case-insensitively since PSD casing has drifted before — mapped to the
 * same Dutch vocabulary the editorial `position` field already uses
 * (#2638). Lives in the repository, not the BFF: team, player and staff
 * data reach this page straight from the content store, with no BFF hop on
 * this path (#2538). An unmapped value (a future `wing-back`) is a miss,
 * not an entry — `resolvePositionPsd` below returns `undefined` for it, the
 * same path as absence, rather than shipping raw English to the page.
 */
const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Keeper",
  defender: "Verdediger",
  midfielder: "Middenvelder",
  attacker: "Aanvaller",
};

function resolvePositionPsd(
  positionPsd: string | null | undefined,
): string | undefined {
  const key = positionPsd?.trim().toLowerCase();
  // `Object.hasOwn` guard, not a bare index: `POSITION_LABELS` is an object
  // literal, so it inherits `Object.prototype`. A bare lookup on an inherited
  // key (`constructor`, `__proto__`, `toString`) returns a function or an
  // object rather than `undefined`, which the `Record<string, string>` type
  // hides — and `positionPsd` is upstream free text from PSD, so the key is
  // never ours to trust. Own properties only; everything else degrades to no
  // label, the same path as absence (#2638).
  return key && Object.hasOwn(POSITION_LABELS, key)
    ? POSITION_LABELS[key]
    : undefined;
}

export interface PlayerVM {
  id: string;
  firstName: string;
  lastName: string;
  /**
   * Resolution order: keeper flag → editorial position → mapped PSD
   * `bestPosition` (via `POSITION_LABELS`) → `undefined` (#2638). Absent
   * when no editor has authored a position, PSD's `bestPosition` is empty,
   * or PSD sends a value `POSITION_LABELS` doesn't recognise — never
   * defaulted to a generic literal ("Speler" was rejected: it would make a
   * display string a control value for every consuming surface's
   * comparisons), so a lookup miss takes the same path as absence on every
   * consuming surface (`PlayerHero`'s meta row, `PlayerCard`'s label,
   * `SquadGrid`'s grouping).
   */
  position?: string;
  number?: number;
  imageUrl?: string;
  celebrationImageUrl?: string;
  href?: string;
  bio?: PLAYERS_QUERY_RESULT[number]["bio"];
  birthDate?: string;
  /**
   * Active-team label resolved from the first non-archived team that
   * references this player, ordered alphabetically by team name.
   * Multi-team disambiguation (PRD §7) — see `findByPsdId` GROQ.
   */
  teamLabel?: string;
  /**
   * The most informative short label available for this player — position
   * when authored, else the active-team label, else absent. Shared by the
   * metadata description and the OG share card so the two surfaces in one
   * share preview never disagree about what's known (#2567 review).
   */
  metaLabel?: string;
  /**
   * The same team `currentTeam` resolves, as a routable domain-tier
   * `<RelatedRow>` card (#2443/#2581) — `_id` for the analytics payload,
   * `slug` for the href, `teamImageUrl` for the card image (falls back to
   * the `<JerseyShirt>` artefact when absent, same as every other imageless
   * card, #2574). All three are set together or not at all.
   */
  teamId?: string;
  teamSlug?: string;
  teamImageUrl?: string;
}

/** A PlayerVM that has a valid href (i.e. has a psdId) */
export type RoutablePlayerVM = PlayerVM & { href: string };

export function toPlayerVM(
  row: SanityPlayerBase & {
    celebrationImageUrl?: string | null;
    bio?: PLAYERS_QUERY_RESULT[number]["bio"] | null;
    birthDate?: string | null;
    currentTeam?: {
      _id?: string | null;
      name?: string | null;
      displayName?: string | null;
      slug?: string | null;
      teamImageUrl?: string | null;
    } | null;
  },
): PlayerVM {
  const position = row.keeper
    ? "Keeper"
    : (row.position ?? resolvePositionPsd(row.positionPsd) ?? undefined);

  // The team's own name, resolved the same way its page resolves it — a
  // profile that says `KCVVE  U15` beside a page headed `U15` is the drift
  // #2630 closes.
  const teamLabel = row.currentTeam
    ? teamDisplayName({
        displayName: row.currentTeam.displayName,
        slug: row.currentTeam.slug ?? "",
        name: row.currentTeam.name ?? "",
      })
    : undefined;

  return {
    id: row._id,
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    position,
    number: row.jerseyNumber ?? undefined,
    imageUrl: row.transparentImageUrl ?? row.psdImageUrl ?? undefined,
    celebrationImageUrl: row.celebrationImageUrl ?? undefined,
    href: row.psdId ? `/spelers/${row.psdId}` : undefined,
    bio: row.bio ?? undefined,
    birthDate: row.birthDate ?? undefined,
    teamLabel,
    metaLabel: position ?? teamLabel,
    teamId: row.currentTeam?._id ?? undefined,
    teamSlug: row.currentTeam?.slug ?? undefined,
    teamImageUrl: row.currentTeam?.teamImageUrl ?? undefined,
  };
}

// ─── Keeper PSD-id lookup ────────────────────────────────────────────────────
//
// Returns just the PSD ids of players flagged `keeper: true` in Sanity. The
// payload is tiny (one string per keeper, ~30 IDs across the club). Used by
// match-detail surfaces to render the keeper visual distinction.
//
// Caching strategy:
//   - Sanity client already runs with `useCdn: true` → first-hop cache.
//   - Page-level ISR on /wedstrijd/[matchId] revalidates every 5 min.
//   - On top of those, we memoise the result in module scope for 24h:
//     keeper status changes rarely (PSD-synced) and a stale answer for a
//     warm worker is acceptable. Cold starts re-fetch; no global state leaks
//     between deployments.
//
// If a future tag-driven invalidation is wired up (e.g. from the PSD sync
// worker), promote this to `unstable_cache` with a `keepers` tag and drop
// the module-scope cache.
const KEEPER_PSD_IDS_QUERY = defineQuery(
  `*[_type == "player" && keeper == true && archived != true].psdId`,
);

const KEEPER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let keeperCache: { value: ReadonlySet<string>; expiresAt: number } | null =
  null;

/**
 * Test-only: clear the module-scope keeper cache. Not exported via the
 * repository tag because no production caller needs it.
 */
export function __resetKeeperCacheForTests() {
  keeperCache = null;
}

export interface PlayerRepositoryInterface {
  readonly findAll: () => Effect.Effect<PlayerVM[], SanityReadError>;
  readonly findByPsdId: (
    psdId: string,
  ) => Effect.Effect<PlayerVM | null, SanityReadError>;
  /**
   * Returns the set of PSD ids whose Sanity `player` document is flagged
   * as a keeper. PSD ids are strings in Sanity (and may not match the
   * `Match.home_team`/`away_team` `id` field type) — callers should
   * coerce to string before membership testing.
   */
  readonly findKeeperPsdIds: () => Effect.Effect<
    ReadonlySet<string>,
    SanityReadError
  >;
}

export class PlayerRepository extends Context.Tag("PlayerRepository")<
  PlayerRepository,
  PlayerRepositoryInterface
>() {}

export const PlayerRepositoryLive = Layer.succeed(PlayerRepository, {
  findAll: () =>
    fetchGroq<PLAYERS_QUERY_RESULT>(PLAYERS_QUERY, undefined, {
      revalidate: SANITY_LIST_REVALIDATE,
      tags: [SANITY_TAGS.players],
    }).pipe(Effect.map((rows) => rows.map(toPlayerVM))),
  findByPsdId: (psdId) =>
    fetchGroq<PLAYER_BY_PSD_ID_QUERY_RESULT>(PLAYER_BY_PSD_ID_QUERY, {
      psdId,
    }).pipe(Effect.map((row) => (row ? toPlayerVM(row) : null))),
  findKeeperPsdIds: () =>
    Effect.gen(function* () {
      const now = Date.now();
      if (keeperCache && keeperCache.expiresAt > now) {
        return keeperCache.value;
      }
      const rows =
        yield* fetchGroq<readonly (string | null)[]>(KEEPER_PSD_IDS_QUERY);
      const value: ReadonlySet<string> = new Set(
        rows.filter((id): id is string => typeof id === "string" && id !== ""),
      );
      keeperCache = { value, expiresAt: now + KEEPER_CACHE_TTL_MS };
      return value;
    }),
});
