#!/usr/bin/env node
// Wrapper for the four LOCAL Docker visual-regression entrypoints — `vr:check`,
// `vr:update`, `vr:update:single`, `vr:update:story` in apps/web/package.json.
// CI does not go through here: `vr:ci` / `vr:ci:update` run `vr:run*` directly,
// without Docker.
//
// Why it exists (#2380): `docker-compose.vr.yml` pins the runner to
// `platform: linux/amd64` so local captures are byte-identical to CI (#2370),
// at a measured ~3.6× emulation cost — the ~40 min full suite becomes ~2.5 h.
// Two ways to trip over that silently:
//
//   - `vr:check` has no scoped form at all. `test-storybook` only forwards a
//     positional pattern to Jest when it FOLLOWS `-u`, so a bare positional in
//     check mode is dropped and the whole suite runs.
//   - `vr:update` with no pattern regenerates every baseline.
//
// So the guard refuses check mode outright, and refuses an update with no
// positional pattern. `VR_FULL_RUN=1` is the only override.
//
// The guard has to live here rather than prepended to the package.json script
// body: pnpm appends `-- <args>` to the END of the script string, so a guard in
// front of the `&&` chain would never see the scoping pattern.
//
// Three more things live here (#3141 — a wave guards named shared resources,
// never CPU; see .claude/skills/ralph-afk/SKILL.md for the full register):
//
//   - The image is never built here. `/ralph-afk` step 0 builds
//     `kcvv-vr-runner:latest` once, before any lane starts (`vr:build-image`,
//     which takes the SAME lock below around its own `docker build` — a
//     retag mid-run is exactly what the lock exists to rule out). This
//     script fails fast, naming that command, when the image is absent OR
//     stale (its content-hash label no longer matches pnpm-lock.yaml /
//     Dockerfile.vr — worktrees on different lockfiles share this one tag).
//   - The container run is guarded by an exclusive lock, taken FIRST — before
//     even the image check, so a busy lock is reported immediately and the
//     image can't be retagged out from under this run between the check and
//     `docker compose run` — and shared by every worktree on the machine
//     (`os.tmpdir()`, never a path inside a worktree). Four containers would
//     want the machine's entire memory, and the lock also keeps two Compose
//     projects from ever sharing a name at the same time
//     (`docker-compose.vr.yml` has none, so it takes the working-directory
//     basename).
//   - Nothing here reacts to SIGINT/SIGTERM. A JS signal handler cannot run
//     while `spawnSync` blocks anyway, and installing one only disables the
//     OS's own default-terminate behaviour for the whole remaining lifetime
//     of the process. Recovery from a killed wrapper is the lock's stale-scan
//     (dead holder pid), not a shutdown hook.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Extra docker-compose args each mode adds, ahead of the caller's pattern. */
const MODES = {
  check: [],
  update: ["-u"],
  "update:single": ["-u", "--maxWorkers=1"],
  "update:story": ["-u"],
};

/**
 * `test-storybook` options that consume the NEXT argv entry as their value. The
 * value is a bare word, so without this it reads as a story-id pattern and
 * `pnpm vr:update -- --maxWorkers 1` walks straight past the guard.
 */
const VALUE_OPTIONS = new Set([
  "--url",
  "--maxWorkers",
  "--testTimeout",
  "--includeTags",
  "--excludeTags",
  "--shard",
]);

/**
 * A scoping pattern is a non-empty positional operand that is not some option's
 * value. pnpm's own `--` separator arrives in argv too (`vr:update:story --
 * ui-button` → ["update:story", "--", "ui-button"]) — it starts with `-`, so it
 * never counts as one.
 */
const hasPattern = (args) =>
  args.some(
    (arg, i) => arg && !arg.startsWith("-") && !VALUE_OPTIONS.has(args[i - 1]),
  );

