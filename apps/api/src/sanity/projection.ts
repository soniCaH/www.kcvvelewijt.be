import { createClient } from "@sanity/client";
import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";
import type { PlayerImageState } from "./client";
import { sanityClientConfig } from "./config";

// ─── Error ────────────────────────────────────────────────────────────────────

export class SanityQueryError extends Error {
  readonly _tag = "SanityQueryError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SanityQueryError";
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface SanityProjectionInterface {
  /** Fetch PSD IDs of all teams where showInNavigation is not false. */
  readonly getVisibleTeamPsdIds: () => Effect.Effect<
    string[],
    SanityQueryError
  >;
  /** Fetch existing psdImageUrl + psdImage presence for all player docs. */
  readonly getPlayersImageState: () => Effect.Effect<
    Map<string, PlayerImageState>,
    SanityQueryError
  >;
  /** Fetch PSD IDs of all non-archived players. */
  readonly getActivePlayerPsdIds: () => Effect.Effect<
    string[],
    SanityQueryError
  >;
  /** Fetch PSD IDs of all non-archived staff members. */
  readonly getActiveStaffPsdIds: () => Effect.Effect<
    string[],
    SanityQueryError
  >;
  /** Fetch PSD IDs of all non-archived teams. */
  readonly getActiveTeamPsdIds: () => Effect.Effect<string[], SanityQueryError>;
}

export class SanityProjection extends Context.Tag("SanityProjection")<
  SanityProjection,
  SanityProjectionInterface
>() {}

// ─── Live layer ───────────────────────────────────────────────────────────────

export const SanityProjectionLive = Layer.effect(
  SanityProjection,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const client = createClient({
      ...sanityClientConfig(env),
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
            new SanityQueryError("Failed to fetch visible team PSD IDs", cause),
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
            new SanityQueryError("Failed to fetch player image state", cause),
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
            new SanityQueryError(
              "Failed to fetch active player PSD IDs",
              cause,
            ),
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
            new SanityQueryError("Failed to fetch active staff PSD IDs", cause),
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
            new SanityQueryError("Failed to fetch active team PSD IDs", cause),
        }),
    };
  }),
);
