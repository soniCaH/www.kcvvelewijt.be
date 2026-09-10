import { Effect, Either } from "effect";
import type {
  PsdClubStaffMember,
  PsdMember,
  PsdTeam,
} from "../psd/schemas-player-team";
import type {
  SanityPlayerDoc,
  SanityTeamDoc,
  SanityStaffDoc,
} from "../sanity/mutation";
import { SanityMutation, type SanityMutationError } from "../sanity/mutation";
import { SanityProjection } from "../sanity/projection";
import { PsdTeamClient } from "./psd-team-client";
import { WorkerEnvTag } from "../env";
import { extractStableImageUrl, needsUpload } from "./image-upload-utils";

/**
 * Convert a PSD member record into a Sanity-compatible player document and include the PSD image URL when present.
 *
 * @param psd - PSD member object (uses fields: id, firstName, lastName, birthDate, keeper, bestPosition, profilePictureURL)
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
 * Convert a PSD staff member record into a Sanity staffMember document and
 * include the PSD image URL when present (#2895), mirroring transformMember.
 * Only PSD-sourced fields are written — editorial fields (role, department,
 * parentMember, inOrganigram, roleLabel, responsibilities, photo) are never touched.
 *
 * Accepts both team-scoped `PsdMember` (has `profilePictureURL`) and club-wide
 * `PsdClubStaffMember` (does not — the quicksearch endpoint it comes from
 * carries no portrait). `profilePictureURL` is optional on the parameter type
 * for exactly that reason: passed a club-wide member, `_psdImageUrl` /
 * `_psdImageFetchUrl` come back `null` and the caller skips the upload.
 *
 * @param psd - PSD member object (uses fields: id, firstName, lastName, birthDate, functionTitle, profilePictureURL)
 * @param baseUrl - Base URL to prepend to `profilePictureURL` to form an absolute `_psdImageUrl`
 */
