/**
 * Regression fixture for the two husky hooks and the ESLint context one of them
 * runs in (#3013).
 *
 * The defect that actually shipped was in `apps/web/eslint.config.mjs`: its
 * `files` / `ignores` globs resolve against the **cwd**, not the config file,
 * and `lint-staged` invokes ESLint from the repository root — where every path
 * starts `apps/web/`. So the Motion / Colors block never matched at commit
 * time, and ESLint then reported the valid `eslint-disable` comments that
 * reference it as unused directives and `--fix` deleted them.
 *
 * The second defect is the belief that grew around it. Both hooks *read* as if
 * a failing command cannot stop them — no `set -e`, a trailing `echo`. In fact
 * husky runs them as `sh -e "$s"` (`.husky/_/h`), so errexit has always been
 * live. `.husky/commit-msg` is what that misreading cost: it captured `$?` on
 * the line after `commitlint`, which errexit never reached, leaving its entire
 * "COMMIT MESSAGE FORMAT" help block unreachable.
 *
 * So these cases run the hooks the way git does — `sh -e` — and one runs
 * `.husky/pre-commit` under a plain `bash` to pin down what its own `set -e`
 * is worth on its own.
 *
 * `.husky/` sits in no workspace, so nothing else in CI would ever exercise it.
 * This file is its home for the same reason `check-branch.test.ts` is — see
 * that file's header.
 */
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** Worktree-safe: resolves the checkout we are running in, not a `../..` walk. */
const repoRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).stdout.trim();

const PRE_COMMIT = join(repoRoot, ".husky", "pre-commit");
const COMMIT_MSG = join(repoRoot, ".husky", "commit-msg");
const ESLINT_BIN = join(repoRoot, "node_modules", ".bin", "eslint");
const ESLINT_CONFIG = join("apps", "web", "eslint.config.mjs");

const SUCCESS_LINE = "Pre-commit checks passed";
const HELP_BLOCK = "COMMIT MESSAGE FORMAT";

/** How husky itself invokes a hook — see the `sh -e "$s"` line in `.husky/_/h`. */
const AS_HUSKY_DOES = ["sh", "-e"];

let fixture: string;
let stubBin: string;
let fakeNvmDir: string;
let messageFile: string;

/**
 * Run a hook against stub `npx` / `pnpm` / `branch-guard.sh` binaries whose exit
 * codes we control, from a scratch directory so nothing here can reach the real
 * repository.
 */
const runHook = (
  hook: string,
  exits: { branchGuard?: number; npx?: number; pnpm?: number },
  launcher: string[] = AS_HUSKY_DOES,
) =>
  spawnSync(launcher[0], [...launcher.slice(1), hook, messageFile], {
    cwd: fixture,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${stubBin}:${process.env.PATH ?? ""}`,
      // A `versions/node` directory exists, so the hook enters its nvm block;
      // the version named by the fixture `.nvmrc` does not, so that block's
      // trailing `[ -d "$NODE_PATH" ] && export PATH=…` returns non-zero. Under
      // errexit that must not abort the hook — bash and sh both keep going on a
      // failing non-final command of an AND-list, and this pins it.
      NVM_DIR: fakeNvmDir,
      STUB_BRANCH_GUARD_EXIT: String(exits.branchGuard ?? 0),
      STUB_NPX_EXIT: String(exits.npx ?? 0),
      STUB_PNPM_EXIT: String(exits.pnpm ?? 0),
    },
  });

const writeStub = (path: string, exitVar: string) => {
  writeFileSync(path, `#!/usr/bin/env bash\nexit "\${${exitVar}:-0}"\n`);
  chmodSync(path, 0o755);
};

beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), "kcvv-husky-"));
  stubBin = join(fixture, "stub-bin");
  fakeNvmDir = join(fixture, "nvm");
  messageFile = join(fixture, "COMMIT_EDITMSG");

  mkdirSync(stubBin);
  mkdirSync(join(fixture, ".husky"));
  mkdirSync(join(fakeNvmDir, "versions", "node"), { recursive: true });
  writeFileSync(join(fixture, ".nvmrc"), "99.99.99\n");
  writeFileSync(messageFile, "fix(config): a subject\n");

  writeStub(
    join(fixture, ".husky", "branch-guard.sh"),
    "STUB_BRANCH_GUARD_EXIT",
  );
  writeStub(join(stubBin, "npx"), "STUB_NPX_EXIT");
  writeStub(join(stubBin, "pnpm"), "STUB_PNPM_EXIT");
});

afterAll(() => {
  rmSync(fixture, { recursive: true, force: true });
});

describe(".husky/pre-commit", () => {
  it("succeeds, and says so, when every check passes", () => {
    const result = runHook(PRE_COMMIT, {});

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(SUCCESS_LINE);
  });

  it("fails the commit when lint-staged fails, without claiming success", () => {
    const result = runHook(PRE_COMMIT, { npx: 1 });

    expect(result.status).not.toBe(0);
    expect(result.stdout).not.toContain(SUCCESS_LINE);
  });

  it("fails the commit when type-check fails, without claiming success", () => {
    const result = runHook(PRE_COMMIT, { pnpm: 1 });

    expect(result.status).not.toBe(0);
    expect(result.stdout).not.toContain(SUCCESS_LINE);
  });

  it("fails the commit when the branch guard refuses", () => {
    const result = runHook(PRE_COMMIT, { branchGuard: 1 });

    expect(result.status).toBe(1);
    expect(result.stdout).not.toContain(SUCCESS_LINE);
  });

  it("carries its own errexit, so it fails even without husky's -e", () => {
    const result = runHook(PRE_COMMIT, { pnpm: 1 }, ["bash"]);

    expect(result.status).not.toBe(0);
    expect(result.stdout).not.toContain(SUCCESS_LINE);
  });
});

