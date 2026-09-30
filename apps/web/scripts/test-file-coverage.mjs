#!/usr/bin/env node
// Fails when a tracked test file is in no runner's list (#3277).
//
// `vitest run` and `playwright test` exit 0 when at least one file matches, so
// a test dropped where no `include` reaches (a `.test.tsx` under a `*.test.ts`
// include, a spec outside `testDir`) passes every gate while running nowhere.
// Each layer below asks its own runner which files it would run, and compares
// that with what git tracks. Same shape as `vr-coverage.mjs`.
//
//   node apps/web/scripts/test-file-coverage.mjs
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const STORY_FILE = /\.stories\.[cm]?[jt]sx?$/;
const VITEST_LIST = ["exec", "vitest", "list", "--filesOnly"];

/** `vitest list --filesOnly` prints `[project] path`, or bare `path`. */
export function listedByVitest(output) {
  return output
    .split("\n")
    .map((line) => line.replace(/^\[[^\]]*\]\s*/, "").trim())
    .filter(Boolean);
}

/** `playwright test --list --reporter=json`: `file` sits on every suite, relative to `testDir`. */
export function listedByPlaywright(json, testDir) {
  const files = new Set();
  const walk = (suites) =>
    suites.forEach((s) => {
      if (s.file) files.add(`${testDir}/${s.file}`);
      walk(s.suites ?? []);
    });
  walk(JSON.parse(json).suites ?? []);
  return [...files];
}

/**
 * Tracked files matching `pattern` (minus `skip`, a prefix another runner
 * owns) that `listed` does not contain.
 */
export function unlistedFiles(
  tracked,
  listed,
  { pattern = TEST_FILE, skip = "" } = {},
) {
  const seen = new Set(listed);
  return tracked.filter(
    (f) => pattern.test(f) && !(skip && f.startsWith(skip)) && !seen.has(f),
  );
}

// `cwd` is the workspace the runner is invoked from; paths are relative to it.
const vitest = (cwd, extra = [], opts = {}) => ({
  cwd,
  args: [...VITEST_LIST, ...extra],
  parse: listedByVitest,
  opts,
});

export const LAYERS = {
  "web unit (Vitest)": vitest("apps/web", [], { skip: "test/e2e/" }),
  "web Storybook play (Vitest addon)": vitest(
    "apps/web",
    ["--config", "vitest.storybook.config.ts"],
    { pattern: STORY_FILE },
  ),
  "web E2E (Playwright)": {
    cwd: "apps/web",
    args: [
      "exec",
      "playwright",
      "test",
      "-c",
      "test/e2e/playwright.config.ts",
      "--list",
      "--reporter=json",
    ],
    parse: (out) => listedByPlaywright(out, "test/e2e"),
    opts: { pattern: /\.spec\.ts$/, only: "test/e2e/" },
  },
  "api (Vitest node + workerd)": vitest("apps/api"),
  "api-contract (Vitest)": vitest("packages/api-contract"),
  "sanity-studio (Vitest)": vitest("packages/sanity-studio"),
  "sanity-ops (Vitest)": vitest("scripts/sanity-ops"),
};

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 64 << 20 });

function main() {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  let missing = 0;
  for (const [name, { cwd, args, parse, opts }] of Object.entries(LAYERS)) {
    const dir = `${root}${cwd}`;
    const prefix = `${cwd}/`;
    // `git ls-files` is relative to the workspace: same frame as the runners.
    // A layer with `only` owns just that subtree of the workspace.
    const tracked = run("git", ["ls-files", "--", "."], dir)
      .split("\n")
      .filter((f) => f && (!opts.only || f.startsWith(opts.only)));
    const listed = parse(run("pnpm", args, dir));
    const gone = unlistedFiles(tracked, listed, opts);
    if (gone.length > 0) {
      missing += gone.length;
      console.error(
        `::error::${name}: ${gone.length} tracked file(s) no runner lists: ${gone.map((f) => prefix + f).join(" ")}`,
      );
    } else {
      console.log(
        `${name}: every tracked file is listed (${new Set(listed).size}).`,
      );
    }
  }
  if (missing > 0) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
