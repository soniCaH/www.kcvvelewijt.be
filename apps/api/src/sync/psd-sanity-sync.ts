import { Effect } from "effect";
import type { PsdMember, PsdTeam } from "../footbalisto/schemas-player-team";
import type {
  SanityPlayerDoc,
  SanityTeamDoc,
  SanityStaffDoc,
} from "../sanity/client";
import { SanityWriteClient } from "../sanity/client";
import { PsdTeamClient } from "./psd-team-client";
import { WorkerEnvTag } from "../env";
import { extractStableImageUrl, needsUpload } from "./image-upload-utils";

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
): SanityPlayerDoc & {
  _psdImageUrl: string | null;
  _psdImageFetchUrl: string | null;
} {
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
    _psdImageUrl: extractStableImageUrl(psd.profilePictureURL, baseUrl),
    // Full URL including ?profileAccessKey — required to actually fetch the image.
    _psdImageFetchUrl: psd.profilePictureURL
      ? `${baseUrl}${psd.profilePictureURL}`
      : null,
  };
}

/**
 * Convert a PSD team object into a Sanity-compatible team document.
 *
 * @param psd - The PSD team object containing team metadata
 * @param playerPsdIds - Array of PSD player IDs to associate with the team
 * @param staffPsdIds - Array of PSD staff member IDs to associate with the team
 * @returns A SanityTeamDoc containing mapped fields (psdId, name, slug, age, gender, footbelId) and the provided player/staff IDs
 */
export function transformTeam(
  psd: PsdTeam,
  playerPsdIds: string[],
  staffPsdIds: string[],
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
    staffPsdIds,
  };
}

/**
 * Convert a PSD staff member record into a Sanity staffMember document.
 * Only PSD-sourced fields are written — editorial fields (role, department,
 * parentMember, inOrganigram, roleLabel, responsibilities, photo) are never touched.
 */
export function transformStaff(psd: PsdMember): SanityStaffDoc {
  return {
    psdId: String(psd.id),
    firstName: psd.firstName,
    lastName: psd.lastName,
    birthDate: psd.birthDate ? psd.birthDate.split(" ")[0]! : null,
    roleCode:
      psd.functionTitle && psd.functionTitle.length <= 6
        ? psd.functionTitle
        : undefined,
  };
}

// ─── Member partitioning ──────────────────────────────────────────────────────

/**
 * Split a raw PSD member list into players and staff by explicit status match.
 * Members with unknown statuses are returned separately so the caller can log
 * and skip them — they must never be upserted as players or staff.
 *
 * Note: `active` is intentionally ignored — in PSD it means "has logged in to
 * the platform", not club membership status.
 */
export function partitionMembers(members: readonly PsdMember[]): {
  players: readonly PsdMember[];
  staff: readonly PsdMember[];
  unknown: readonly PsdMember[];
} {
  const players: PsdMember[] = [];
  const staff: PsdMember[] = [];
  const unknown: PsdMember[] = [];
  for (const m of members) {
    if (m.status === "speler") players.push(m);
    else if (m.status === "staff") staff.push(m);
    else unknown.push(m);
  }
  return { players, staff, unknown };
}

// ─── Sync effect ──────────────────────────────────────────────────────────────

const CURSOR_KEY = "sync:team-cursor";
const CYCLE_PLAYER_IDS_KEY = "sync:cycle-player-ids";
const CYCLE_STAFF_IDS_KEY = "sync:cycle-staff-ids";
const CYCLE_TEAM_IDS_KEY = "sync:cycle-team-ids";

/**
 * Fetches all club teams from PSD and upserts ONE team per invocation using a
 * KV cursor. This keeps each Worker invocation well within the subrequest
 * budget regardless of plan tier. The cursor advances on every successful run
 * and wraps back to 0 after the last team, so all teams are covered in a full
 * rotation over N nightly cron invocations (N = number of teams).
 * Only PSD-sourced fields are written — editorial fields are never touched.
 */
