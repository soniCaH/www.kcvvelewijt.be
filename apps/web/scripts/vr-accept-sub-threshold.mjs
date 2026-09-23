#!/usr/bin/env node
// End-to-end acceptance test for flake ledger row 20 (#3136): a baseline that
// drifts UNDER the VR failure threshold must still be rewritten by `-u`.
//
// jest-image-snapshot only rewrites a PASSING snapshot when
// `updatePassedSnapshot: true` is set (.storybook/test-runner.ts). Without it,
// a sub-threshold drift passes, `-u` leaves the stale PNG on disk, and the
// committed baselines drift quietly.
//
// The proof, against the real runner in the pinned Docker image:
//   1. Plant a stale baseline — the committed PNG with a few pixels flipped,
//      far below the 0.05 % threshold, so the comparison PASSES.
//   2. Run `vr:update:story` for that one component.
//   3. The planted pixels must be gone: the runner rewrote the PNG.
// The component's baselines are restored from git afterwards, pass or fail.
//
// Run: pnpm --filter @kcvv/web run vr:accept:sub-threshold  (needs Docker)
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const PREFIX = "features-articles-articlecredits";
const BASELINE = `test/vr/__snapshots__/${PREFIX}--no-fields--mobile.png`;
// 10 of 250 125 pixels (375×667) is 0.004 % — well under the 0.05 % threshold.
const PLANTED = 10;

const cwd = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(cwd, BASELINE);

const run = (command, args) => {
  const { status, error } = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (error) throw error;
  return status;
};

const pixels = async () => {
  const { data, info } = await sharp(path)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
};

/** Inverts the first PLANTED pixels of the top row — a maximal per-pixel diff. */
const plant = async () => {
  const { data, info } = await pixels();
  for (let i = 0; i < PLANTED * info.channels; i++) data[i] = 255 - data[i];
  await sharp(data, { raw: info }).png().toFile(path);
};

const plantedPixelsSurvive = async (original) => {
  const { data, info } = await pixels();
  for (let i = 0; i < PLANTED * info.channels; i++) {
    if (data[i] !== original[i]) return true;
  }
  return false;
};

let failed = true;
try {
  const { data: original } = await pixels();
  await plant();
  if (!(await plantedPixelsSurvive(original))) {
    throw new Error("Setup failed: the planted pixels did not land.");
  }

  const status = run("node", ["scripts/vr-docker.mjs", "update:story", PREFIX]);
  if (status !== 0) throw new Error(`vr:update:story exited ${status}.`);

  if (await plantedPixelsSurvive(original)) {
    console.error(
      `\nFAIL: ${BASELINE} still carries the planted sub-threshold drift.\n` +
        "`-u` left a stale baseline — is `updatePassedSnapshot: true` set in .storybook/test-runner.ts?",
    );
  } else {
    console.log(
      `\nPASS: ${BASELINE} was rewritten despite a sub-threshold drift.`,
    );
    failed = false;
  }
} catch (error) {
  console.error(`\nFAIL: ${error.message}`);
} finally {
  run("git", ["checkout", "--", `test/vr/__snapshots__/${PREFIX}--*`]);
}

process.exit(failed ? 1 : 0);