const refusal = (mode, why) => `
Refusing \`pnpm vr:${mode}\` — ${why}

Under the emulated amd64 pin (docker-compose.vr.yml) a full local suite is
~2.5 h. Full-suite comparison is CI's job; locally, scope to one component:

  pnpm --filter @kcvv/web run vr:update:story -- <story-id-prefix>

Story IDs live in apps/web/storybook-static/index.json. To use that as a CHECK,
inspect \`git status test/vr/__snapshots__/\` afterwards — modified means drift,
untracked means new — then discard that prefix only (a blanket checkout of the
whole directory also throws away baselines you updated earlier on the branch):

  git checkout -- "test/vr/__snapshots__/<story-id-prefix>--"*
  git clean -f -- "test/vr/__snapshots__/<story-id-prefix>--"*

See "The amd64 pin — scoped runs only" in docs/agents/testing-ops.md.

Deliberate full local run: VR_FULL_RUN=1 pnpm --filter @kcvv/web run vr:${mode}
`;

/**
 * Pure guard decision.
 *
 * @param {{ mode: string, args: string[], fullRun?: boolean }} input
 * @returns {{ ok: true, dockerArgs: string[] } | { ok: false, message: string }}
 */
export function decide({ mode, args, fullRun = false }) {
  const modeArgs = MODES[mode];
  if (!modeArgs) {
    throw new Error(
      `Unknown VR mode "${mode}" — expected one of ${Object.keys(MODES).join(", ")}`,
    );
  }

  if (!fullRun) {
    if (mode === "check") {
      return {
        ok: false,
        message: refusal(
          mode,
          "check mode has no scoped form, so this is always the full suite.",
        ),
      };
    }
    if (!hasPattern(args)) {
      return {
        ok: false,
        message: refusal(
          mode,
          "no story-id pattern given, so this would regenerate every baseline.",
        ),
      };
    }
  }

  return { ok: true, dockerArgs: [...modeArgs, ...args] };
}

/** Must match `docker-compose.vr.yml`'s `image:` field. */
export const VR_IMAGE_TAG = "kcvv-vr-runner:latest";

/** The command `/ralph-afk` step 0 runs once, before any lane starts. */
export const VR_IMAGE_BUILD_COMMAND =
  "pnpm --filter @kcvv/web run vr:build-image";

/**
 * A directory shared by every worktree on the machine — never a path inside a
 * worktree (#3141 member 3). `os.tmpdir()` is per-user, not per-checkout.
 */
export const VR_LOCK_DIR = join(tmpdir(), "kcvv-vr-docker.lock");

/**
 * @typedef {{ status?: number | null, error?: Error, stdout?: string }} SpawnOutcome
 * @typedef {(command: string, args: string[], options?: object) => SpawnOutcome} Spawner
 */

// ---------------------------------------------------------------------------
// The image: absent, stale, or the daemon isn't even up.
// ---------------------------------------------------------------------------

/** The label `vr-build-image.mjs` stamps at build time (see Dockerfile.vr). */
export const VR_IMAGE_HASH_LABEL = "kcvv.vr-content-hash";

const WEB_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_DIR, "..", "..");
const LOCKFILE_PATH = join(REPO_ROOT, "pnpm-lock.yaml");
const DOCKERFILE_PATH = join(WEB_DIR, "Dockerfile.vr");

/**
 * Pure — the content-hash that decides whether the built image is stale.
 * Truncated to 16 hex chars: this labels a local dev image, not a security
 * boundary, and a short label is easier to eyeball in `docker image inspect`.
 *
 * @param {string} lockfileContents
 * @param {string} dockerfileContents
 */
export function hashImageInputs(lockfileContents, dockerfileContents) {
  return createHash("sha256")
    .update(lockfileContents)
    .update("\0")
    .update(dockerfileContents)
    .digest("hex")
    .slice(0, 16);
}

/**
 * @param {{ readFile?: (path: string) => string }} [deps]
 */
