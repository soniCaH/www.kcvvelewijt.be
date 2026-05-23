import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { fetchGroq } from "../sanity/fetch-groq";
import type {
  PLAYERS_QUERY_RESULT,
  PLAYER_BY_PSD_ID_QUERY_RESULT,
} from "../sanity/sanity.types";
import type { SanityPlayerBase } from "../sanity/types";

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

export const PLAYER_BY_PSD_ID_QUERY =
  defineQuery(`*[_type == "player" && psdId == $psdId][0] {
  _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
  birthDate,
  "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
  "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  "celebrationImageUrl": celebrationImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  bio,
  "currentTeam": *[_type == "team" && archived != true && references(^._id)] | order(name asc)[0] {
    name, season
  }
}`);

export interface PlayerVM {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
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
  /** Active-team season label (e.g. "26/27"). */
  season?: string;
}

/** A PlayerVM that has a valid href (i.e. has a psdId) */
export type RoutablePlayerVM = PlayerVM & { href: string };

export function toPlayerVM(
  row: SanityPlayerBase & {
    celebrationImageUrl?: string | null;
    bio?: PLAYERS_QUERY_RESULT[number]["bio"] | null;
    birthDate?: string | null;
    currentTeam?: { name?: string | null; season?: string | null } | null;
  },
): PlayerVM {
  const position = row.keeper
    ? "Keeper"
    : (row.position ?? row.positionPsd ?? "Speler");

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
    teamLabel: row.currentTeam?.name ?? undefined,
    season: row.currentTeam?.season ?? undefined,
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
export const KEEPER_PSD_IDS_QUERY = defineQuery(
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
  readonly findAll: () => Effect.Effect<PlayerVM[]>;
  readonly findByPsdId: (psdId: string) => Effect.Effect<PlayerVM | null>;
  /**
   * Returns the set of PSD ids whose Sanity `player` document is flagged
   * as a keeper. PSD ids are strings in Sanity (and may not match the
   * `Match.home_team`/`away_team` `id` field type) — callers should
   * coerce to string before membership testing.
   */
  readonly findKeeperPsdIds: () => Effect.Effect<ReadonlySet<string>>;
}

export class PlayerRepository extends Context.Tag("PlayerRepository")<
  PlayerRepository,
  PlayerRepositoryInterface
>() {}

export const PlayerRepositoryLive = Layer.succeed(PlayerRepository, {
  findAll: () =>
    fetchGroq<PLAYERS_QUERY_RESULT>(PLAYERS_QUERY).pipe(
      Effect.map((rows) => rows.map(toPlayerVM)),
    ),
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
