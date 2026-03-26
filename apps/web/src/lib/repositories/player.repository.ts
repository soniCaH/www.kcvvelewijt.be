import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import { sanityClient } from "../sanity/client";
import type {
  PLAYERS_QUERY_RESULT,
  PLAYER_BY_PSD_ID_QUERY_RESULT,
} from "../sanity/sanity.types";
import type { SanityPlayerBase } from "../sanity/types";

// ─── GROQ Queries ────────────────────────────────────────────────────────────

export const PLAYERS_QUERY =
  defineQuery(`*[_type == "player" && archived != true] | order(lastName asc) {
  _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
  birthDate, nationality, height, weight,
  "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
  "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  "celebrationImageUrl": celebrationImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  bio
}`);

export const PLAYER_BY_PSD_ID_QUERY =
  defineQuery(`*[_type == "player" && psdId == $psdId][0] {
  _id, psdId, firstName, lastName, jerseyNumber, keeper, positionPsd, position,
  birthDate, nationality, height, weight,
  "psdImageUrl": psdImage.asset->url + "?w=400&q=80&fm=webp&fit=max",
  "transparentImageUrl": transparentImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  "celebrationImageUrl": celebrationImage.asset->url + "?w=600&q=80&fm=webp&fit=max",
  bio
}`);

export interface PlayerVM {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  number?: number;
  imageUrl?: string;
  href?: string;
  bio?: PLAYERS_QUERY_RESULT[number]["bio"];
  birthDate?: string;
  nationality?: string;
  height?: number;
  weight?: number;
}

/** A PlayerVM that has a valid href (i.e. has a psdId) */
export type RoutablePlayerVM = PlayerVM & { href: string };

export function toPlayerVM(
  row: SanityPlayerBase & {
    bio?: PLAYERS_QUERY_RESULT[number]["bio"] | null;
    birthDate?: string | null;
    nationality?: string | null;
    height?: number | null;
    weight?: number | null;
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
    href: row.psdId ? `/spelers/${row.psdId}` : undefined,
    bio: row.bio ?? undefined,
    birthDate: row.birthDate ?? undefined,
    nationality: row.nationality ?? undefined,
    height: row.height ?? undefined,
    weight: row.weight ?? undefined,
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

const fetchGroq = <T>(query: string, params?: Record<string, unknown>) =>
  Effect.tryPromise({
    try: () => sanityClient.fetch<T>(query, params ?? {}),
    catch: (cause) => new Error(`Sanity fetch failed: ${String(cause)}`),
  }).pipe(Effect.orDie);

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