export function computeExpectedImageHash({
  readFile = (path) => readFileSync(path, "utf8"),
} = {}) {
  return hashImageInputs(readFile(LOCKFILE_PATH), readFile(DOCKERFILE_PATH));
}

/**
 * @typedef {"ok" | "absent" | "stale" | "docker-not-running"} ImageStatusKind
 * @typedef {{ status: ImageStatusKind, actualHash?: string, expectedHash?: string }} ImageStatus
 */

/**
 * Whether the visual-regression image is present AND still matches
 * pnpm-lock.yaml / Dockerfile.vr. Injectable so the decision can be tested
 * without invoking real Docker.
 *
 * @param {string} imageTag
 * @param {{ spawn?: Spawner, expectedHash?: string }} [deps]
 * @returns {ImageStatus}
 */
export function checkImageStatus(
  imageTag,
  { spawn = spawnSync, expectedHash = computeExpectedImageHash() } = {},
) {
  const daemon = spawn("docker", ["info"], { stdio: "ignore" });
  if (daemon.error || daemon.status !== 0) {
    return { status: "docker-not-running" };
  }

  const inspect = spawn(
    "docker",
    [
      "image",
      "inspect",
      "--format",
      `{{index .Config.Labels "${VR_IMAGE_HASH_LABEL}"}}`,
      imageTag,
    ],
    { encoding: "utf8" },
  );
  if (inspect.error || inspect.status !== 0) {
    return { status: "absent" };
  }

  const actualHash = (inspect.stdout ?? "").trim();
  if (actualHash !== expectedHash) {
    return { status: "stale", actualHash, expectedHash };
  }
  return { status: "ok" };
}

export const imageAbsentMessage = (imageTag) => `
Refusing to start the visual-regression container — image "${imageTag}" was
not found.

A wave's step 0 builds this image once, before any lane starts (see the
shared-resource register in .claude/skills/ralph-afk/SKILL.md, #3141) — this
script no longer builds it itself, so a rebuild here can never race another
lane's. Build it now, then re-run this command:

  ${VR_IMAGE_BUILD_COMMAND}
`;

export const imageStaleMessage = (imageTag) => `
Refusing to start the visual-regression container — image "${imageTag}" no
longer matches pnpm-lock.yaml / Dockerfile.vr in this worktree.

Worktrees on different lockfiles share this one tag (#3141), so a mismatch
just means the image was last built from a different checkout. Rebuild it for
THIS worktree, then re-run this command:

  ${VR_IMAGE_BUILD_COMMAND}
`;

export const dockerNotRunningMessage = () => `
Refusing to start the visual-regression container — Docker does not appear to be running (\`docker info\` failed).

Start Docker Desktop, then re-run this command.
`;

// ---------------------------------------------------------------------------
// The container: an exclusive, mkdir+rename-based lock.
// ---------------------------------------------------------------------------

/**
 * True if a process with this pid is still running. `kill(pid, 0)` sends no
 * signal — it only probes. EPERM means a live process owned by someone else;
 * ESRCH means it is gone.
 *
 * @param {number} pid
 */
export function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

/**
 * Whether a container built from the VR image is currently running —
 * consulted whenever the lock's holder process looks dead (#3141). The
 * wrapper can be SIGKILLed while `docker compose run` keeps the container
 * alive underneath it; without this check, the lock would be reclaimed and a
 * second container would start, fighting the first for the machine's whole
 * memory budget.
 *
 * Filtered on Compose's own service label, not `ancestor=<tag>:latest`
 * (second review, finding 2c): another lane can retag `latest` onto a new
 * build between this worktree's image check and its `docker compose run`,
 * at which point an ancestor filter for the tag no longer matches the
 * container that is still running the OLD image underneath it.
 *
 * @param {{ spawn?: Spawner }} [deps]
 */
