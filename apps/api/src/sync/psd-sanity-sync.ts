import { Effect } from "effect";
import type { PsdMember, PsdTeam } from "@kcvv/api-contract";
import type { SanityPlayerDoc, SanityTeamDoc } from "../sanity/client";
import { SanityWriteClient } from "../sanity/client";
import { FootbalistoClient } from "../footbalisto/client";
import { WorkerEnvTag } from "../env";

/**
 * Convert a PSD member record into a Sanity-compatible player document and include the PSD image URL when present.
 *
 * @param psd - PSD member object (uses fields: id, firstName, lastName, birthDate, nationality, keeper, bestPosition, profilePictureURL)
 * @param baseUrl - Base URL to prepend to `profilePictureURL` to form an absolute `_psdImageUrl`
 * @returns A Sanity player document populated from the PSD member with an additional `_psdImageUrl` set to the absolute image URL or `null`
 */

export function transformMember(
  psd: PsdMember,
  baseUrl: string,
): SanityPlayerDoc & { _psdImageUrl: string | null } {
  return {
    psdId: String(psd.id),
    firstName: psd.firstName,
    lastName: psd.lastName,
    birthDate: psd.birthDate ? psd.birthDate.split(" ")[0]! : null, // strip time "HH:MM"
    nationality: psd.nationality,
    keeper: psd.keeper,
    positionPsd:
      typeof psd.bestPosition === "string"
        ? psd.bestPosition
        : psd.bestPosition !== null
          ? psd.bestPosition.type.name
          : null,
    _psdImageUrl: psd.profilePictureURL
      ? `${baseUrl}${psd.profilePictureURL}`
      : null,
  };
}

/**
 * Convert a PSD team object into a Sanity-compatible team document.
 *
 * @param psd - The PSD team object containing team metadata
 * @param playerPsdIds - Array of PSD player IDs to associate with the team
 * @returns A SanityTeamDoc containing mapped fields (psdId, name, slug, age, gender, footbelId) and the provided `playerPsdIds`
 */
export function transformTeam(
  psd: PsdTeam,
  playerPsdIds: string[],
): SanityTeamDoc {
  const slug = psd.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    psdId: String(psd.id),
    name: psd.name,
    slug,
    age: psd.age,
    gender: psd.gender,
    footbelId: psd.footbelId,
    playerPsdIds,
  };
}

// ─── Sync effect ──────────────────────────────────────────────────────────────

/**
 * Fetches all club teams + members from PSD and upserts into Sanity.
 * Teams are processed sequentially; players per team are upserted with concurrency 5.
 * Only PSD-sourced fields are written — editorial fields are never touched.
 */
export const runSync = Effect.gen(function* () {
  const psd = yield* FootbalistoClient;
  const sanity = yield* SanityWriteClient;
  const env = yield* WorkerEnvTag;
  const baseUrl = env.PSD_API_BASE_URL;

  yield* Effect.log("sync started");

  // Pre-fetch existing player image state to avoid redundant uploads
  yield* Effect.log("fetching player image state from Sanity");
  const imageState = yield* sanity.getPlayersImageState();
  yield* Effect.log(`player image state fetched: ${imageState.size} records`);

  yield* Effect.log("fetching teams from PSD");
  const teams = yield* psd.getRawTeams();
  yield* Effect.log(`teams fetched: ${teams.length} total`);

  yield* Effect.forEach(
    teams,
    (team) =>
      Effect.gen(function* () {
        yield* Effect.log(`team ${team.id} (${team.name}): fetching members`);
        const members = yield* psd.getRawMembers(team.id);
        const activePlayers = members.filter((m) => m.active);
        yield* Effect.log(
          `team ${team.id}: ${members.length} members, ${activePlayers.length} active`,
        );

        yield* Effect.forEach(
          activePlayers,
          (m) =>
            Effect.gen(function* () {
              const doc = transformMember(m, baseUrl);
              yield* sanity.upsertPlayer(doc);

              const newImageUrl = doc._psdImageUrl;
              if (newImageUrl) {
                const existing = imageState.get(doc.psdId);
                const needsUpload =
                  !existing?.hasPsdImage ||
                  existing.psdImageUrl !== newImageUrl;
                if (needsUpload) {
                  yield* Effect.log(`uploading image for player ${doc.psdId}`);
                  yield* sanity
                    .uploadPlayerImage(doc.psdId, newImageUrl)
                    .pipe(
                      Effect.catchAll((e) =>
                        Effect.log(
                          `image upload skipped for player ${doc.psdId}: ${e.message} | cause: ${String(e.cause)}`,
                        ),
                      ),
                    );
                }
              }
            }),
          { concurrency: 5 },
        );

        const playerPsdIds = activePlayers.map((m) => String(m.id));
        yield* sanity.upsertTeam(transformTeam(team, playerPsdIds));
        yield* Effect.log(`team ${team.id} (${team.name}): done`);
      }),
    { concurrency: 1 }, // teams sequentially to avoid rate limits
  );

  yield* Effect.log("sync completed successfully");
}).pipe(
  Effect.tapError((e) =>
    Effect.log(
      `Sync failed: ${String(e)} | cause: ${e instanceof Error && e.cause ? String(e.cause) : "none"}`,
    ),
  ),
  Effect.annotateLogs({ service: "psd-sanity-sync" }),
);
