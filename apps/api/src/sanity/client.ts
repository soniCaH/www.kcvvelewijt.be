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
  staffPsdIds: string[];
}

export interface SanityStaffDoc {
  psdId: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null; // "YYYY-MM-DD"
  positionShort: string | undefined; // from PSD functionTitle; undefined = skip patch (preserve editor value)
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
  readonly upsertStaff: (
    doc: SanityStaffDoc,
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
 * fields (transparentImage, celebrationImage, position, bio, trainingSchedule).
 * Both `players` and `staff` on team documents are sync-owned (readOnly in Studio).
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
          psdId: doc.psdId,
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
            // Validate imageUrl before attaching PSD credentials
            let parsedUrl: URL;
            try {
              parsedUrl = new URL(imageUrl);
            } catch {
              throw new Error(`Invalid image URL: ${imageUrl}`);
            }
            const expectedHost = new URL(env.PSD_API_BASE_URL).hostname;
            if (
              parsedUrl.protocol !== "https:" ||
              parsedUrl.hostname !== expectedHost
            ) {
              throw new Error(
                `Image URL host not allowed: ${parsedUrl.hostname}`,
              );
            }

            const psdAbort = new AbortController();
            const psdTimeout = setTimeout(() => psdAbort.abort(), 10_000);

            // Count this PSD request in the daily counter (same logic as countedFetch).
            // Image downloads use fetch() directly so they bypass countedFetch — track them here.
            // Counter runs in finally so it increments even on timeout/network error.
            const d = new Date();
            const counterKey = `psd:calls:${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

            let response: Response;
            try {
              response = await fetch(imageUrl, {
                signal: psdAbort.signal,
                redirect: "follow",
                headers: {
                  "x-api-key": env.PSD_API_KEY,
                  "x-api-club": env.PSD_API_CLUB,
                  Authorization: env.PSD_API_AUTH,
                },
              });
            } finally {
              clearTimeout(psdTimeout);
              await env.PSD_CACHE.get(counterKey)
                .then((current) => {
                  const parsed = parseInt(String(current ?? "0"), 10);
                  const currentNumber = Number.isFinite(parsed) ? parsed : 0;
                  return env.PSD_CACHE.put(
                    counterKey,
                    String(currentNumber + 1),
                    { expirationTtl: 60 * 60 * 48 },
                  );
                })
                .catch(() => undefined);
            }

            // Log PSD response details for diagnostics
            console.log(
              `[uploadPlayerImage] player=${psdId} psd_status=${response.status} content-type=${response.headers.get("content-type") ?? "(none)"} url=${imageUrl.split("?")[0]}`,
            );

            // 404 = player has no photo in PSD — skip silently
            if (response.status === 404) return;
            if (!response.ok)
              throw new Error(
                `PSD image fetch failed: ${response.status} ${response.statusText}`,
              );

            const contentType =
              response.headers.get("content-type") ?? "image/jpeg";
            const arrayBuffer = await response.arrayBuffer();
            console.log(
              `[uploadPlayerImage] player=${psdId} body_bytes=${arrayBuffer.byteLength} content-type=${contentType}`,
            );

            // Use REST API directly — client.assets.upload() uses Node.js internals
            // incompatible with Cloudflare Workers runtime.
            const uploadUrl = `https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${env.SANITY_DATASET}?filename=player-psd-${psdId}.jpg`;
            const sanityAbort = new AbortController();
            const sanityTimeout = setTimeout(() => sanityAbort.abort(), 10_000);
            const uploadRes = await fetch(uploadUrl, {
              signal: sanityAbort.signal,
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.SANITY_API_TOKEN}`,
                "Content-Type": contentType,
              },
              body: arrayBuffer,
            }).finally(() => clearTimeout(sanityTimeout));
            if (!uploadRes.ok) {
              const text = await uploadRes.text();
              throw new Error(
                `Sanity upload failed: ${uploadRes.status} ${text}`,
              );
            }
            const { document: asset } = (await uploadRes.json()) as {
              document: { _id: string };
            };
            console.log(
              `[uploadPlayerImage] player=${psdId} sanity_asset_id=${asset._id}`,
            );

            await client
              .patch(docId("player", psdId))
              .set({
                psdImage: {
                  _type: "image",
                  asset: { _type: "reference", _ref: asset._id },
                },
                // Store stable URL (no query param) for dedup comparison on future syncs.
                psdImageUrl: imageUrl.split("?")[0],
              })
              .commit();
            console.log(
              `[uploadPlayerImage] player=${psdId} patch committed — image upload complete`,
            );
          },
          catch: (cause) =>
            new SanityWriteError(
              `Failed to upload image for player ${psdId}`,
              cause,
            ),
        }).pipe(Effect.asVoid),

      upsertTeam: (doc) =>
        upsert("team", doc.psdId, {
          psdId: doc.psdId,
          name: doc.name,
          slug: { _type: "slug", current: doc.slug },
          age: doc.age,
          gender: doc.gender,
          ...(doc.footbelId != null && { footbelId: doc.footbelId }),
          players: doc.playerPsdIds.map((id) => ({
            _type: "reference",
            _ref: `player-psd-${id}`,
            _key: id,
          })),
          staff: doc.staffPsdIds.map((id) => ({
            _type: "reference",
            _ref: `staffMember-psd-${id}`,
            _key: id,
          })),
        }),

      upsertStaff: (doc) => {
        const fields: Record<string, unknown> = {
          psdId: doc.psdId,
          firstName: doc.firstName,
          lastName: doc.lastName,
          birthDate: doc.birthDate,
        };
        if (doc.positionShort !== undefined) {
          fields["positionShort"] = doc.positionShort;
        }
        return upsert("staffMember", doc.psdId, fields);
      },
    };
  }),
);