export const runSync = Effect.gen(function* () {
  const psd = yield* PsdTeamClient;
  const sanity = yield* SanityWriteClient;
  const env = yield* WorkerEnvTag;
  // PSD serves images from the club subdomain (PSD_IMAGE_BASE_URL), not the
  // API domain (PSD_API_BASE_URL). profilePictureURL is a relative path.
  const imageBaseUrl = env.PSD_IMAGE_BASE_URL;

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

  if (teams.length === 0) {
    yield* Effect.log("no teams found — skipping sync");
    return;
  }

  const teamIndex = cursor % teams.length;
  const team = teams[teamIndex]!;

  yield* Effect.log(
    `processing team ${teamIndex + 1}/${teams.length}: ${team.id} (${team.name})`,
  );

  const [members, staffMembers] = yield* Effect.all(
    [psd.getRawMembers(team.id), psd.getRawStaff(team.id)],
    { concurrency: 2 },
  );
  const { players, unknown } = partitionMembers(members);
  yield* Effect.log(
    `team ${team.id}: ${players.length} players, ${staffMembers.length} staff`,
  );
  if (unknown.length > 0) {
    yield* Effect.log(
      `team ${team.id}: ${unknown.length} members with unknown status skipped: ${unknown.map((m) => `${m.id}(${m.status})`).join(", ")}`,
    );
  }

  const playersWithImage = players.filter((m) => m.profilePictureURL);
  yield* Effect.log(
    `team ${team.id}: ${playersWithImage.length}/${players.length} players have a profilePictureURL from PSD`,
  );

  yield* Effect.forEach(
    players,
    (m) =>
      Effect.gen(function* () {
        const doc = transformMember(m, imageBaseUrl);
        yield* sanity.upsertPlayer(doc);

        const stableImageUrl = doc._psdImageUrl;
        const fetchImageUrl = doc._psdImageFetchUrl;
        if (!stableImageUrl || !fetchImageUrl) {
          yield* Effect.log(
            `player ${doc.psdId}: no profilePictureURL from PSD — skipping image`,
          );
          return;
        }

        const existing = imageState.get(doc.psdId);
        const shouldUpload = needsUpload(
          stableImageUrl,
          existing?.hasPsdImage ? existing.psdImageUrl : null,
        );

        if (!shouldUpload) {
          yield* Effect.log(
            `player ${doc.psdId}: image up-to-date (hasPsdImage=${existing?.hasPsdImage}, storedUrl=${existing?.psdImageUrl ?? "null"})`,
          );
          return;
        }

        yield* Effect.log(
          `player ${doc.psdId}: uploading image — hasPsdImage=${existing?.hasPsdImage ?? false}, storedUrl=${existing?.psdImageUrl ?? "null"}, newUrl=${stableImageUrl}`,
        );
        yield* sanity
          .uploadPlayerImage(doc.psdId, fetchImageUrl, stableImageUrl)
          .pipe(
            Effect.catchAll((e) =>
              Effect.log(
                `player ${doc.psdId}: image upload failed — ${e.message} | cause: ${String(e.cause)}`,
              ),
            ),
          );
      }),
    { concurrency: 2 }, // low to avoid Sanity asset upload rate limit
  );

  yield* Effect.forEach(
    staffMembers,
    (m) => sanity.upsertStaff(transformStaff(m)),
    { concurrency: 3 },
  );

  const playerPsdIds = players.map((m) => String(m.id));
  const staffPsdIds = staffMembers.map((m) => String(m.id));
  yield* sanity.upsertTeam(transformTeam(team, playerPsdIds, staffPsdIds));
  yield* Effect.log(`team ${team.id} (${team.name}): done`);

  // ─── Accumulate player PSD IDs in KV ─────────────────────────────────
  const existingIds = yield* Effect.tryPromise({
    try: async () => {
      const json = await env.PSD_CACHE.get(CYCLE_PLAYER_IDS_KEY);
      if (json === null) return [] as string[];
      return JSON.parse(json) as string[];
    },
    catch: (cause) =>
      new Error(
        `KV read/parse failed for ${CYCLE_PLAYER_IDS_KEY}: ${String(cause)}`,
      ),
  });

  const accumulatedIds = new Set<string>(existingIds);
  for (const id of playerPsdIds) accumulatedIds.add(id);

  yield* Effect.tryPromise({
    try: () =>
      env.PSD_CACHE.put(
        CYCLE_PLAYER_IDS_KEY,
        JSON.stringify([...accumulatedIds]),
      ),
    catch: () => new Error("KV write failed"),
  });

  // ─── Accumulate staff PSD IDs in KV ─────────────────────────────────
  const existingStaffIds = yield* Effect.tryPromise({
    try: async () => {
      const json = await env.PSD_CACHE.get(CYCLE_STAFF_IDS_KEY);
      if (json === null) return [] as string[];
      return JSON.parse(json) as string[];
    },
    catch: (cause) =>
      new Error(
        `KV read/parse failed for ${CYCLE_STAFF_IDS_KEY}: ${String(cause)}`,
      ),
  });

  const accumulatedStaffIds = new Set<string>(existingStaffIds);
  for (const id of staffPsdIds) accumulatedStaffIds.add(id);

  yield* Effect.tryPromise({
    try: () =>
      env.PSD_CACHE.put(
        CYCLE_STAFF_IDS_KEY,
        JSON.stringify([...accumulatedStaffIds]),
      ),
    catch: () => new Error("KV write failed"),
  });

  // ─── Accumulate team PSD IDs in KV ──────────────────────────────────
  const existingTeamIds = yield* Effect.tryPromise({
    try: async () => {
      const json = await env.PSD_CACHE.get(CYCLE_TEAM_IDS_KEY);
      if (json === null) return [] as string[];
      return JSON.parse(json) as string[];
    },
    catch: (cause) =>
      new Error(
        `KV read/parse failed for ${CYCLE_TEAM_IDS_KEY}: ${String(cause)}`,
      ),
  });

  const accumulatedTeamIds = new Set<string>(existingTeamIds);
  accumulatedTeamIds.add(String(team.id));

  yield* Effect.tryPromise({
    try: () =>
      env.PSD_CACHE.put(
        CYCLE_TEAM_IDS_KEY,
        JSON.stringify([...accumulatedTeamIds]),
      ),
    catch: () => new Error("KV write failed"),
  });

  // Compute next cursor (wraps at end of team list)
  const nextCursor = (teamIndex + 1) % teams.length;

  // ─── Reconciliation at cycle end ─────────────────────────────────────
  if (nextCursor === 0) {
    yield* Effect.log("cycle complete — running player reconciliation");
    const activeInSanity = yield* sanity.getActivePlayerPsdIds();
    const orphanIds = activeInSanity.filter((id) => !accumulatedIds.has(id));

    if (orphanIds.length > 0) {
      yield* sanity.archivePlayers(orphanIds);
      yield* Effect.log(
        `reconciliation: archived ${orphanIds.length} players: ${orphanIds.join(", ")}`,
      );
    } else {
      yield* Effect.log("reconciliation: no orphan players found");
    }

    // ─── Staff reconciliation ─────────────────────────────────────────
    yield* Effect.log("running staff reconciliation");
    const activeStaffInSanity = yield* sanity.getActiveStaffPsdIds();
    const orphanStaffIds = activeStaffInSanity.filter(
      (id) => !accumulatedStaffIds.has(id),
    );

    if (orphanStaffIds.length > 0) {
      yield* sanity.archiveStaff(orphanStaffIds);
      yield* Effect.log(
        `reconciliation: archived ${orphanStaffIds.length} staff: ${orphanStaffIds.join(", ")}`,
      );
    } else {
      yield* Effect.log("reconciliation: no orphan staff found");
    }

    // ─── Team reconciliation ──────────────────────────────────────────
    yield* Effect.log("running team reconciliation");
    const activeTeamsInSanity = yield* sanity.getActiveTeamPsdIds();
    const orphanTeamIds = activeTeamsInSanity.filter(
      (id) => !accumulatedTeamIds.has(id),
    );

    if (orphanTeamIds.length > 0) {
      yield* sanity.archiveTeams(orphanTeamIds);
      yield* Effect.log(
        `reconciliation: archived ${orphanTeamIds.length} teams: ${orphanTeamIds.join(", ")}`,
      );
    } else {
      yield* Effect.log("reconciliation: no orphan teams found");
    }

    // Clear accumulation keys for next cycle
    yield* Effect.tryPromise({
      try: () =>
        Promise.all([
          env.PSD_CACHE.delete(CYCLE_PLAYER_IDS_KEY),
          env.PSD_CACHE.delete(CYCLE_STAFF_IDS_KEY),
          env.PSD_CACHE.delete(CYCLE_TEAM_IDS_KEY),
        ]),
      catch: () => new Error("KV delete failed"),
    });
  }

  // Advance cursor only after reconciliation succeeds (if applicable)
  yield* Effect.tryPromise({
    try: () => env.PSD_CACHE.put(CURSOR_KEY, String(nextCursor)),
    catch: () => new Error("KV cursor write failed"),
  }).pipe(
    Effect.catchAll((e) =>
      Effect.log(
        `cursor write failed — next run will re-read the stored value (or 0 if missing): ${String(e)}`,
      ),
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
