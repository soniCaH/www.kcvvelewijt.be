#!/usr/bin/env node
// Fails when a tracked test file is in no runner's list (#3277).
//
// `vitest run` and `playwright test` exit 0 when at least one file matches, so
// a test dropped where no `include` reaches (a `.test.tsx` under a `*.test.ts`
// include, a spec outside `testDir`) passes every gate while running nowhere.
// Every tracked test or story file in the repo must be owned by a layer below,
// and every layer asks its own runner which files it would run. A file no
// layer owns fails too: a new workspace, or a test under `apps/studio/`, is
// not silently outside the check. Same shape as `vr-coverage.mjs`.
//
//   node apps/web/scripts/test-file-coverage.mjs
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const STORY_FILE = /\.stories\.[cm]?[jt]sx?$/;
const VITEST_LIST = ["exec", "vitest", "list", "--filesOnly"];

/** `git ls-files -z` output to paths; `-z` because git C-quotes non-ASCII names otherwise. */
export function splitNul(output) {
  return output.split("\0").filter(Boolean);
}

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
 * Every test or story file in `tracked` (repo-root paths) must be owned by a
 * layer (`owns(path)`), and every owned file must be in that layer's `listed`
 * (repo-root paths). Returns the unowned files and, per layer, how many files
 * it owns, how many its runner listed, and which owned files are not listed.
 */
export function auditFiles(tracked, layers) {
  const candidates = tracked.filter(
    (f) => TEST_FILE.test(f) || STORY_FILE.test(f),
  );
  return {
    unowned: candidates.filter((f) => !layers.some((l) => l.owns(f))),
    layers: layers.map((l) => {
      const owned = candidates.filter(l.owns);
      const seen = new Set(l.listed);
      return {
        name: l.name,
        owned: owned.length,
        listed: seen.size,
        missing: owned.filter((f) => !seen.has(f)),
      };
    }),
  };
}

const under =
  (dir, pattern, not = "") =>
  (f) =>
    f.startsWith(`${dir}/`) && pattern.test(f) && !(not && f.startsWith(not));

// `cwd` is where the runner is invoked; its output is relative to it.
const vitest = (cwd, extra = [], pattern = TEST_FILE, not = "") => ({
  cwd,
  args: [...VITEST_LIST, ...extra],
  parse: listedByVitest,
  owns: under(cwd, pattern, not),
});

export const LAYERS = {
  "web unit (Vitest)": vitest("apps/web", [], TEST_FILE, "apps/web/test/e2e/"),
  "web Storybook play (Vitest addon)": vitest(
    "apps/web",
    ["--config", "vitest.storybook.config.ts"],
    STORY_FILE,
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
    owns: under("apps/web/test/e2e", TEST_FILE),
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
  const tracked = splitNul(run("git", ["ls-files", "-z"], root));
  // A runner that fails or prints something unreadable lists nothing, and
  // that is reported below as such rather than as a stack trace.
  const layers = Object.entries(LAYERS).map(
    ([name, { cwd, args, parse, owns }]) => {
      let listed = [];
      let why = "";
      try {
        listed = parse(run("pnpm", args, `${root}${cwd}`)).map(
          (f) => `${cwd}/${f}`,
        );
      } catch (e) {
        why = String(e.message).split("\n")[0];
      }
      return { name, owns, listed, why };
    },
  );
  const { unowned, layers: results } = auditFiles(tracked, layers);
  let failed = false;
  const fail = (message) => {
    failed = true;
    console.error(`::error::${message}`);
  };
  if (unowned.length > 0) {
    fail(
      `${unowned.length} tracked test file(s) belong to no layer of scripts/test-file-coverage.mjs: ${unowned.join(" ")}`,
    );
  }
  results.forEach((r, i) => {
    if (r.owned === 0) {
      fail(`${r.name}: no tracked files matched, so the layer owns nothing`);
    } else if (r.listed === 0) {
      fail(
        `${r.name}: runner listed nothing, could not read its output${layers[i].why ? ` (${layers[i].why})` : ""}`,
      );
    } else if (r.missing.length > 0) {
      fail(
        `${r.name}: ${r.missing.length} tracked file(s) no runner lists: ${r.missing.join(" ")}`,
      );
    } else {
      console.log(
        `${r.name}: every tracked file is listed (${r.owned} tracked, ${r.listed} listed).`,
      );
    }
  });
  if (failed) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
