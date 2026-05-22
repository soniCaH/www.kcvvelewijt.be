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

export interface PlayerRepositoryInterface {
  readonly findAll: () => Effect.Effect<PlayerVM[]>;
  readonly findByPsdId: (psdId: string) => Effect.Effect<PlayerVM | null>;
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
});
