#!/usr/bin/env node
// Builds the visual-regression image and stamps it with a content-hash label
// (#3141) — `vr-docker.mjs`'s `checkImageStatus` compares this worktree's own
// hash of pnpm-lock.yaml + Dockerfile.vr against the label on every local run,
// so a lockfile or Dockerfile change fails fast with a rebuild command instead
// of silently running against a stale image (the whole point of dropping
// `--build` from the per-run command in the first place).
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { computeExpectedImageHash } from "./vr-docker.mjs";

const cwd = join(dirname(fileURLToPath(import.meta.url)), "..");
const hash = computeExpectedImageHash();

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
process.exit(status ?? 1);