describe(".husky/commit-msg", () => {
  it("prints the format help when commitlint rejects the message", () => {
    const result = runHook(COMMIT_MSG, { npx: 1 });

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(HELP_BLOCK);
  });

  it("passes a missing-npx 127 through to husky, without the lecture", () => {
    const result = runHook(COMMIT_MSG, { npx: 127 });

    expect(result.status).toBe(127);
    expect(result.stdout).not.toContain(HELP_BLOCK);
  });

  it("stays quiet when commitlint accepts the message", () => {
    const result = runHook(COMMIT_MSG, {});

    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain(HELP_BLOCK);
  });
});

describe("apps/web ESLint config in the lint-staged context", () => {
  type Report = {
    messages: { ruleId: string | null; message: string }[];
    output?: string;
  };

  const parse = (result: SpawnSyncReturns<string>): Report[] => {
    if (result.error || result.status === null) {
      throw new Error(`ESLint could not be spawned: ${result.error?.message}`);
    }
    if (!result.stdout.trim()) {
      throw new Error(`ESLint produced no JSON. stderr: ${result.stderr}`);
    }
    return JSON.parse(result.stdout) as Report[];
  };

  /**
   * Exactly what `package.json`'s `lint-staged` entry runs: ESLint invoked from
   * the repository root with `--config apps/web/eslint.config.mjs`. Source is
   * piped in under an `apps/web/src` filename so nothing is written to the
   * tree, and `--fix-dry-run` reports what `--fix` would have written.
   */
  const lintStdinFromRepoRoot = (source: string) =>
    parse(
      spawnSync(
        ESLINT_BIN,
        [
          "--config",
          ESLINT_CONFIG,
          "--stdin",
          "--stdin-filename",
          join("apps", "web", "src", "motion-fixture.tsx"),
          "--fix-dry-run",
          "--format",
          "json",
        ],
        { cwd: repoRoot, encoding: "utf8", input: source },
      ),
    )[0];

  // `ruleId: null` alone also covers parse errors and unused directives, so
  // match the ignore notice itself.
  const isIgnored = (report: Report) =>
    report.messages.some((message) =>
      message.message.startsWith("File ignored"),
    );

  it("enforces the Motion rules on an apps/web/src file", () => {
    const report = lintStdinFromRepoRoot(
      `export const Bad = () => <div className="transition duration-700" />\n`,
    );

    expect(report.messages.map((message) => message.ruleId)).toContain(
      "no-restricted-syntax",
    );
  }, 60_000);

  it("leaves a deliberate eslint-disable comment alone", () => {
    const source = [
      "// eslint-disable-next-line no-restricted-syntax -- deliberate, see #3013",
      `export const Ok = () => <div className="transition duration-700" />`,
      "",
    ].join("\n");

    // `output` is only set when a fix would rewrite the file, so `?? source` is
    // what the hook's `--fix` pass would leave behind.
    const afterFix = lintStdinFromRepoRoot(source).output ?? source;

    expect(afterFix).toContain("eslint-disable-next-line");
  }, 60_000);

  /**
   * A tracked file under `dir`, read from git rather than named literally, so a
   * rename there cannot surface as a baffling "ESLint produced no JSON".
   */
  const trackedFileIn = (dir: string) => {
    const [file] = spawnSync("git", ["ls-files", `${dir}/*.ts`], {
      cwd: repoRoot,
      encoding: "utf8",
    })
      .stdout.split("\n")
      .filter(Boolean);
    if (!file) {
      throw new Error(`No tracked .ts file under ${dir} to lint.`);
    }
    return file;
  };

  it("skips apps/web/scripts — and only it — from either cwd", () => {
    // The pair guards against "just prefix them all with `**/`": a blanket
    // `**/scripts/**` also swallows `test/scripts/*.test.ts`, which is linted.
    const appsWeb = join(repoRoot, "apps", "web");
    const files = [
      trackedFileIn("apps/web/scripts"),
      trackedFileIn("apps/web/test/scripts"),
    ];

    const fromRoot = parse(
      spawnSync(
        ESLINT_BIN,
        ["--config", ESLINT_CONFIG, "--format", "json", ...files],
        { cwd: repoRoot, encoding: "utf8" },
      ),
    );
    const fromAppsWeb = parse(
      spawnSync(
        ESLINT_BIN,
        [
          "--format",
          "json",
          ...files.map((file) => relative(appsWeb, join(repoRoot, file))),
        ],
        { cwd: appsWeb, encoding: "utf8" },
      ),
    );

    expect([...fromRoot, ...fromAppsWeb].map(isIgnored)).toEqual([
      true,
      false,
      true,
      false,
    ]);
  }, 60_000);
});
