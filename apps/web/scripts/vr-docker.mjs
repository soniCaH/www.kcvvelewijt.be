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
import { spawnSync } from "node:child_process";
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
  run("docker", [
    "compose",
    "-f",
    "docker-compose.vr.yml",
    "run",
    "--build",
    "--rm",
    "vr",
    ...decision.dockerArgs,
  ]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