export function transformStaff(
  psd: Pick<
    PsdMember,
    "id" | "firstName" | "lastName" | "birthDate" | "functionTitle"
  > & { profilePictureURL?: string | null },
  baseUrl: string,
): SanityStaffDoc & {
  _psdImageUrl: string | null;
  _psdImageFetchUrl: string | null;
} {
  const profilePictureURL = psd.profilePictureURL ?? null;
  return {
    psdId: String(psd.id),
    firstName: psd.firstName,
    lastName: psd.lastName,
    birthDate: psd.birthDate ? psd.birthDate.split(" ")[0]! : null,
    functionTitle: psd.functionTitle,
    _psdImageUrl: extractStableImageUrl(profilePictureURL, baseUrl),
    // Full URL including ?profileAccessKey — required to actually fetch the image.
    _psdImageFetchUrl: profilePictureURL
      ? `${baseUrl}${profilePictureURL}`
      : null,
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

// ─── Reconciliation helper ───────────────────────────────────────────────────

/**
 * Safety threshold: refuse to archive if more than 30% of active entities
 * would be orphaned. In normal operation only 1–3 entities are orphaned per
 * cycle (roster changes). A higher ratio signals a data source problem
 * (e.g. PSD returning a partial list).
 */
export const MAX_ORPHAN_RATIO = 0.3;

export type ReconciliationResult =
  | { readonly action: "archived"; readonly orphanIds: string[] }
  | {
      readonly action: "skipped";
      readonly orphanCount: number;
      readonly activeCount: number;
      readonly ratio: number;
    }
  | { readonly action: "none" };

/**
 * Compare active Sanity IDs against accumulated PSD IDs and archive orphans,
 * unless the orphan ratio exceeds the safety threshold.
 */
export const reconcileEntity = <E>(
  type: string,
  activeIds: readonly string[],
  accumulatedIds: ReadonlySet<string>,
  archiveFn: (ids: string[]) => Effect.Effect<void, E>,
): Effect.Effect<ReconciliationResult, E> =>
  Effect.gen(function* () {
    const orphanIds = activeIds.filter((id) => !accumulatedIds.has(id));

    if (orphanIds.length === 0) {
      yield* Effect.log(`reconciliation: no orphan ${type} found`);
      return { action: "none" } as const;
    }

    const activeCount = activeIds.length;
    const ratio = orphanIds.length / activeCount;

    if (ratio > MAX_ORPHAN_RATIO) {
      yield* Effect.log(
        `reconciliation: SKIPPED — ${orphanIds.length}/${activeCount} ${type} would be archived (${Math.round(ratio * 100)}%), exceeds safety threshold of ${MAX_ORPHAN_RATIO * 100}%`,
      );
      return {
        action: "skipped",
        orphanCount: orphanIds.length,
        activeCount,
        ratio,
      } as const;
    }

    yield* archiveFn(orphanIds);
    yield* Effect.log(
      `reconciliation: archived ${orphanIds.length} ${type}: ${orphanIds.join(", ")}`,
    );
    return { action: "archived", orphanIds } as const;
  });

// ─── Member image sync ──────────────────────────────────────────────────────

/**
 * Upload a player's or staff member's PSD image if it needs one, mirroring
 * `uploadMemberImage`'s shared-body pattern in `sanity/mutation.ts` — one
 * body, `kind` picks the log prefix (`scripts/trigger-psd-sync.sh` greps
 * "player "/"staff " literally, so this must keep emitting exactly what the
 * two call sites used to write by hand).
 *
 * Returns whether the member is safe to checkpoint as done (#2900 review):
 * `true` when there was nothing to upload, the stored image already
 * matches, or the upload succeeded; `false` when the upload was attempted
 * and failed. A failed upload must NOT be checkpointed — the caller's
 * done-id set gates the next run's resume-skip, and skipping a member whose
 * image never actually landed would mean it never retries until this
 * team's full N-night rotation comes back around, a regression from the
 * pre-#2900 behaviour of retrying every night.
 */
export function syncMemberImage(
  kind: "player" | "staff",
  psdId: string,
  stableImageUrl: string | null,
  fetchImageUrl: string | null,
  existing: { psdImageUrl: string | null; hasPsdImage: boolean } | undefined,
  upload: (
    psdId: string,
    fetchUrl: string,
    stableUrl: string,
  ) => Effect.Effect<void, SanityMutationError>,
): Effect.Effect<boolean> {
  return Effect.gen(function* () {
    if (!stableImageUrl || !fetchImageUrl) {
      yield* Effect.log(
        `${kind} ${psdId}: no profilePictureURL from PSD — skipping image`,
      );
      return true;
    }

    const shouldUpload = needsUpload(
      stableImageUrl,
      existing?.hasPsdImage ? existing.psdImageUrl : null,
    );
    if (!shouldUpload) {
      yield* Effect.log(
        `${kind} ${psdId}: image up-to-date (hasPsdImage=${existing?.hasPsdImage}, storedUrl=${existing?.psdImageUrl ?? "null"})`,
      );
      return true;
    }

    yield* Effect.log(
      `${kind} ${psdId}: uploading image — hasPsdImage=${existing?.hasPsdImage ?? false}, storedUrl=${existing?.psdImageUrl ?? "null"}, newUrl=${stableImageUrl}`,
    );
    return yield* upload(psdId, fetchImageUrl, stableImageUrl).pipe(
      Effect.as(true),
      Effect.catchAll((e) =>
        Effect.log(
          `${kind} ${psdId}: image upload failed — ${e.message} | cause: ${String(e.cause)}`,
        ).pipe(Effect.as(false)),
      ),
    );
  });
}

// ─── Sync effect ──────────────────────────────────────────────────────────────

const CURSOR_KEY = "sync:team-cursor";
const CYCLE_PLAYER_IDS_KEY = "sync:cycle-player-ids";
const CYCLE_STAFF_IDS_KEY = "sync:cycle-staff-ids";
const CYCLE_TEAM_IDS_KEY = "sync:cycle-team-ids";

/**
 * Sub-cursor within the team the outer cursor currently points at (#2900).
 * Tracks which of the CURRENT team's players/staff have already been fully
 * committed to Sanity this pass, so a run cut off mid-team resumes with
 * bounded re-work instead of re-walking members that are already done.
 *
 * Scoped to `teamId` (not just "the current cursor position") so a stale
 * checkpoint from this team's *previous* rotation — N nights ago, once the
 * cursor has wrapped all the way back around — is never mistaken for
 * in-progress work: a `teamId` mismatch is always treated as no checkpoint.
 */
interface TeamCheckpoint {
  readonly teamId: number;
  readonly donePlayerIds: readonly string[];
  readonly doneStaffIds: readonly string[];
}

const CHECKPOINT_KEY = "sync:team-checkpoint";

/**
 * Runtime shape guard for a parsed checkpoint. JSON.parse only proves the
 * text was valid JSON, not that it has the shape this sync expects — a
 * value written by some future/other version of this key would parse fine
 * and then blow up `new Set(...)` on a non-array field (#2900 review).
 */
function isTeamCheckpoint(value: unknown): value is TeamCheckpoint {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const isStringArray = (a: unknown): a is string[] =>
    Array.isArray(a) && a.every((id) => typeof id === "string");
  return (
    typeof v.teamId === "number" &&
    isStringArray(v.donePlayerIds) &&
    isStringArray(v.doneStaffIds)
  );
}

/**
 * Parse a stored checkpoint, treating anything unparseable OR shape-invalid
 * as "none" — a corrupt or unrecognised value is a resumption hint gone
 * stale, not an error worth failing the sync over.
 */
function parseCheckpoint(raw: string | null): TeamCheckpoint | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isTeamCheckpoint(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * KV enforces at most one write per second per key. A member whose image is
 * already up to date finishes in well under that — flushing the checkpoint
 * on every member (the original #2900 design) meant writes 2..N inside the
 * same second got silently 429'd (swallowed by the write's own error log),
 * and the checkpoint stopped advancing without anything visibly failing
 * (#2900 review). Debouncing to this cadence keeps the flush rate under the
 * limit regardless of how many members complete per second.
 */
const CHECKPOINT_FLUSH_INTERVAL_MS = 1_100;

/**
 * Fetches all club teams from PSD and upserts ONE team per invocation using a
 * KV cursor. This keeps each Worker invocation well within the subrequest
 * budget regardless of plan tier. The cursor advances on every successful run
 * and wraps back to 0 after the last team, so all teams are covered in a full
 * rotation over N nightly cron invocations (N = number of teams).
 * Only PSD-sourced fields are written — editorial fields are never touched.
 *
 * Members are processed at concurrency 2 (unchanged from before #2900).
 * Checkpoint safety does not depend on that concurrency: the done-id sets
 * are mutated synchronously (JS has no true parallelism, so two members
 * "completing concurrently" still add to the Set as two ordered,
 * non-interleaved steps), and the actual KV write is (a) rate-limited to
 * `CHECKPOINT_FLUSH_INTERVAL_MS` and (b) serialized through a semaphore, so
 * two flushes racing on the network can never let an earlier, less-complete
 * snapshot land after a later, more-complete one.
 */
export const runSync = Effect.gen(function* () {
  const psd = yield* PsdTeamClient;
  const sanityWriter = yield* SanityMutation;
  const sanityReader = yield* SanityProjection;
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

  // Read the team-scoped checkpoint (#2900) — resolved against the actual
  // team only once it is known, below. A missing or unparseable value is
  // treated the same as "no checkpoint" (fresh start), never as an error:
  // this is a resumption hint, not a correctness-critical value.
  const checkpointStr = yield* Effect.tryPromise({
    try: () => env.PSD_CACHE.get(CHECKPOINT_KEY),
    catch: () => new Error("KV checkpoint read failed"),
  }).pipe(Effect.orElseSucceed(() => null));
  const storedCheckpoint = parseCheckpoint(checkpointStr);

  // Pre-fetch existing player image state to avoid redundant uploads
  yield* Effect.log("fetching player image state from Sanity");
  const imageState = yield* sanityReader.getPlayersImageState();
  yield* Effect.log(`player image state fetched: ${imageState.size} records`);

  // Same pre-fetch for staff (#2895) — one read for the whole run, not one
  // read per member, mirroring getPlayersImageState above.
  yield* Effect.log("fetching staff image state from Sanity");
  const staffImageState = yield* sanityReader.getStaffImageState();
  yield* Effect.log(
    `staff image state fetched: ${staffImageState.size} records`,
  );

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

  // Resume state (#2900): only trust the checkpoint when it names THIS team —
  // a checkpoint left over from this team's previous rotation (N nights ago)
  // must never be read as "already done" for a fresh pass.
  const resuming = storedCheckpoint?.teamId === team.id;
  const donePlayerIds = new Set<string>(
    resuming ? storedCheckpoint!.donePlayerIds : [],
  );
  const doneStaffIds = new Set<string>(
    resuming ? storedCheckpoint!.doneStaffIds : [],
  );
  if (resuming && (donePlayerIds.size > 0 || doneStaffIds.size > 0)) {
    yield* Effect.log(
      `team ${team.id}: resuming a truncated run — ${donePlayerIds.size} players and ${doneStaffIds.size} staff already committed this pass`,
    );
  }

  // Serializes checkpoint writes (#2900 review) so two flushes racing on the
  // network can never let a less-complete snapshot land after a
  // more-complete one — see the runSync doc comment.
  const checkpointLock = yield* Effect.makeSemaphore(1);
  // 0, not Date.now(): the FIRST flush after a member completes must always
  // go through immediately (an "always debounced" clock would let a whole
  // truncation window pass with nothing written at all).
  let lastCheckpointFlushAt = 0;

  /**
   * Write the current in-memory done-id sets to KV, rate-limited to
   * `CHECKPOINT_FLUSH_INTERVAL_MS` (KV allows at most one write/second/key —
   * see that constant's doc comment) unless `force` is set. `force` is used
   * once, at the very end of the team, to guarantee the final members'
   * progress is durable even if they completed inside the debounce window.
   */
  const flushCheckpoint = (force: boolean) =>
    checkpointLock.withPermits(1)(
      Effect.gen(function* () {
        const now = Date.now();
        if (
          !force &&
          now - lastCheckpointFlushAt < CHECKPOINT_FLUSH_INTERVAL_MS
        ) {
          return;
        }
        lastCheckpointFlushAt = now;
        yield* Effect.tryPromise({
          try: () =>
            env.PSD_CACHE.put(
              CHECKPOINT_KEY,
              JSON.stringify({
                teamId: team.id,
                donePlayerIds: [...donePlayerIds],
                doneStaffIds: [...doneStaffIds],
              } satisfies TeamCheckpoint),
            ),
          catch: () => new Error("KV checkpoint write failed"),
        }).pipe(
          Effect.catchAll((e) =>
            Effect.log(
              `checkpoint write failed — a truncated run may re-walk more members: ${String(e)}`,
            ),
          ),
        );
      }),
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

  const playersToProcess = players.filter(
    (m) => !donePlayerIds.has(String(m.id)),
  );
  if (playersToProcess.length < players.length) {
    yield* Effect.log(
      `team ${team.id}: skipping ${players.length - playersToProcess.length} already-committed players (resumed run)`,
    );
  }

  yield* Effect.forEach(
    playersToProcess,
    (m) =>
      Effect.gen(function* () {
        const doc = transformMember(m, imageBaseUrl);
        yield* sanityWriter.upsertPlayer(doc);

        const imageOk = yield* syncMemberImage(
          "player",
          doc.psdId,
          doc._psdImageUrl,
          doc._psdImageFetchUrl,
          imageState.get(doc.psdId),
          sanityWriter.uploadPlayerImage,
        );

        // Only checkpoint a member whose image genuinely landed (or needed
        // none) — see syncMemberImage's doc comment for why a failed upload
        // must not be marked done (#2900 review).
        if (imageOk) donePlayerIds.add(doc.psdId);
        yield* flushCheckpoint(false);
      }),
    { concurrency: 2 }, // low to avoid Sanity asset upload rate limit
  );

  const staffToProcess = staffMembers.filter(
    (m) => !doneStaffIds.has(String(m.id)),
  );
  if (staffToProcess.length < staffMembers.length) {
    yield* Effect.log(
      `team ${team.id}: skipping ${staffMembers.length - staffToProcess.length} already-committed staff (resumed run)`,
    );
  }

  yield* Effect.forEach(
    staffToProcess,
    (m) =>
      Effect.gen(function* () {
        const doc = transformStaff(m, imageBaseUrl);
        yield* sanityWriter.upsertStaff(doc);

        const imageOk = yield* syncMemberImage(
          "staff",
          doc.psdId,
          doc._psdImageUrl,
          doc._psdImageFetchUrl,
          staffImageState.get(doc.psdId),
          sanityWriter.uploadStaffImage,
        );

        if (imageOk) doneStaffIds.add(doc.psdId);
        yield* flushCheckpoint(false);
      }),
    { concurrency: 2 }, // low to avoid Sanity asset upload rate limit
  );

  // Final flush, forced: guarantees the last members' progress is durable
  // even if they completed inside the debounce window above (#2900 review).
  yield* flushCheckpoint(true);

  const playerPsdIds = players.map((m) => String(m.id));
  const staffPsdIds = staffMembers.map((m) => String(m.id));
  yield* sanityWriter.upsertTeam(
    transformTeam(team, playerPsdIds, staffPsdIds),
  );
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
    yield* Effect.log("cycle complete — running reconciliation");

    const activeInSanity = yield* sanityReader.getActivePlayerPsdIds();
    yield* reconcileEntity("players", activeInSanity, accumulatedIds, (ids) =>
      sanityWriter.archivePlayers(ids),
    );

    // Club-wide staff (team-less club functions: board members, general roles)
    // are never returned by /teams/{id}/staff, so without this fetch their IDs
    // are absent from accumulatedStaffIds and reconciliation would archive them.
    // Fetched once per cycle, here at cycle end, so their IDs are fresh for the
    // orphan check. On fetch failure we SKIP staff reconciliation entirely
    // rather than risk archiving team-less staff on a partial ID set.
    const reconcileStaffWithClubWide = (
      clubRaw: readonly PsdClubStaffMember[],
    ) =>
      Effect.gen(function* () {
        // The endpoint returns a system "Admin" account (id 1) with a blank
        // firstName — skip nameless/non-person rows so no junk staffMember doc
        // is created. status is always "staff" here but filter defensively.
        const clubStaff = clubRaw.filter(
          (m) => m.status === "staff" && m.firstName.trim() !== "",
        );
        // Team-attached staff were already upserted during their team's run;
        // only the genuinely team-less members still need writing.
        const toUpsert = clubStaff.filter(
          (m) => !accumulatedStaffIds.has(String(m.id)),
        );
        // No syncStaffImage call here (#2895 review): PsdClubStaffMember has
        // no profilePictureURL field, and it's an S.Class, so the field is
        // stripped even if the quicksearch endpoint started sending one —
        // the call could never do anything but log a skip line per member,
        // every cycle-end run. If that endpoint ever grows portrait support,
        // add `profilePictureURL` to PsdClubStaffMember first (schemas-
        // player-team.ts) and bring the call back here at the same
        // concurrency: 2 the team-scoped loop uses above, not 3.
        yield* Effect.forEach(
          toUpsert,
          (m) => sanityWriter.upsertStaff(transformStaff(m, imageBaseUrl)),
          { concurrency: 3 },
        );
        for (const m of clubStaff) accumulatedStaffIds.add(String(m.id));
        yield* Effect.log(
          `reconciliation: club-wide staff fetched — ${toUpsert.length} upserted, ${clubStaff.length} protected from archival`,
        );

        const activeStaffInSanity = yield* sanityReader.getActiveStaffPsdIds();
        const protectedStaffIds = yield* sanityReader.getProtectedStaffPsdIds();
        for (const id of protectedStaffIds) accumulatedStaffIds.add(id);
        if (protectedStaffIds.length > 0) {
          yield* Effect.log(
            `reconciliation: ${protectedStaffIds.length} staff protected by organigram/responsibility refs: ${protectedStaffIds.join(", ")}`,
          );
        }
        yield* reconcileEntity(
          "staff",
          activeStaffInSanity,
          accumulatedStaffIds,
          (ids) => sanityWriter.archiveStaff(ids),
        );
      });

    const clubStaffResult = yield* Effect.either(psd.getRawClubStaff());
    if (Either.isLeft(clubStaffResult)) {
      yield* Effect.log(
        `reconciliation: SKIPPED staff archival — club-wide staff fetch failed: ${String(clubStaffResult.left)}`,
      );
    } else {
      yield* reconcileStaffWithClubWide(clubStaffResult.right);
    }

    const activeTeamsInSanity = yield* sanityReader.getActiveTeamPsdIds();
    yield* reconcileEntity(
      "teams",
      activeTeamsInSanity,
      accumulatedTeamIds,
      (ids) => sanityWriter.archiveTeams(ids),
    );

    // Clear accumulation keys for next cycle (even when archival is skipped)
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

  // Team fully processed AND the cursor has moved on — only now clear the
  // checkpoint (#2900 review: this used to run right after `upsertTeam`,
  // before the accumulate writes / reconciliation / cursor write above. A
  // truncation anywhere in that tail would have deleted the one thing that
  // still named this team as in-progress while the cursor still pointed at
  // it, forcing exactly the full-team re-walk this PR removes). Deleting
  // last means a truncation before this point leaves a fully-populated,
  // all-done checkpoint behind — a same-team resume finds nothing left to
  // do and just re-runs this tail, which is idempotent. Not load-bearing
  // for correctness even so: the teamId guard earlier already discards a
  // checkpoint naming a different team, which is what the *next* team's run
  // would see if this delete itself got cut off.
  yield* Effect.tryPromise({
    try: () => env.PSD_CACHE.delete(CHECKPOINT_KEY),
    catch: () => new Error("KV checkpoint delete failed"),
  }).pipe(
    Effect.catchAll((e) =>
      Effect.log(
        `checkpoint delete failed — harmless, see comment: ${String(e)}`,
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
