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
//   3. The PNG must be back to the committed pixels, exactly. Exact matters:
//      it proves the fresh capture matched the committed baseline, so the
//      comparison against the planted PNG PASSED and the rewrite came from
//      `updatePassedSnapshot` — not from `-u` rewriting a failing snapshot.
// The component's baselines are restored from git afterwards, pass or fail,
// so the script refuses to start when any of them has uncommitted changes.
//
// Run: pnpm --filter @kcvv/web run vr:accept:sub-threshold  (needs Docker)
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// The runner scopes by component (one test file each), not by story id.
const COMPONENT = "features-articles-articlecredits";
const SNAPSHOTS = `test/vr/__snapshots__/${COMPONENT}--*`;
const BASELINE = `test/vr/__snapshots__/${COMPONENT}--no-fields--mobile.png`;
const PLANTED = 10;
// Mirrors `failureThreshold` (percent) in .storybook/test-runner.ts.
const FAILURE_THRESHOLD = 0.0005;

const cwd = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(cwd, BASELINE);

const run = (command, args, stdio = "inherit") => {
  const { status, stdout, error } = spawnSync(command, args, {
    cwd,
    stdio,
    encoding: "utf8",
  });
  if (error) throw error;
  return { status, stdout };
};

const pixels = () => sharp(path).raw().toBuffer({ resolveWithObject: true });

const dirty = run("git", ["status", "--porcelain", "--", SNAPSHOTS], "pipe");
if (dirty.status !== 0 || dirty.stdout.trim()) {
  console.error(
    `Refusing: ${SNAPSHOTS} has uncommitted changes, and this script restores them from git.\n${dirty.stdout}`,
  );
  process.exit(1);
}

try {
  const { data: original, info } = await pixels();
  const ratio = PLANTED / (info.width * info.height);
  if (ratio >= FAILURE_THRESHOLD) {
    throw new Error(
      `Setup: ${PLANTED} planted pixels is ${ratio * 100} % — not under the threshold.`,
    );
  }

  // Inverts the first PLANTED pixels of the top row — a maximal per-pixel diff.
  const planted = PLANTED * info.channels;
  const stale = Buffer.from(original);
  for (let i = 0; i < planted; i++) stale[i] = 255 - stale[i];
  await sharp(stale, { raw: info }).png().toFile(path);

  const { status } = run("node", [
    "scripts/vr-docker.mjs",
    "update:story",
    COMPONENT,
  ]);
  if (status !== 0) throw new Error(`vr:update:story exited ${status}.`);

  const { data: after } = await pixels();
  if (after.equals(original)) {
    console.log(
      `\nPASS: ${BASELINE} was rewritten despite a sub-threshold drift.`,
    );
  } else if (after.equals(stale)) {
    console.error(
      `\nFAIL: ${BASELINE} still carries the planted sub-threshold drift.\n` +
        "`-u` left a stale baseline — is `updatePassedSnapshot: true` set in .storybook/test-runner.ts?",
    );
    process.exitCode = 1;
  } else {
    console.error(
      `\nINCONCLUSIVE: the fresh capture of ${BASELINE} differs from the committed baseline,\n` +
        "so the rewrite may have come from a failing comparison. Recapture that baseline first.",
    );
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`\nFAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (run("git", ["checkout", "--", SNAPSHOTS]).status !== 0) {
    console.error(
      `\nRESTORE FAILED: ${BASELINE} may still hold planted pixels. Run: git checkout -- "${SNAPSHOTS}"`,
    );
    process.exitCode = 1;
  }
}
