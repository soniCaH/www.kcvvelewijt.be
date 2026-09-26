#!/usr/bin/env node
// Builds the visual-regression image and stamps it with a content-hash label
// (#3141) — `vr-docker.mjs`'s `checkImageStatus` compares this worktree's own
// hash of pnpm-lock.yaml + Dockerfile.vr against the label on every local run,
// so a lockfile or Dockerfile change fails fast with a rebuild command instead
// of silently running against a stale image (the whole point of dropping
// `--build` from the per-run command in the first place).
//
// Takes the SAME exclusive lock `vr-docker.mjs` takes around its container
// run (second review, finding 2b) — without it, this build could retag
// `kcvv-vr-runner:latest` out from under a run that already passed its image
// check and is mid-`docker compose run`, at which point that run's container
// keeps executing the OLD image while the tag it was checked against no
// longer refers to it.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  acquireLock,
  computeExpectedImageHash,
  lockBusyMessage,
  releaseLock,
  VR_LOCK_DIR,
} from "./vr-docker.mjs";

const cwd = join(dirname(fileURLToPath(import.meta.url)), "..");
const hash = computeExpectedImageHash();

const lock = acquireLock(VR_LOCK_DIR);
if (!lock.ok) {
  console.error(lockBusyMessage(lock.holderPid, VR_LOCK_DIR));
  process.exit(1);
}

let exitCode = 0;
try {
  const { status, error } = spawnSync(
    "docker",
    [
      "compose",
      "-f",
      "docker-compose.vr.yml",
      "build",
      "--build-arg",
      `VR_IMAGE_CONTENT_HASH=${hash}`,
      "vr",
    ],
    { cwd, stdio: "inherit" },
  );
  if (error) throw error;
  exitCode = status ?? 1;
} finally {
  releaseLock(VR_LOCK_DIR);
}

process.exit(exitCode);
