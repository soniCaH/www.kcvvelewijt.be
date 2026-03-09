import { createClient } from "@sanity/client";
import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";

// ─── Document shapes written to Sanity ───────────────────────────────────────

export interface SanityPlayerDoc {
  psdId: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null; // "YYYY-MM-DD" (time component stripped from PSD)
  nationality: string | null;
  keeper: boolean;
  positionPsd: string | null; // from PSD bestPosition — null until KCVV populates
}

export interface SanityTeamDoc {
  psdId: string;
  name: string;
  slug: string;
  age: string; // "A", "U17", etc.
  gender: string;
  footbelId: number | null;
  playerPsdIds: string[];
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class SanityWriteError extends Error {
  readonly _tag = "SanityWriteError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SanityWriteError";
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface PlayerImageState {
  psdImageUrl: string | null;
  hasPsdImage: boolean;
}

export interface SanityWriteClientInterface {
  readonly upsertPlayer: (
    doc: SanityPlayerDoc,
  ) => Effect.Effect<void, SanityWriteError>;
  readonly upsertTeam: (
    doc: SanityTeamDoc,
  ) => Effect.Effect<void, SanityWriteError>;
  /** Fetch existing psdImageUrl + psdImage presence for all player docs. */
  readonly getPlayersImageState: () => Effect.Effect<
    Map<string, PlayerImageState>,
    SanityWriteError
  >;
  /** Download image from imageUrl and upload to Sanity, patching psdImage + psdImageUrl. */
  readonly uploadPlayerImage: (
    psdId: string,
    imageUrl: string,
  ) => Effect.Effect<void, SanityWriteError>;
}

export class SanityWriteClient extends Context.Tag("SanityWriteClient")<
  SanityWriteClient,
  SanityWriteClientInterface
>() {}

// ─── Live layer ───────────────────────────────────────────────────────────────

/**
 * Upsert strategy: createIfNotExists sets the document skeleton on first run.
 * patch().set() overwrites only PSD-sourced fields — never touches editorial
 * fields (transparentImage, celebrationImage, position, bio, trainingSchedule, staff).
 */
export const SanityWriteClientLive = Layer.effect(
  SanityWriteClient,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const client = createClient({
      projectId: env.SANITY_PROJECT_ID,
      dataset: env.SANITY_DATASET,
      apiVersion: "2024-01-01",
      token: env.SANITY_API_TOKEN,
      useCdn: false,
    });

    const docId = (type: string, psdId: string) => `${type}-psd-${psdId}`;

    const upsert = <T extends Record<string, unknown>>(
      type: string,
      psdId: string,
      psdFields: T,
    ) =>
      Effect.tryPromise({
        try: () =>
          client
            .transaction()
            .createIfNotExists({ _id: docId(type, psdId), _type: type, psdId })
            .patch(docId(type, psdId), (p) => p.set(psdFields))
            .commit(),
        catch: (cause) =>
          new SanityWriteError(`Failed to upsert ${type} ${psdId}`, cause),
      }).pipe(Effect.asVoid);

    return {
      upsertPlayer: (doc) =>
        upsert("player", doc.psdId, {
          firstName: doc.firstName,
          lastName: doc.lastName,
          birthDate: doc.birthDate,
          nationality: doc.nationality,
          keeper: doc.keeper,
          positionPsd: doc.positionPsd,
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
            new SanityWriteError("Failed to fetch player image state", cause),
        }),

      uploadPlayerImage: (psdId, imageUrl) =>
        Effect.tryPromise({
          try: async () => {
            const response = await fetch(imageUrl, {
              headers: {
                "x-api-key": env.PSD_API_KEY,
                "x-api-club": env.PSD_API_CLUB,
                Authorization: env.PSD_API_AUTH,
              },
            });
            // 404 = player has no photo in PSD — skip silently
            if (response.status === 404) return;
            if (!response.ok)
              throw new Error(
                `PSD image fetch failed: ${response.status} ${response.statusText}`,
              );

            const contentType =
              response.headers.get("content-type") ?? "image/jpeg";
            const arrayBuffer = await response.arrayBuffer();

            // Use REST API directly — client.assets.upload() uses Node.js internals
            // incompatible with Cloudflare Workers runtime.
            const uploadUrl = `https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${env.SANITY_DATASET}?filename=player-psd-${psdId}.jpg`;
            const uploadRes = await fetch(uploadUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
                "Content-Type": contentType,
              },
              body: arrayBuffer,
            });
            if (!uploadRes.ok) {
              const text = await uploadRes.text();
              throw new Error(
                `Sanity upload failed: ${uploadRes.status} ${text}`,
              );
            }
            const { document: asset } = (await uploadRes.json()) as {
              document: { _id: string };
            };

            await client
              .patch(docId("player", psdId))
              .set({
                psdImage: {
                  _type: "image",
                  asset: { _type: "reference", _ref: asset._id },
                },
                psdImageUrl: imageUrl,
              })
              .commit();
          },
          catch: (cause) =>
            new SanityWriteError(
              `Failed to upload image for player ${psdId}`,
              cause,
            ),
        }).pipe(Effect.asVoid),

      upsertTeam: (doc) =>
        upsert("team", doc.psdId, {
          name: doc.name,
          slug: { _type: "slug", current: doc.slug },
          age: doc.age,
          gender: doc.gender,
          footbelId: doc.footbelId,
          players: doc.playerPsdIds.map((id) => ({
            _type: "reference",
            _ref: `player-psd-${id}`,
            _key: id,
          })),
        }),
    };
  }),
);
