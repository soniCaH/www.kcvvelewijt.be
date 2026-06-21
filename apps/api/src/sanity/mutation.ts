import { createClient } from "@sanity/client";
import { Context, Effect, Layer } from "effect";
import { WorkerEnvTag } from "../env";
import { KvCacheService } from "../cache/kv-cache";
import { sanityClientConfig } from "./config";

/**
 * SHA-1 (hex, lowercase, 40 chars) of PSD's "no image available" placeholder
 * image bytes. Sanity asset _ids embed this same SHA-1 — the placeholder
 * asset currently uploaded to staging is
 * `image-6607821528ffa87bb0d39b159a7a4aa81dc78683-350x350-jpg` and
 * production carries the same bytes → same hash, so the constant works for
 * both datasets.
 *
 * Used by `uploadPlayerImage` to skip the placeholder during sync (#1895)
 * so the Phase 6.A `<PlayerHero>` illustration fallback fires correctly.
 */
export const PSD_PLACEHOLDER_IMAGE_SHA1 =
  "6607821528ffa87bb0d39b159a7a4aa81dc78683";

// ─── Document shapes written to Sanity ───────────────────────────────────────

export interface SanityPlayerDoc {
  psdId: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null; // "YYYY-MM-DD" (time component stripped from PSD)
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
  functionTitle: string | null; // from PSD functionTitle; null clears the stored value
}

/** Public membership-intake submission, persisted before email dispatch. */
export interface SanityMembershipApplicationDoc {
  role: string;
  firstName: string;
  lastName: string;
  birthDate: string; // "YYYY-MM-DD"
  gender: string;
  municipality: string;
  email: string;
  priorClub?: string;
  isMinor: boolean;
  parentEmail?: string;
  parentalConsent: boolean;
  medicalCertAcknowledged: boolean;
  privacyAccepted: boolean;
  submittedAt: string; // ISO timestamp set by the BFF
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

export type { PlayerImageState } from "./types";

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
  /** Create a membershipApplication document (status defaults to "new"). */
  readonly writeMembershipApplication: (
    doc: SanityMembershipApplicationDoc,
  ) => Effect.Effect<void, SanityMutationError>;
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
    const cache = yield* KvCacheService;
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

          // Fetch image from PSD with timeout. Image downloads use fetch()
          // directly so they bypass countedFetch — the daily PSD-call counter
          // is incremented via Effect.ensuring below, so it ticks even on
          // timeout/network error.
          const response = yield* Effect.tryPromise({
            try: async () => {
              const psdAbort = new AbortController();
              const psdTimeout = setTimeout(() => psdAbort.abort(), 10_000);

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
              }
            },
            catch: (cause) =>
              new SanityMutationError(
                `Failed to upload image for player ${psdId}`,
                cause,
              ),
          }).pipe(Effect.ensuring(cache.increment()));

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

          // PSD's "no image available" placeholder slips through this code
          // path: PSD returns it as a real image (HTTP 200, valid JPEG bytes)
          // for any player that lacks a real photo, so the previous early
          // 404 guard doesn't catch it. Sanity's asset deduplication means
          // every placeholder upload across syncs lands on the same asset
          // ref — every affected player ends up sharing one common
          // `image-<sha1>-...` id. We detect by computing SHA-1 of the
          // bytes and matching against the known placeholder hash.
          //
          // Phase 6.A design (lock 6.d2) requires the player profile photo
          // column to be EITHER a real player photo OR the canonical
          // `<PlayerFigure>` illustration fallback — never the silhouette.
          // Skipping the upload here keeps `psdImage` unset on those
          // players so the fallback fires correctly.
          //
          // Issue #1895 / originating screenshot: Memphis Vercammen.
          const sha1Buffer = yield* Effect.tryPromise({
            try: () => crypto.subtle.digest("SHA-1", arrayBuffer),
            catch: (cause) =>
              new SanityMutationError(
                `Failed to hash image bytes for player ${psdId}`,
                cause,
              ),
          });
          const sha1Hex = Array.from(new Uint8Array(sha1Buffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          if (sha1Hex === PSD_PLACEHOLDER_IMAGE_SHA1) {
            yield* Effect.log(
              `[uploadPlayerImage] player=${psdId} bytes match PSD "no image available" placeholder (sha1=${sha1Hex}) — skipping upload and patch so PlayerHero illustration fallback fires`,
            );
            return;
          }

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
        Effect.gen(function* () {
          const id = docId("team", doc.psdId);

          // Read existing doc to preserve editorial `role` values and capture _rev for conflict detection
          const existing = yield* Effect.tryPromise({
            try: () => client.getDocument(id),
            catch: (cause) =>
              new SanityMutationError(
                `Failed to read existing team ${doc.psdId}`,
                cause,
              ),
          });

          const existingStaff =
            (existing?.staff as
              | Array<{
                  _key?: string;
                  member?: { _ref?: string };
                  role?: string;
                }>
              | undefined) ?? [];
          const existingRev = existing?._rev as string | undefined;

          // Build a lookup from staff member ref → existing role
          const existingRoleByRef = new Map<string, string>();
          for (const entry of existingStaff) {
            if (entry.member?._ref && entry.role) {
              existingRoleByRef.set(entry.member._ref, entry.role);
            }
          }

          const staffArray = doc.staffPsdIds.map((id) => {
            const ref = `staffMember-psd-${id}`;
            const existingRole = existingRoleByRef.get(ref);
            return {
              _key: id,
              _type: "object",
              member: {
                _type: "reference",
                _ref: ref,
              },
              ...(existingRole && { role: existingRole }),
            };
          });

          const psdFields = {
            psdId: doc.psdId,
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
            staff: staffArray,
            archived: false,
          };

          // Use ifRevisionId when document exists to detect concurrent edits
          yield* Effect.tryPromise({
            try: () => {
              const tx = client
                .transaction()
                .createIfNotExists({ _id: id, _type: "team", psdId: doc.psdId })
                .patch(id, (p) =>
                  existingRev
                    ? p.ifRevisionId(existingRev).set(psdFields)
                    : p.set(psdFields),
                );
              return tx.commit();
            },
            catch: (cause) =>
              new SanityMutationError(
                `Failed to upsert team ${doc.psdId}`,
                cause,
              ),
          });
        }).pipe(Effect.asVoid),

      upsertStaff: (doc) =>
        upsert("staffMember", doc.psdId, {
          psdId: doc.psdId,
          firstName: doc.firstName,
          lastName: doc.lastName,
          birthDate: doc.birthDate,
          functionTitle: doc.functionTitle,
          archived: false,
        }),

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

      writeMembershipApplication: (doc) =>
        Effect.tryPromise({
          try: () =>
            client.create({
              _type: "membershipApplication",
              status: "new",
              role: doc.role,
              firstName: doc.firstName,
              lastName: doc.lastName,
              birthDate: doc.birthDate,
              gender: doc.gender,
              municipality: doc.municipality,
              email: doc.email,
              ...(doc.priorClub ? { priorClub: doc.priorClub } : {}),
              isMinor: doc.isMinor,
              ...(doc.parentEmail ? { parentEmail: doc.parentEmail } : {}),
              parentalConsent: doc.parentalConsent,
              medicalCertAcknowledged: doc.medicalCertAcknowledged,
              privacyAccepted: doc.privacyAccepted,
              submittedAt: doc.submittedAt,
            }),
          catch: (cause) =>
            new SanityMutationError(
              "Failed to write membership application",
              cause,
            ),
        }).pipe(Effect.asVoid),
    };
  }),
);
