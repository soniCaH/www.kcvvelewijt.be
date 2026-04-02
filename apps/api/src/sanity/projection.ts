import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";
import { createClient } from "@sanity/client";
import { SanityError, type PlayerImageState } from "./client";

// ─── Interface ───────────────────────────────────────────────────────────────

export interface SanityProjectionInterface {
  /** Fetch PSD IDs of all teams where showInNavigation is not false. */
  readonly getVisibleTeamPsdIds: () => Effect.Effect<string[], SanityError>;
  /** Fetch existing psdImageUrl + psdImage presence for all player docs. */
  readonly getPlayersImageState: () => Effect.Effect<
    Map<string, PlayerImageState>,
    SanityError
  >;
  /** Fetch PSD IDs of all non-archived players. */
  readonly getActivePlayerPsdIds: () => Effect.Effect<string[], SanityError>;
  /** Fetch PSD IDs of all non-archived staff members. */
  readonly getActiveStaffPsdIds: () => Effect.Effect<string[], SanityError>;
  /** Fetch PSD IDs of all non-archived teams. */
  readonly getActiveTeamPsdIds: () => Effect.Effect<string[], SanityError>;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export class SanityProjection extends Context.Tag("SanityProjection")<
  SanityProjection,
  SanityProjectionInterface
>() {}

// ─── Live layer ──────────────────────────────────────────────────────────────

/** Projections use `useCdn: true` for faster reads; writes in SanityWriteClient use `useCdn: false`. */
export const SanityProjectionLive = Layer.effect(
  SanityProjection,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const client = createClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      apiVersion: "2024-01-01",
      token: env.SANITY_API_TOKEN,
      useCdn: true,
    });

    return {
      getVisibleTeamPsdIds: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<string | null>>(
              `*[_type == "team" && showInNavigation != false].psdId`,
            );
            return rows.filter(
              (id): id is string => typeof id === "string" && id.length > 0,
            );
          },
          catch: (cause) =>
            new SanityError("Failed to fetch visible team PSD IDs", cause),
        }),

      getPlayersImageState: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<
              Array<{
                psdId: string;
                psdImageUrl: string | null;
                hasPsdImage: boolean;
              }>
            >(
              `*[_type == "player"] { psdId, psdImageUrl, "hasPsdImage": defined(psdImage) }`,
            );
            return new Map(
              rows.map((r) => [
                r.psdId,
                { psdImageUrl: r.psdImageUrl, hasPsdImage: r.hasPsdImage },
              ]),
            );
          },
          catch: (cause) =>
            new SanityError("Failed to fetch player image state", cause),
        }),

      getActivePlayerPsdIds: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<{ psdId: string }>>(
              `*[_type == "player" && archived != true] { psdId }`,
            );
            return rows.map((r) => r.psdId);
          },
          catch: (cause) =>
            new SanityError("Failed to fetch active player PSD IDs", cause),
        }),

      getActiveStaffPsdIds: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<{ psdId: string }>>(
              `*[_type == "staffMember" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
            );
            return rows.map((r) => r.psdId);
          },
          catch: (cause) =>
            new SanityError("Failed to fetch active staff PSD IDs", cause),
        }),

      getActiveTeamPsdIds: () =>
        Effect.tryPromise({
          try: async () => {
            const rows = await client.fetch<Array<{ psdId: string }>>(
              `*[_type == "team" && archived != true && defined(psdId) && psdId != ""] { psdId }`,
            );
            return rows.map((r) => r.psdId);
          },
          catch: (cause) =>
            new SanityError("Failed to fetch active team PSD IDs", cause),
        }),
    };
  }),
);
