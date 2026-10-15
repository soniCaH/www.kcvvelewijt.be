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
import { KvCacheService, KvError } from "../cache/kv-cache";
import { extractStableImageUrl, needsUpload } from "./image-upload-utils";
import { reconcileOrphans } from "../reconciliation";

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
 * unless the orphan ratio exceeds the safety threshold. A thin adapter over
 * the shared `reconcileOrphans` helper (#2854) — the four-step shape
 * (diff / none-case / ratio cap / act) now lives there, shared with
 * `search/sanity-index-sync.ts`.
 *
 * `archiveFn` stays void-returning: a Sanity archive mutation is
 * all-or-nothing (it either patches every requested id or fails the whole
 * call), so on success every orphan is confirmed archived — unlike
 * Vectorize's batched, partially-retriable delete on the search-index side.
 *
 * `ratioThreshold` defaults to `MAX_ORPHAN_RATIO`, matching every call site
 * before this refactor; `floor` is not exposed here and stays at
 * `reconcileOrphans`'s default of 0 — this is the compatibility guarantee
 * for the three production callers below. `floor: 0` means `max(0, active ×
 * ratioThreshold)` is mathematically identical to the bare ratio check
 * these callers always had — this refactor does NOT change their latching
 * behaviour. What changed is that a stuck refusal now has a release lever
 * (see apps/api/CLAUDE.md, "Releasing a stuck PSD sync orphan-cap
 * refusal").
 */
export const reconcileEntity = <E>(
  type: string,
  activeIds: readonly string[],
  accumulatedIds: ReadonlySet<string>,
  archiveFn: (ids: string[]) => Effect.Effect<void, E>,
  ratioThreshold: number = MAX_ORPHAN_RATIO,
): Effect.Effect<ReconciliationResult, E> =>
  reconcileOrphans(
    type,
    activeIds,
    accumulatedIds,
    (ids) => archiveFn(ids).pipe(Effect.as(ids)),
    {
      ratioThreshold,
      releaseLeverHint:
        'see apps/api/CLAUDE.md ("Releasing a stuck PSD sync orphan-cap refusal") for the release lever once a genuine removal has been confirmed.',
    },
  ).pipe(
    Effect.map((result): ReconciliationResult => {
      switch (result.action) {
        case "none":
          return { action: "none" };
        case "skipped":
          return {
            action: "skipped",
            orphanCount: result.orphanCount,
            activeCount: result.activeCount,
            ratio: result.ratio,
          };
        case "removed":
          return { action: "archived", orphanIds: [...result.confirmedIds] };
      }
    }),
  );

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
 * Marker for a team whose PSD roster came back empty while Sanity still
 * lists players for it (#3465). One empty reading is not trusted — PSD
 * returning `[]` for a populated team has happened; a second consecutive
 * empty visit is. Cleared ONLY on a non-empty roster or once the empty
 * roster has been trusted.
 */
const emptyRosterKey = (teamId: number) => `sync:empty-roster:${teamId}`;

/**
 * Raised AFTER a team pass finished and the cursor moved on, so the job
 * alert fires (`reportScheduledJobOutcome` only sees ok/fail) without the
 * failing member or team fetch blocking the rotation forever (#3465).
 */
export class SyncIncompleteError extends Error {
  readonly _tag = "SyncIncompleteError" as const;
  constructor(readonly failures: readonly string[]) {
    super(`sync finished with failures: ${failures.join("; ")}`);
    this.name = "SyncIncompleteError";
  }
}

/**
 * PSD staff the sync must never write to Sanity. For people who must leave
 * the site but stay in PSD (they keep their login, or the removal is temporary).
 * Deleting or archiving their Sanity doc alone does not hold: the next run
 * recreates it, or resets `archived: false`. Skipped on both the
 * team-scoped and the club-wide path, and left out of every team's
 * `staffPsdIds`.
 * After adding an id here, delete (permanent) or archive (temporary) the
 * person's `staffMember-psd-<id>` doc and unlink its references by hand.
 * Removing an id later lets the next run write the person back, with
 * `archived: false`.
 */
const SYNC_EXCLUDED_STAFF_PSD_IDS: ReadonlySet<string> = new Set([
  "257", // removed for good, at their request
  "10061", // temporary — remove this line when it ends
]);
const isSyncExcludedStaff = (m: { readonly id: number }) =>
  SYNC_EXCLUDED_STAFF_PSD_IDS.has(String(m.id));

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
 * Release lever for a stuck orphan-reconciliation safety cap (#2854),
 * mirroring `search/sanity-index-sync.ts`'s manifest-delete lever
 * documented in apps/api/CLAUDE.md under "Releasing a stuck prune safety
 * cap". PSD sync has no persisted manifest to delete — its cap is
 * recomputed fresh every cycle from the current Sanity/PSD id sets, not
 * from stored state — so there is nothing to reset. What it needs instead
 * is a one-shot bypass: set this key to skip the ratio cap on the NEXT
 * cycle-end reconciliation only, then it's cleared.
 *
 * The value SCOPES which entity type(s) the bypass applies to — an
 * operator who investigated and confirmed a genuine PLAYERS refusal has
 * verified nothing about that cycle's team/staff fetch, so a blanket
 * bypass would also wave through an unrelated, uninvestigated staff or
 * team refusal in the same cycle (#2854 review). Value is a
 * comma-separated list of `"players"`, `"staff"`, `"teams"`, or the
 * literal `"all"` (also accepted: `"1"`, for a quick `wrangler kv key put
 * … 1` blanket override) to bypass every type.
 *
 * The key is READ AND DELETED upfront, before any reconcile leg runs, not
 * after — this is a deliberate choice over "delete only once a bypass
 * actually applied": PSD sync's own three legs can each independently
 * fail or be skipped (a failed club-wide staff fetch skips staff
 * reconciliation entirely; an archive call can itself fail), and there is
 * no single point after all three where "did every intended bypass apply"
 * can be answered cheaply. Consuming the key on OBSERVATION rather than
 * on confirmed application keeps the one-shot guarantee unconditional — it
 * never survives a failure downstream and silently leaves the cap
 * disabled for a future cycle — at the cost that a cycle whose staff leg
 * gets skipped (club-wide fetch failure) still consumes a staff-scoped
 * override without ever evaluating the staff cap. That is logged
 * explicitly below so an operator knows to re-arm it.
 */
const ORPHAN_CAP_OVERRIDE_KEY = "sync:orphan-cap-override";

type OrphanCapOverrideScope = "players" | "staff" | "teams";

const ORPHAN_CAP_OVERRIDE_SCOPES: readonly OrphanCapOverrideScope[] = [
  "players",
  "staff",
  "teams",
];

/**
 * Parse the override key's raw value into the set of entity types it
 * bypasses this cycle. An unrecognised value parses to an empty set
 * (bypasses nothing) rather than failing the sync — a typo'd override
 * should never take down the sync, only fail to release anything.
 */
function parseOrphanCapOverride(
  raw: string | null,
): ReadonlySet<OrphanCapOverrideScope> {
  if (raw === null) return new Set();
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "") return new Set();
  if (trimmed === "all" || trimmed === "1") {
    return new Set(ORPHAN_CAP_OVERRIDE_SCOPES);
  }
  const requested = new Set(trimmed.split(",").map((s) => s.trim()));
  return new Set(
    ORPHAN_CAP_OVERRIDE_SCOPES.filter((scope) => requested.has(scope)),
  );
}

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
  const cache = yield* KvCacheService;
  // PSD serves images from the club subdomain (PSD_IMAGE_BASE_URL), not the
  // API domain (PSD_API_BASE_URL). profilePictureURL is a relative path.
  const imageBaseUrl = env.PSD_IMAGE_BASE_URL;

  yield* Effect.log("sync started");

  // Read cursor from KV (defaults to 0 if missing or unreadable)
  const cursorStr = yield* cache.durable
    .get(CURSOR_KEY)
    .pipe(Effect.orElseSucceed(() => null));
  const cursor = Number(cursorStr ?? "0");

  // Read the team-scoped checkpoint (#2900) — resolved against the actual
  // team only once it is known, below. A missing or unparseable value is
  // treated the same as "no checkpoint" (fresh start), never as an error:
  // this is a resumption hint, not a correctness-critical value.
  const checkpointStr = yield* cache.durable
    .get(CHECKPOINT_KEY)
    .pipe(Effect.orElseSucceed(() => null));
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
  const liveTeams = yield* psd.getRawTeams();
  yield* Effect.log(`teams fetched: ${liveTeams.length} total`);
  // The cursor is a position, so it needs an order that survives PSD
  // removing or reordering teams between nights: numeric id, not response
  // order (#3465). `scripts/trigger-psd-sync.sh`'s index is a position in
  // THIS order.
  const teams = [...liveTeams].sort((a, b) => a.id - b.id);
  // Hand-run (`scripts/trigger-psd-sync.sh`): never touch cycle-end state.
  const manualRun = env.SYNC_MANUAL_RUN === "1";

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
        yield* cache.durable
          .setForever(
            CHECKPOINT_KEY,
            JSON.stringify({
              teamId: team.id,
              donePlayerIds: [...donePlayerIds],
              doneStaffIds: [...doneStaffIds],
            } satisfies TeamCheckpoint),
          )
          .pipe(
            Effect.catchAll((e) =>
              Effect.log(
                `checkpoint write failed — a truncated run may re-walk more members: ${String(e)}`,
              ),
            ),
          );
      }),
    );

  // A team-level fetch failure must not pin the cursor on this team forever:
  // move on without accumulating it, fail at the end. The cycle-end guard
  // (a live team missing from the accumulator) keeps that safe (#3465).
  const fetched = yield* Effect.either(
    Effect.all([psd.getRawMembers(team.id), psd.getRawStaff(team.id)], {
      concurrency: 2,
    }),
  );
  const fetchError = Either.isLeft(fetched) ? fetched.left : null;
  if (fetchError !== null) {
    yield* Effect.logError(
      `team ${team.id}: PSD member/staff fetch failed — skipping the team this pass: ${String(fetchError)}`,
    );
  }
  const [members, rawStaff] = Either.isRight(fetched)
    ? fetched.right
    : [[] as readonly PsdMember[], [] as readonly PsdMember[]];
  const staffMembers = rawStaff.filter((m) => !isSyncExcludedStaff(m));
  const { players, unknown } = partitionMembers(members);
  yield* Effect.log(
    `team ${team.id}: ${players.length} players, ${staffMembers.length} staff`,
  );
  if (unknown.length > 0) {
    yield* Effect.log(
      `team ${team.id}: ${unknown.length} members with unknown status skipped: ${unknown.map((m) => `${m.id}(${m.status})`).join(", ")}`,
    );
  }

  // Zero roster (#3465): PSD says no players, Sanity says there are some.
  // First sighting → hold the team back (no upsertTeam), protect its players
  // from the cycle-end archive and leave a marker; second consecutive
  // sighting → trust it. A manual run holds back too but writes nothing.
  const sanityTeamPlayerIds =
    fetchError === null && players.length === 0
      ? yield* sanityReader.getTeamPlayerPsdIds(String(team.id))
      : [];
  const rosterEmptyKey = emptyRosterKey(team.id);
  const emptyRosterSeenBefore =
    sanityTeamPlayerIds.length > 0 && !manualRun
      ? (yield* cache.durable.get(rosterEmptyKey)) !== null
      : false;
  const holdTeam = sanityTeamPlayerIds.length > 0 && !emptyRosterSeenBefore;
  if (holdTeam) {
    yield* Effect.logWarning(
      `team ${team.id}: PSD returned 0 players but Sanity lists ${sanityTeamPlayerIds.length} — holding the team back this pass${manualRun ? "" : " (marker set; a second empty roster is trusted)"}`,
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

  // Member isolation (#3465): one member's failed upsert must not strand the
  // team (the cursor would stay on it forever). Collected, then the run
  // fails after the team and the cursor are done. Mutated synchronously, like
  // the done-id sets above.
  const failedPlayerIds = new Set<string>();
  const failedStaffIds = new Set<string>();

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
      }).pipe(
        Effect.catchAll((e) => {
          failedPlayerIds.add(String(m.id));
          return Effect.logError(`player ${m.id}: sync failed — ${String(e)}`);
        }),
      ),
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
      }).pipe(
        Effect.catchAll((e) => {
          failedStaffIds.add(String(m.id));
          return Effect.logError(`staff ${m.id}: sync failed — ${String(e)}`);
        }),
      ),
    { concurrency: 2 }, // low to avoid Sanity asset upload rate limit
  );

  // Final flush, forced: guarantees the last members' progress is durable
  // even if they completed inside the debounce window above (#2900 review).
  yield* flushCheckpoint(true);

  const playerPsdIds = players.map((m) => String(m.id));
  const staffPsdIds = staffMembers.map((m) => String(m.id));
  // team.players / team.staff are strong references: a member that failed
  // and has no doc yet cannot be referenced. A failed member that already
  // has a doc stays (its doc is there, and dropping it would unlink it).
  const referencable = (
    ids: readonly string[],
    failed: ReadonlySet<string>,
    existing: ReadonlyMap<string, unknown>,
  ) => ids.filter((id) => !failed.has(id) || existing.has(id));
  if (fetchError === null && !holdTeam) {
    yield* sanityWriter.upsertTeam(
      transformTeam(
        team,
        referencable(playerPsdIds, failedPlayerIds, imageState),
        referencable(staffPsdIds, failedStaffIds, staffImageState),
      ),
    );
    // A trusted empty roster and a non-empty one both retire the marker.
    if (!manualRun && (players.length > 0 || emptyRosterSeenBefore)) {
      yield* cache.durable
        .delete(rosterEmptyKey)
        .pipe(
          Effect.catchAll((e) =>
            Effect.log(
              `team ${team.id}: failed to clear the empty-roster marker — harmless, it only makes the next empty roster trusted sooner: ${String(e)}`,
            ),
          ),
        );
    }
  } else if (holdTeam && !manualRun) {
    yield* cache.durable.setForever(rosterEmptyKey, "1");
  }
  yield* Effect.log(`team ${team.id} (${team.name}): done`);

  // Reads a JSON-array accumulation key, parsing on top of the durable get —
  // a KV error propagates as-is (no `.orElseSucceed`), a parse failure or a
  // successfully-parsed NON-ARRAY value both fail the same way, wrapped in
  // the same `KvError` type, so accumulation fails the sync the same way it
  // always has: an unreadable/corrupt accumulator must never be silently
  // treated as "empty," or a genuine roster gets reconciled against a
  // partial id set. The `Array.isArray` guard matters on its own —
  // `new Set<string>(null)` (or any other non-array JSON value `JSON.parse`
  // can return) silently yields an EMPTY set rather than throwing, which
  // `JSON.parse` alone can't catch. Mirrors `readManifest`'s guard
  // (`search/index-manifest.ts`) for exactly the same reason (#2831).
  const readAccumulatedIds = (key: string) =>
    cache.durable.get(key).pipe(
      Effect.flatMap((raw) =>
        raw === null
          ? Effect.succeed([] as string[])
          : Effect.try({
              try: () => JSON.parse(raw) as unknown,
              catch: (cause) =>
                new KvError(
                  `KV read/parse failed for ${key}: ${String(cause)}`,
                  cause,
                ),
            }).pipe(
              Effect.flatMap((parsed) =>
                Array.isArray(parsed)
                  ? Effect.succeed(
                      parsed.filter(
                        (id): id is string => typeof id === "string",
                      ),
                    )
                  : Effect.fail(
                      new KvError(`KV value for ${key} is not a JSON array`),
                    ),
              ),
            ),
      ),
    );

  // A manual run reads and writes no cycle state at all; a team whose
  // fetch failed adds nothing (and so stays "missing" for the cycle-end guard).
  const readCycleIds = (key: string) =>
    manualRun ? Effect.succeed([] as string[]) : readAccumulatedIds(key);
  const accumulate = (
    key: string,
    existing: readonly string[],
    toAdd: readonly string[],
  ) =>
    Effect.gen(function* () {
      const ids = new Set<string>(existing);
      if (fetchError === null) {
        for (const id of toAdd) ids.add(id);
        if (!manualRun) {
          yield* cache.durable.setForever(key, JSON.stringify([...ids]));
        }
      }
      return ids;
    });

  // ─── Accumulate player PSD IDs in KV ─────────────────────────────────
  // A held-back team contributes the players Sanity already lists for it.
  const accumulatedIds = yield* accumulate(
    CYCLE_PLAYER_IDS_KEY,
    yield* readCycleIds(CYCLE_PLAYER_IDS_KEY),
    holdTeam ? sanityTeamPlayerIds : playerPsdIds,
  );

  // ─── Accumulate staff PSD IDs in KV ─────────────────────────────────
  const accumulatedStaffIds = yield* accumulate(
    CYCLE_STAFF_IDS_KEY,
    yield* readCycleIds(CYCLE_STAFF_IDS_KEY),
    staffPsdIds,
  );

  // ─── Accumulate team PSD IDs in KV ──────────────────────────────────
  const accumulatedTeamIds = yield* accumulate(
    CYCLE_TEAM_IDS_KEY,
    yield* readCycleIds(CYCLE_TEAM_IDS_KEY),
    [String(team.id)],
  );

  // Compute next cursor (wraps at end of team list)
  const nextCursor = (teamIndex + 1) % teams.length;

  // ─── Reconciliation at cycle end ─────────────────────────────────────
  if (nextCursor === 0 && manualRun) {
    yield* Effect.log(
      "cycle end reached by a manual run — skipping reconciliation and leaving the accumulators alone",
    );
  }
  if (nextCursor === 0 && !manualRun) {
    yield* Effect.log("cycle complete — running reconciliation");

    // Cycle-end guard (#3465): archival is only as good as the accumulators.
    // A live team that was never accumulated this cycle (skipped by a
    // removal/reorder, a failed fetch, a failed cursor write) means the
    // player and staff sets are partial, so skip those two legs. Teams are
    // checked against accumulator ∪ live list, below.
    const liveTeamIds = teams.map((t) => String(t.id));
    const missingTeamIds = liveTeamIds.filter(
      (id) => !accumulatedTeamIds.has(id),
    );
    const cycleComplete = missingTeamIds.length === 0;
    if (!cycleComplete) {
      yield* Effect.logWarning(
        `reconciliation: cycle INCOMPLETE — live team(s) ${missingTeamIds.join(", ")} never accumulated this cycle; skipping player and staff archival (accumulators are cleared, the next cycle starts fresh)`,
      );
    }

    // See ORPHAN_CAP_OVERRIDE_KEY above. Read AND delete upfront — this is
    // the one-shot consumption point, unconditional on whether any leg
    // below actually applies the bypass (see the constant's doc comment
    // for why).
    const orphanCapOverrideRaw = yield* cache.durable
      .get(ORPHAN_CAP_OVERRIDE_KEY)
      .pipe(Effect.orElseSucceed(() => null));
    const orphanCapOverrideScopes =
      parseOrphanCapOverride(orphanCapOverrideRaw);
    if (orphanCapOverrideRaw !== null) {
      yield* cache.durable
        .delete(ORPHAN_CAP_OVERRIDE_KEY)
        .pipe(
          Effect.catchAll((e) =>
            Effect.log(
              `reconciliation: failed to clear the orphan-cap override key — it may still be active next cycle: ${String(e)}`,
            ),
          ),
        );
      yield* Effect.log(
        orphanCapOverrideScopes.size > 0
          ? `reconciliation: orphan-cap override consumed — bypassing the safety cap this cycle for: ${[...orphanCapOverrideScopes].join(", ")}`
          : `reconciliation: orphan-cap override key present but its value ("${orphanCapOverrideRaw}") named no recognised scope — bypassing nothing`,
      );
    }
    // Number.POSITIVE_INFINITY rather than `undefined`: passing `undefined`
    // for a defaulted parameter falls back to reconcileEntity's own
    // MAX_ORPHAN_RATIO default, which would NOT bypass the cap.
    const ratioThresholdFor = (scope: OrphanCapOverrideScope) =>
      orphanCapOverrideScopes.has(scope) ? Number.POSITIVE_INFINITY : undefined;

    if (cycleComplete) {
      const activeInSanity = yield* sanityReader.getActivePlayerPsdIds();
      yield* reconcileEntity(
        "players",
        activeInSanity,
        accumulatedIds,
        (ids) => sanityWriter.archivePlayers(ids),
        ratioThresholdFor("players"),
      );
    }

    // Club-wide staff (team-less club functions: board members, general roles)
    // are never returned by /teams/{id}/staff, so without this fetch their IDs
    // are absent from accumulatedStaffIds and reconciliation would archive them.
    // Fetched once per cycle, here at cycle end, so their IDs are fresh for the
    // orphan check. On fetch failure we SKIP staff reconciliation entirely
    // rather than risk archiving team-less staff on a partial ID set.
    const reconcileStaffWithClubWide = (
      clubRaw: readonly PsdClubStaffMember[],
      ratioThreshold: number | undefined,
    ) =>
      Effect.gen(function* () {
        // The endpoint returns a system "Admin" account (id 1) with a blank
        // firstName — skip nameless/non-person rows so no junk staffMember doc
        // is created. status is always "staff" here but filter defensively.
        const clubStaff = clubRaw.filter(
          (m) =>
            m.status === "staff" &&
            m.firstName.trim() !== "" &&
            !isSyncExcludedStaff(m),
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
          ratioThreshold,
        );
      });

    const clubStaffResult = cycleComplete
      ? yield* Effect.either(psd.getRawClubStaff())
      : null;
    if (clubStaffResult === null) {
      // incomplete cycle — staff archival skipped above
    } else if (Either.isLeft(clubStaffResult)) {
      yield* Effect.log(
        `reconciliation: SKIPPED staff archival — club-wide staff fetch failed: ${String(clubStaffResult.left)}`,
      );
      if (orphanCapOverrideScopes.has("staff")) {
        yield* Effect.log(
          "reconciliation: a staff-scoped orphan-cap override was consumed this cycle, but staff reconciliation never ran (club-wide fetch failed) — re-arm the override if it's still needed",
        );
      }
    } else {
      yield* reconcileStaffWithClubWide(
        clubStaffResult.right,
        ratioThresholdFor("staff"),
      );
    }

    // A team still in PSD's live list is never an orphan, even when this
    // cycle did not reach it (#3465).
    const activeTeamsInSanity = yield* sanityReader.getActiveTeamPsdIds();
    yield* reconcileEntity(
      "teams",
      activeTeamsInSanity,
      new Set([...accumulatedTeamIds, ...liveTeamIds]),
      (ids) => sanityWriter.archiveTeams(ids),
      ratioThresholdFor("teams"),
    );

    // Clear accumulation keys for next cycle (even when archival is skipped)
    yield* Effect.all(
      [
        cache.durable.delete(CYCLE_PLAYER_IDS_KEY),
        cache.durable.delete(CYCLE_STAFF_IDS_KEY),
        cache.durable.delete(CYCLE_TEAM_IDS_KEY),
      ],
      { concurrency: "unbounded" },
    );
  }

  // Advance cursor only after reconciliation succeeds (if applicable).
  // `setForever` — NOT `set` — is load-bearing here: a TTL on this key would
  // silently restart the team rotation once it expired, re-syncing team 1
  // forever (see this key's original finding, #2873).
  // At cycle end the accumulators are already cleared, so a swallowed failure
  // here would re-run the last team against empty accumulators: fail instead
  // (#3465). Mid-cycle a stale cursor only repeats a team.
  yield* cache.durable
    .setForever(CURSOR_KEY, String(nextCursor))
    .pipe(
      Effect.catchAll((e) =>
        nextCursor === 0
          ? Effect.fail(e)
          : Effect.log(
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
  yield* cache.durable
    .delete(CHECKPOINT_KEY)
    .pipe(
      Effect.catchAll((e) =>
        Effect.log(
          `checkpoint delete failed — harmless, see comment: ${String(e)}`,
        ),
      ),
    );

  const failures = [
    ...(fetchError === null
      ? []
      : [`team ${team.id}: member/staff fetch failed (${String(fetchError)})`]),
    ...[...failedPlayerIds].map((id) => `player ${id}`),
    ...[...failedStaffIds].map((id) => `staff ${id}`),
  ];
  if (failures.length > 0) {
    // Deliberately NOT the "cursor advanced to" wording below:
    // scripts/trigger-psd-sync.sh treats that line as success.
    yield* Effect.log(
      `sync finished with failures — cursor moved on to ${nextCursor}`,
    );
    return yield* Effect.fail(new SyncIncompleteError(failures));
  }

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
