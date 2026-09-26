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
// Two more things live here (#3141 — a wave guards named shared resources,
// never CPU; see .claude/skills/ralph-afk/SKILL.md for the full register):
//
//   - The image is never built here. `/ralph-afk` step 0 builds
//     `kcvv-vr-runner:latest` once, before any lane starts (`vr:build-image`).
//     This script fails fast, naming that command, when the image is absent —
//     a parallel `docker compose run --build` on a stale image is the
//     2026-09-21 sixteen-minute freeze.
//   - The container run is guarded by an exclusive, `mkdir`-based lock, shared
//     by every worktree on the machine (`os.tmpdir()`, never a path inside a
//     worktree). Four containers would want the machine's entire memory, and
//     the lock also keeps two Compose projects from ever sharing a name at the
//     same time (`docker-compose.vr.yml` has none, so it takes the
//     working-directory basename).
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
 * @typedef {{ status?: number | null, error?: Error }} SpawnOutcome
 * @typedef {(command: string, args: string[], options?: object) => SpawnOutcome} Spawner
 */

/**
 * Whether the visual-regression image has already been built. Injectable so
 * the decision can be tested without invoking real Docker.
 *
 * @param {string} imageTag
 * @param {{ spawn?: Spawner }} [deps]
 */
export function checkImageExists(imageTag, { spawn = spawnSync } = {}) {
  const { status, error } = spawn("docker", ["image", "inspect", imageTag], {
    stdio: "ignore",
  });
  if (error) throw error;
  return status === 0;
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

/** Removed `--build` (#3141) — the image is built once, in step 0, never here. */
export function buildDockerArgs(dockerArgs) {
  return ["compose", "-f", "docker-compose.vr.yml", "run", "--rm", "vr", ...dockerArgs];
}

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

const holderPidFile = (lockDir) => join(lockDir, "pid");

function readHolderPid(lockDir) {
  try {
    const pid = Number.parseInt(readFileSync(holderPidFile(lockDir), "utf8"), 10);
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

function tryMkdir(lockDir) {
  try {
    mkdirSync(lockDir);
    return true;
  } catch (err) {
    if (err.code === "EEXIST") return false;
    throw err;
  }
}

/**
 * An exclusive `mkdir`-based mutex (#3141 member 3) — `mkdir` is atomic, so
 * this needs no separate locking primitive. "An agent can skim a brief and
 * cannot skim a lock": a second caller is refused with a clear message
 * instead of silently sharing the container.
 *
 * A lock whose holder process is gone (a killed agent, a crashed run) is
 * reclaimed automatically rather than wedging the machine forever.
 *
 * @param {string} lockDir
 * @param {{ pid?: number, isAlive?: (pid: number) => boolean }} [deps]
 * @returns {{ ok: true } | { ok: false, holderPid: number | null }}
 */
export function acquireLock(
  lockDir,
  { pid = process.pid, isAlive = isProcessAlive } = {},
) {
  if (!tryMkdir(lockDir)) {
    const holderPid = readHolderPid(lockDir);
    if (holderPid !== null && isAlive(holderPid)) {
      return { ok: false, holderPid };
    }
    // Stale lock — the holder is gone. Reclaim it.
    rmSync(lockDir, { recursive: true, force: true });
    if (!tryMkdir(lockDir)) {
      // Lost a race to reclaim it — treat as busy rather than crash.
      return { ok: false, holderPid: readHolderPid(lockDir) };
    }
  }
  writeFileSync(holderPidFile(lockDir), String(pid));
  return { ok: true };
}

export function releaseLock(lockDir) {
  rmSync(lockDir, { recursive: true, force: true });
}

export const lockBusyMessage = (holderPid) => `
Refusing to start the visual-regression container — another run holds the
lock${holderPid ? ` (pid ${holderPid})` : ""}.

Only one VR Docker container may run on this machine at a time (#3141): four
concurrent containers would want the machine's entire memory, and parallel
captures add sub-pixel noise to unrelated baselines. Wait for the other run to
finish, then retry.
`;

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

  if (!checkImageExists(VR_IMAGE_TAG)) {
    console.error(imageAbsentMessage(VR_IMAGE_TAG));
    process.exit(1);
  }

  const cwd = join(dirname(fileURLToPath(import.meta.url)), "..");
  const run = (command, commandArgs) => {
    const { status, error } = spawnSync(command, commandArgs, {
      cwd,
      stdio: "inherit",
    });
    if (error) throw error;
    if (status !== 0) process.exit(status ?? 1);
  };

  run("pnpm", ["run", "vr:build-storybook"]);
  // Once per invocation, on the HOST — the container mounts `.storybook`
  // read-only (see docker-compose.vr.yml) and can't fetch for itself. Not
  // part of `vr:build-storybook`: this cache must never end up inside
  // `storybook-static` (#3137 — see scripts/prefetch-typekit.mjs).
  run("node", ["scripts/prefetch-typekit.mjs"]);

  let lockHeld = false;
  process.on("exit", () => {
    if (lockHeld) releaseLock(VR_LOCK_DIR);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => process.exit(1));
  }

  const lock = acquireLock(VR_LOCK_DIR);
  if (!lock.ok) {
    console.error(lockBusyMessage(lock.holderPid));
    process.exit(1);
  }
  lockHeld = true;

  let dockerExitCode = 0;
  try {
    const { status, error } = spawnSync(
      "docker",
      buildDockerArgs(decision.dockerArgs),
      { cwd, stdio: "inherit" },
    );
    if (error) throw error;
    dockerExitCode = status ?? 1;
  } finally {
    releaseLock(VR_LOCK_DIR);
    lockHeld = false;
  }

  if (dockerExitCode !== 0) process.exit(dockerExitCode);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
