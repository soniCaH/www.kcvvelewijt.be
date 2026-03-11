import { Effect } from "effect";
import type { PsdMember, PsdTeam } from "@kcvv/api-contract";
import type {
  SanityPlayerDoc,
  SanityTeamDoc,
  SanityStaffDoc,
} from "../sanity/client";
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
    // Strip the rotating ?profileAccessKey query param so the stored URL stays
    // stable across syncs — the path alone uniquely identifies the player photo.
    _psdImageUrl: psd.profilePictureURL
      ? `${baseUrl}${psd.profilePictureURL.split("?")[0]}`
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

/**
 * Convert a PSD staff member record into a Sanity staffMember document.
 * Only PSD-sourced fields are written — editorial fields (role, department,
 * parentMember, inOrganigram, positionTitle, responsibilities, photo) are never touched.
 */
export function transformStaff(psd: PsdMember): SanityStaffDoc {
  return {
    psdId: String(psd.id),
    firstName: psd.firstName,
    lastName: psd.lastName,
    birthDate: psd.birthDate ? psd.birthDate.split(" ")[0]! : null,
    positionShort:
      psd.functionTitle && psd.functionTitle.length <= 6
        ? psd.functionTitle
        : undefined,
  };
}

// ─── Sync effect ──────────────────────────────────────────────────────────────

const CURSOR_KEY = "sync:team-cursor";

/**
 * Fetches all club teams from PSD and upserts ONE team per invocation using a
 * KV cursor. This keeps each Worker invocation well within the subrequest
 * budget regardless of plan tier. The cursor advances on every successful run
 * and wraps back to 0 after the last team, so all teams are covered in a full
 * rotation over N nightly cron invocations (N = number of teams).
 * Only PSD-sourced fields are written — editorial fields are never touched.
 */
export const runSync = Effect.gen(function* () {
  const psd = yield* FootbalistoClient;
  const sanity = yield* SanityWriteClient;
  const env = yield* WorkerEnvTag;
  const baseUrl = env.PSD_API_BASE_URL;

  yield* Effect.log("sync started");

  // Read cursor from KV (defaults to 0 if missing or unreadable)
  const cursorStr = yield* Effect.tryPromise({
    try: () => env.PSD_CACHE.get(CURSOR_KEY),
    catch: () => new Error("KV cursor read failed"),
  }).pipe(Effect.orElseSucceed(() => null));
  const cursor = Number(cursorStr ?? "0");

  // Pre-fetch existing player image state to avoid redundant uploads
  yield* Effect.log("fetching player image state from Sanity");
  const imageState = yield* sanity.getPlayersImageState();
  yield* Effect.log(`player image state fetched: ${imageState.size} records`);

  yield* Effect.log("fetching teams from PSD");
  const teams = yield* psd.getRawTeams();
  yield* Effect.log(`teams fetched: ${teams.length} total`);

  const teamIndex = cursor % teams.length;
  const team = teams[teamIndex]!;

  yield* Effect.log(
    `processing team ${teamIndex + 1}/${teams.length}: ${team.id} (${team.name})`,
  );

  const members = yield* psd.getRawMembers(team.id);
  const activePlayers = members.filter((m) => m.active && m.status !== "staff");
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
            !existing?.hasPsdImage || existing.psdImageUrl !== newImageUrl;
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

  const staffMembers = members.filter((m) => m.status === "staff" && m.active);
  yield* Effect.log(`team ${team.id}: ${staffMembers.length} staff members`);
  yield* Effect.forEach(
    staffMembers,
    (m) => sanity.upsertStaff(transformStaff(m)),
    { concurrency: 3 },
  );

  const playerPsdIds = activePlayers.map((m) => String(m.id));
  yield* sanity.upsertTeam(transformTeam(team, playerPsdIds));
  yield* Effect.log(`team ${team.id} (${team.name}): done`);

  // Advance cursor for next invocation (wraps at end of team list)
  const nextCursor = (teamIndex + 1) % teams.length;
  yield* Effect.tryPromise({
    try: () => env.PSD_CACHE.put(CURSOR_KEY, String(nextCursor)),
    catch: () => new Error("KV cursor write failed"),
  }).pipe(
    Effect.catchAll((e) =>
      Effect.log(`cursor not persisted — will restart from 0: ${String(e)}`),
    ),
  );

  yield* Effect.log(
    `sync completed — cursor advanced to ${nextCursor} (next: team index ${nextCursor})`,
  );
}).pipe(
  Effect.tapError((e) =>
    Effect.log(
      `Sync failed: ${String(e)} | cause: ${e instanceof Error && e.cause ? String(e.cause) : "none"}`,
    ),
  ),
  Effect.annotateLogs({ service: "psd-sanity-sync" }),
);
