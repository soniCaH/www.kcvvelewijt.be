/**
 * `.claude/hooks/block-main-edits.sh` — the `PreToolUse` hook that denies a
 * source edit on `main` (#3715). It decides by the branch of the checkout that
 * holds the file, so a worktree nested in the project (`.worktrees/`) is not
 * mistaken for `main`.
 *
 * Like `check-branch.test.ts`, the script lives outside every workspace; this
 * file is its only home and rides the `apps/web` vitest config. Fixtures are
 * throwaway `git init` repos under `os.tmpdir()`.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repoRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).stdout.trim();
const HOOK = join(repoRoot, ".claude", "hooks", "block-main-edits.sh");

const gitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
  GIT_AUTHOR_NAME: "Hook Test",
  GIT_AUTHOR_EMAIL: "hook-test@example.com",
  GIT_COMMITTER_NAME: "Hook Test",
  GIT_COMMITTER_EMAIL: "hook-test@example.com",
};

const git = (cwd: string, ...args: string[]) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", env: gitEnv });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed in ${cwd}: ${result.stderr}`);
  }
};

const fixture = { tmp: "", project: "" };

beforeAll(() => {
  fixture.tmp = mkdtempSync(join(tmpdir(), "kcvv-block-main-edits-"));
  fixture.project = join(fixture.tmp, "project");
  mkdirSync(fixture.project);
  git(fixture.project, "init", "-b", "main");
  git(fixture.project, "commit", "--allow-empty", "--no-verify", "-m", "init");
  git(
    fixture.project,
    "worktree",
    "add",
    join(fixture.project, ".worktrees", "feat-x"),
    "-b",
    "feat/x",
  );
});

afterAll(() => {
  rmSync(fixture.tmp, { recursive: true, force: true });
});

/** True when the hook printed a deny decision for this file. */
const denies = (relativePath: string, key = "file_path") => {
  const result = spawnSync("bash", [HOOK], {
    cwd: fixture.project,
    encoding: "utf8",
    env: { ...gitEnv, CLAUDE_PROJECT_DIR: fixture.project },
    input: JSON.stringify({
      tool_input: { [key]: join(fixture.project, relativePath) },
    }),
  });
  expect(result.status).toBe(0);
  return result.stdout.includes('"permissionDecision":"deny"');
};

describe("block-main-edits.sh", () => {
  it("denies a source edit in the checkout that is on main", () => {
    expect(denies("apps/web/src/a.tsx")).toBe(true);
  });

  it("denies a NotebookEdit on main", () => {
    expect(denies("apps/web/a.ipynb", "notebook_path")).toBe(true);
  });

  it("allows docs/ on main", () => {
    expect(denies("docs/note.md")).toBe(false);
  });

  it("allows a source edit in a nested worktree on a feature branch", () => {
    expect(denies(".worktrees/feat-x/apps/web/src/a.tsx")).toBe(false);
  });
});
