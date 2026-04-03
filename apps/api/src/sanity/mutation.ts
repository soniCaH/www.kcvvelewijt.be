import { createClient } from "@sanity/client";
import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";
import { sanityClientConfig } from "./config";

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
  roleCode: string | undefined; // from PSD functionTitle; undefined = skip patch (preserve editor value)
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class SanityMutationError extends Error {
  readonly _tag = "SanityMutationError" as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SanityMutationError";
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface PlayerImageState {
  psdImageUrl: string | null;
  hasPsdImage: boolean;
}

export interface SanityMutationInterface {
  readonly upsertPlayer: (
    doc: SanityPlayerDoc,
  ) => Effect.Effect<void, SanityMutationError>;
  readonly upsertTeam: (
    doc: SanityTeamDoc,
  ) => Effect.Effect<void, SanityMutationError>;
  readonly upsertStaff: (
    doc: SanityStaffDoc,
  ) => Effect.Effect<void, SanityMutationError>;
  /** Set archived: true on players with these PSD IDs. */
  readonly archivePlayers: (
    psdIds: string[],
  ) => Effect.Effect<void, SanityMutationError>;
  /** Set archived: true on staff members with these PSD IDs. */
  readonly archiveStaff: (
    psdIds: string[],
  ) => Effect.Effect<void, SanityMutationError>;
  /** Set archived: true on teams with these PSD IDs. */
  readonly archiveTeams: (
    psdIds: string[],
  ) => Effect.Effect<void, SanityMutationError>;
  /** Download image from fetchUrl and upload to Sanity, patching psdImage + psdImageUrl.
   * stableUrl is persisted as psdImageUrl for dedup on future syncs — must match
   * the value produced by transformMember._psdImageUrl (includes ?v=N if present). */
  readonly uploadPlayerImage: (
    psdId: string,
    fetchUrl: string,
    stableUrl: string,
  ) => Effect.Effect<void, SanityMutationError>;
  /** Create a searchFeedback document in Sanity. */
  readonly writeFeedback: (doc: {
    pathSlug: string;
    pathTitle: string;
    vote: "up" | "down";
  }) => Effect.Effect<void, SanityMutationError>;
}

export class SanityMutation extends Context.Tag("SanityMutation")<
  SanityMutation,
  SanityMutationInterface
>() {}

// ─── Live layer ───────────────────────────────────────────────────────────────

/**
 * Upsert strategy: createIfNotExists sets the document skeleton on first run.
 * patch().set() overwrites only PSD-sourced fields — never touches editorial
 * fields (transparentImage, celebrationImage, position, bio, trainingSchedule).
 * Both `players` and `staff` on team documents are sync-owned (readOnly in Studio).
 */
export const SanityMutationLive = Layer.effect(
  SanityMutation,
  Effect.gen(function* () {
    const env = yield* WorkerEnvTag;
    const client = createClient({
      ...sanityClientConfig(env),
      useCdn: false,
    });

    const docId = (type: string, psdId: string) => `${type}-psd-${psdId}`;

    const archiveByPsdIds = (type: string, psdIds: string[]) =>
      Effect.tryPromise({
        try: async () => {
          if (psdIds.length === 0) return;
          let tx = client.transaction();
          for (const psdId of psdIds) {
            tx = tx.patch(docId(type, psdId), (p) => p.set({ archived: true }));
          }
          await tx.commit();
        },
        catch: (cause) =>
          new SanityMutationError(`Failed to archive ${type} documents`, cause),
      }).pipe(Effect.asVoid);

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
          new SanityMutationError(`Failed to upsert ${type} ${psdId}`, cause),
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
          archived: false,
        }),

      uploadPlayerImage: (psdId, imageUrl, stableUrl) =>
        Effect.gen(function* () {
          // Validate imageUrl before attaching PSD credentials
          let parsedUrl: URL;
          try {
            parsedUrl = new URL(imageUrl);
          } catch {
            return yield* Effect.fail(
              new SanityMutationError(`Invalid image URL: ${imageUrl}`),
            );
          }
          const expectedHost = new URL(env.PSD_IMAGE_BASE_URL).hostname;
          if (
            parsedUrl.protocol !== "https:" ||
            parsedUrl.hostname !== expectedHost
          ) {
            return yield* Effect.fail(
              new SanityMutationError(
                `Image URL host not allowed: ${parsedUrl.hostname}`,
              ),
            );
          }

          // Fetch image from PSD with timeout and daily call counter
          const response = yield* Effect.tryPromise({
            try: async () => {
              const psdAbort = new AbortController();
              const psdTimeout = setTimeout(() => psdAbort.abort(), 10_000);

              // Count this PSD request in the daily counter (same logic as countedFetch).
              // Image downloads use fetch() directly so they bypass countedFetch — track them here.
              // Counter runs in finally so it increments even on timeout/network error.
              const d = new Date();
              const counterKey = `psd:calls:${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

              try {
                // The profilePictureURL already embeds a per-member profileAccessKey
                // query param that IS the auth token for this endpoint.
                // Sending the regular PSD API headers (x-api-key / Authorization)
                // alongside it causes a 404 — the image endpoint uses key-based auth
                // only, not the REST API credentials.
                return await fetch(imageUrl, {
                  signal: psdAbort.signal,
                  redirect: "follow",
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
            },
            catch: (cause) =>
              new SanityMutationError(
                `Failed to upload image for player ${psdId}`,
                cause,
              ),
          });

          yield* Effect.log(
            `[uploadPlayerImage] player=${psdId} psd_status=${response.status} content-type=${response.headers.get("content-type") ?? "(none)"} url=${imageUrl.split("?")[0]}`,
          );

          // 404 = player has no photo in PSD — skip silently
          if (response.status === 404) return;
          if (!response.ok) {
            return yield* Effect.fail(
              new SanityMutationError(
                `PSD image fetch failed: ${response.status} ${response.statusText}`,
              ),
            );
          }

          const contentType =
            response.headers.get("content-type") ?? "image/jpeg";
          const arrayBuffer = yield* Effect.tryPromise({
            try: () => response.arrayBuffer(),
            catch: (cause) =>
              new SanityMutationError(
                `Failed to read image body for player ${psdId}`,
                cause,
              ),
          });

          yield* Effect.log(
            `[uploadPlayerImage] player=${psdId} body_bytes=${arrayBuffer.byteLength} content-type=${contentType}`,
          );

          // Use REST API directly — client.assets.upload() uses Node.js internals
          // incompatible with Cloudflare Workers runtime.
          const uploadUrl = `https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/${env.SANITY_DATASET}?filename=player-psd-${psdId}.jpg`;
          const asset = yield* Effect.tryPromise({
            try: async () => {
              const sanityAbort = new AbortController();
              const sanityTimeout = setTimeout(
                () => sanityAbort.abort(),
                10_000,
              );
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
              const { document } = (await uploadRes.json()) as {
                document: { _id: string };
              };
              return document;
            },
            catch: (cause) =>
              new SanityMutationError(
                `Failed to upload image for player ${psdId}`,
                cause,
              ),
          });

          yield* Effect.log(
            `[uploadPlayerImage] player=${psdId} sanity_asset_id=${asset._id}`,
          );

          yield* Effect.tryPromise({
            try: () =>
              client
                .patch(docId("player", psdId))
                .set({
                  psdImage: {
                    _type: "image",
                    asset: { _type: "reference", _ref: asset._id },
                  },
                  // Store stable URL (path + ?v=N) for dedup comparison on future syncs.
                  // Must equal transformMember._psdImageUrl so needsUpload stabilizes.
                  psdImageUrl: stableUrl,
                })
                .commit(),
            catch: (cause) =>
              new SanityMutationError(
                `Failed to patch player ${psdId} with image`,
                cause,
              ),
          });

          yield* Effect.log(
            `[uploadPlayerImage] player=${psdId} patch committed — image upload complete`,
          );
        }).pipe(Effect.asVoid),

      archivePlayers: (psdIds) => archiveByPsdIds("player", psdIds),

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
          archived: false,
        }),

      upsertStaff: (doc) => {
        const fields: Record<string, unknown> = {
          psdId: doc.psdId,
          firstName: doc.firstName,
          lastName: doc.lastName,
          birthDate: doc.birthDate,
          archived: false,
        };
        if (doc.roleCode !== undefined) {
          fields["roleCode"] = doc.roleCode;
        }
        return upsert("staffMember", doc.psdId, fields);
      },

      archiveStaff: (psdIds) => archiveByPsdIds("staffMember", psdIds),

      archiveTeams: (psdIds) => archiveByPsdIds("team", psdIds),

      writeFeedback: (doc) =>
        Effect.tryPromise({
          try: () =>
            client.create({
              _type: "searchFeedback",
              pathSlug: doc.pathSlug,
              pathTitle: doc.pathTitle,
              vote: doc.vote,
            }),
          catch: (cause) =>
            new SanityMutationError("Failed to write search feedback", cause),
        }).pipe(Effect.asVoid),
    };
  }),
);