export function isVrContainerRunning({ spawn = spawnSync } = {}) {
  const { stdout, status, error } = spawn(
    "docker",
    ["ps", "-q", "--filter", "label=com.docker.compose.service=vr"],
    { encoding: "utf8" },
  );
  if (error || status !== 0) return false;
  return (stdout ?? "").trim().length > 0;
}

/** A lock dir with no readable pid file younger than this is BUSY, not stale — it may just be mid-creation (see `claimLockDir`). */
const STALE_NO_PID_THRESHOLD_MS = 60_000;

const holderPidFile = (lockDir) => join(lockDir, "pid");

function readHolderPid(lockDir) {
  try {
    const pid = Number.parseInt(
      readFileSync(holderPidFile(lockDir), "utf8"),
      10,
    );
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

function lockAgeMs(lockDir, now) {
  try {
    return now() - statSync(lockDir).mtimeMs;
  } catch {
    return Infinity; // can't stat it — treat as old enough to reclaim
  }
}

const uniqueSuffix = () => `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Atomically claims `lockDir`: the pid file is written into a temp directory
 * FIRST, then the whole directory is renamed into place. `mkdir` alone is
 * atomic, but a bare `mkdir(lockDir)` followed by a separate pid-file write
 * leaves a window where `lockDir` exists with no pid file yet — a second
 * caller reading no pid in that window would wrongly call it stale and steal
 * it. Renaming a fully-formed directory into place closes that window: this
 * directory either does not exist yet, or it exists complete with its pid.
 */
function claimLockDir(lockDir, pid) {
  // `renameSync` silently replaces an EMPTY destination directory (POSIX
  // rename semantics), which would let this quietly absorb an already-
  // existing-but-empty lockDir instead of running it through the busy/stale
  // evaluation below — checked explicitly rather than relying on the rename
  // to fail.
  if (existsSync(lockDir)) return false;
  const tmpDir = `${lockDir}.tmp-${uniqueSuffix()}`;
  mkdirSync(tmpDir);
  writeFileSync(join(tmpDir, "pid"), String(pid));
  try {
    renameSync(tmpDir, lockDir);
    return true;
  } catch (err) {
    rmSync(tmpDir, { recursive: true, force: true });
    if (err.code === "ENOTEMPTY" || err.code === "EEXIST") return false;
    throw err;
  }
}

/**
 * Whether the lock at `lockDir` is stale, given who (if anyone readable)
 * holds it. `holderPid === null` means no readable pid file — see
 * `claimLockDir`'s doc comment for why that can be a legitimate in-progress
 * claim rather than damage.
 */
function isLockStale(lockDir, holderPid, deps) {
  if (holderPid !== null) {
    return !(deps.isAlive(holderPid) || deps.isContainerRunning());
  }
  return !(
    lockAgeMs(lockDir, deps.now) < deps.staleNoPidThresholdMs ||
    deps.isContainerRunning()
  );
}

const reclaimDirFor = (lockDir) => `${lockDir}.reclaim`;

/** A `.reclaim` dir older than this is itself abandoned (its holder crashed mid-reclaim) and may be cleared. */
const RECLAIM_STALE_THRESHOLD_MS = 60_000;

function tryAcquireReclaimLock(lockDir, now) {
  const reclaimDir = reclaimDirFor(lockDir);
  try {
    mkdirSync(reclaimDir);
    return reclaimDir;
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
    if (lockAgeMs(reclaimDir, now) < RECLAIM_STALE_THRESHOLD_MS) return null;
    try {
      rmSync(reclaimDir, { recursive: true, force: true });
      mkdirSync(reclaimDir);
      return reclaimDir;
    } catch {
      return null; // lost the race clearing it — someone else is active
    }
  }
}

/**
 * Reclaiming a stale lock is itself serialised behind a second `mkdir`-based
 * mutex (second review, finding 1). Without this, two lanes could each
 * decide the same lock is stale and race a rename-based tomb-and-restore
 * dance — and in a three-lane pile-up, the loser's "restore" step could
 * delete a THIRD lane's brand-new, live lock instead of the dead one it
 * actually saw. Serialising the reclaim removes the race instead of
 * detecting it after the fact: only the lane holding `.reclaim` may re-read
 * the pid, re-confirm staleness, and remove `lockDir` — and it does so
 * without ever renaming anything it has not just confirmed dead itself.
 *
 * @returns {"reclaimed" | "still-live" | "busy"}
 */
function tryReclaim(lockDir, deps) {
  const reclaimDir = tryAcquireReclaimLock(lockDir, deps.now);
  if (!reclaimDir) return "busy";
  try {
    const holderPid = readHolderPid(lockDir);
    if (!isLockStale(lockDir, holderPid, deps)) return "still-live";
    rmSync(lockDir, { recursive: true, force: true });
    return "reclaimed";
  } finally {
    rmSync(reclaimDir, { recursive: true, force: true });
  }
}

/** Bounded so a pathological run of races cannot spin forever; four wave agents never need more than a couple of retries in practice. */
const MAX_ACQUIRE_ATTEMPTS = 5;

/**
 * An exclusive lock (#3141 member 3) — "an agent can skim a brief and cannot
 * skim a lock". A second caller is refused with a clear message instead of
 * silently sharing the container. A lock whose holder process is gone AND
 * whose container isn't running (a killed agent, a crashed run) is reclaimed
 * automatically rather than wedging the machine forever.
 *
 * @param {string} lockDir
 * @param {{
 *   pid?: number,
 *   isAlive?: (pid: number) => boolean,
 *   isContainerRunning?: () => boolean,
 *   now?: () => number,
 *   staleNoPidThresholdMs?: number,
 * }} [deps]
 * @returns {{ ok: true } | { ok: false, holderPid: number | null }}
 */
export function acquireLock(
  lockDir,
  {
    pid = process.pid,
    isAlive = isProcessAlive,
    isContainerRunning = isVrContainerRunning,
    now = Date.now,
    staleNoPidThresholdMs = STALE_NO_PID_THRESHOLD_MS,
  } = {},
) {
  const deps = { isAlive, isContainerRunning, now, staleNoPidThresholdMs };

  for (let attempt = 0; attempt < MAX_ACQUIRE_ATTEMPTS; attempt++) {
    if (claimLockDir(lockDir, pid)) return { ok: true };

    const holderPid = readHolderPid(lockDir);
    if (!isLockStale(lockDir, holderPid, deps)) {
      return { ok: false, holderPid };
    }

    if (tryReclaim(lockDir, deps) === "busy") {
      // Another lane is already reclaiming it — report busy with what we
      // saw rather than spinning against its exclusive reclaim lock.
      return { ok: false, holderPid };
    }
    // "reclaimed" or "still-live" (someone else's fresh lock, confirmed live
    // under the reclaim lock) — either way, loop back and re-evaluate.
  }

  return { ok: false, holderPid: readHolderPid(lockDir) };
}

/**
 * Releases the lock only if it still holds THIS pid — a run that lost its
 * lock to a reclaim (or never held it) must never delete another run's live
 * lock out from under it.
 *
 * Renames the directory away FIRST, then removes the renamed copy — a plain
 * recursive `rm` deletes the pid file before the directory itself, so a
 * reader in that gap sees a directory that still exists but has no pid, and
 * (second review, finding 3) would misread it as a fresh in-progress claim
 * rather than a release in progress. The rename makes the release atomic
 * from any outside observer's point of view: `lockDir` either still holds
 * this run's lock, or it is already gone.
 *
 * @param {string} lockDir
 * @param {{ pid?: number, rename?: typeof renameSync, rm?: typeof rmSync }} [deps]
 */
export function releaseLock(
  lockDir,
  { pid = process.pid, rename = renameSync, rm = rmSync } = {},
) {
  if (readHolderPid(lockDir) !== pid) return;
  const tomb = `${lockDir}.released-${uniqueSuffix()}`;
  try {
    rename(lockDir, tomb);
  } catch (err) {
    if (err.code === "ENOENT") return; // already gone
    throw err;
  }
  rm(tomb, { recursive: true, force: true });
}

export const lockBusyMessage = (holderPid, lockDir) => `
Refusing to start the visual-regression container — another run holds the
lock${holderPid ? ` (pid ${holderPid})` : ""} at ${lockDir}.

Only one VR Docker container may run on this machine at a time (#3141): four
concurrent containers would want the machine's entire memory, and parallel
captures add sub-pixel noise to unrelated baselines. Wait for the other run to
finish, then retry.

If you are certain nothing is actually running — no vr-docker.mjs process, no
container from ${VR_IMAGE_TAG} — clear it by hand:

  rm -rf ${lockDir}
`;

/** Removed `--build` (#3141) — the image is built once, in step 0, never here. */
export function buildDockerArgs(dockerArgs) {
  return [
    "compose",
    "-f",
    "docker-compose.vr.yml",
    "run",
    "--rm",
    "vr",
    ...dockerArgs,
  ];
}

function main() {
  const [mode, ...args] = process.argv.slice(2);
  const decision = decide({
    mode,
    args,
    fullRun: process.env.VR_FULL_RUN === "1",
  });

  if (!decision.ok) {
    console.error(decision.message);
    process.exit(1);
  }

  // Taken FIRST — before even checking the image, let alone building
  // Storybook — so a busy lock is reported immediately, and so the image
  // check below can't be invalidated by another lane retagging the image
  // between this check and the `docker compose run` that acts on it (second
  // review, finding 2a).
  const lock = acquireLock(VR_LOCK_DIR);
  if (!lock.ok) {
    console.error(lockBusyMessage(lock.holderPid, VR_LOCK_DIR));
    process.exit(1);
  }

  const cwd = join(dirname(fileURLToPath(import.meta.url)), "..");
  const runOrThrow = (command, commandArgs) => {
    const { status, error } = spawnSync(command, commandArgs, {
      cwd,
      stdio: "inherit",
    });
    if (error) throw error;
    if (status !== 0) {
      const failure = new Error(`${command} exited with ${status}`);
      failure.exitCode = status ?? 1;
      throw failure;
    }
  };

  // One mechanism releases the lock: this `finally`. No signal handlers —
  // they cannot run while the calls below block anyway, and installing one
  // only disables SIGTERM's own default-terminate behaviour for no benefit.
  let exitCode = 0;
  try {
    const imageStatus = checkImageStatus(VR_IMAGE_TAG);
    if (imageStatus.status === "docker-not-running") {
      console.error(dockerNotRunningMessage());
      exitCode = 1;
    } else if (imageStatus.status === "absent") {
      console.error(imageAbsentMessage(VR_IMAGE_TAG));
      exitCode = 1;
    } else if (imageStatus.status === "stale") {
      console.error(imageStaleMessage(VR_IMAGE_TAG));
      exitCode = 1;
    } else {
      runOrThrow("pnpm", ["run", "vr:build-storybook"]);
      // Once per invocation, on the HOST — the container mounts `.storybook`
      // read-only (see docker-compose.vr.yml) and can't fetch for itself.
      // Not part of `vr:build-storybook`: this cache must never end up
      // inside `storybook-static` (#3137 — see scripts/prefetch-typekit.mjs).
      runOrThrow("node", ["scripts/prefetch-typekit.mjs"]);
      runOrThrow("docker", buildDockerArgs(decision.dockerArgs));
    }
  } catch (err) {
    console.error(err.stack ?? err.message ?? String(err));
    exitCode = err.exitCode ?? 1;
  } finally {
    releaseLock(VR_LOCK_DIR);
  }

  if (exitCode !== 0) process.exit(exitCode);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
