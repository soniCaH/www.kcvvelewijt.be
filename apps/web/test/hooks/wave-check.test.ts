/**
 * Regression fixture for `scripts/wave-check.sh`'s third section — the one that
 * looks for a collision `git merge-tree` structurally cannot see.
 *
 * The first two sections ask "do these branches touch the same lines?". That
 * question missed the failure this section exists for: #2882 added a guard
 * banning an English `sr-only` announcement, #2880 added an English `sr-only`
 * string, the two branches shared no file at all, `wave-check.sh` reported
 * "merge them in any order", and main went red twenty seconds after the second
 * merge. Each branch was green on its own.
 *
 * Like `check-branch.test.ts`, this script lives outside every workspace and
 * nothing else in CI would exercise it. This file is its only home: it rides
 * the existing `apps/web` vitest config, so `pnpm --filter @kcvv/web test` and
 * the web gate collect it.
 *
 * Fixtures are throwaway `git init` repos under `os.tmpdir()`. The script is
 * driven through `WAVE_CHECK_BRANCHES` so no GitHub round-trip happens; `gh` is
 * never invoked on this path.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** Worktree-safe: resolves the checkout we are running in, not a `../..` walk. */
const repoRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).stdout.trim();

const WAVE_CHECK = join(repoRoot, "scripts", "wave-check.sh");

let fixture = "";

function git(args: string[], cwd: string) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${r.stderr || r.stdout}`);
  }
  return r.stdout;
}

/** Write a file, creating parents, then commit it on the current branch. */
function commitFile(cwd: string, relPath: string, body: string, msg: string) {
  const abs = join(cwd, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, "utf8");
  git(["add", relPath], cwd);
  git(["commit", "-q", "--no-verify", "-m", msg], cwd);
}

/**
 * `wave-check.sh` reads `origin/<branch>`, so the fixture needs a real remote.
 * Simplest honest shape: a bare repo the working repo pushes to, so
 * `origin/main` and `origin/<branch>` genuinely resolve.
 */
function makeFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "wave-check-"));
  const bare = join(root, "origin.git");
  const work = join(root, "work");

  spawnSync("git", ["init", "-q", "--bare", "-b", "main", bare]);
  spawnSync("git", ["init", "-q", "-b", "main", work]);
  git(["config", "user.email", "t@example.com"], work);
  git(["config", "user.name", "T"], work);
  git(["remote", "add", "origin", bare], work);

  commitFile(work, "README.md", "seed\n", "chore: seed");
  git(["push", "-q", "-u", "origin", "main"], work);

  // Branch A — adds a RULE, and touches nothing else.
  git(["checkout", "-q", "-b", "adds-rule"], work);
  commitFile(
    work,
    "apps/web/src/app/__tests__/cross-page-consistency.test.ts",
    "// a guard that scans the whole tree\n",
    "test: add a guard",
  );
  git(["push", "-q", "origin", "adds-rule"], work);

  // Branch B — adds CODE the rule will scan. Shares no file with A.
  git(["checkout", "-q", "main"], work);
  git(["checkout", "-q", "-b", "adds-code"], work);
  commitFile(
    work,
    "apps/web/src/components/Thing/Thing.tsx",
    "export const Thing = () => null;\n",
    "feat: add a component",
  );
  git(["push", "-q", "origin", "adds-code"], work);

  // Branch C — docs only. Neither a rule nor code the rule scans.
  git(["checkout", "-q", "main"], work);
  git(["checkout", "-q", "-b", "docs-only"], work);
  commitFile(work, "docs/notes.md", "notes\n", "docs: add notes");
  git(["push", "-q", "origin", "docs-only"], work);

  git(["checkout", "-q", "main"], work);
  return work;
}

function runWaveCheck(branches: string[], cwd: string) {
  return spawnSync("bash", [WAVE_CHECK], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, WAVE_CHECK_BRANCHES: branches.join("\n") },
  });
}

beforeAll(() => {
  fixture = makeFixture();
});

afterAll(() => {
  if (fixture) rmSync(join(fixture, ".."), { recursive: true, force: true });
});

describe("wave-check.sh — rule vs code (the collision merge-tree cannot see)", () => {
  it("names the rule branch and the code branch, though they share no file", () => {
    const r = runWaveCheck(["adds-rule", "adds-code"], fixture);
    expect(r.status).toBe(0);

    // The premise: these two genuinely do not conflict textually. If this
    // stops holding, the fixture has drifted and the test below proves nothing.
    expect(r.stdout).toContain("none — merge them in any order.");

    expect(r.stdout).toContain("RULE      adds-rule");
    expect(r.stdout).toContain(
      "apps/web/src/app/__tests__/cross-page-consistency.test.ts",
    );
    expect(r.stdout).toContain("adds-code");
    expect(r.stdout).toContain("must be re-checked against the");
  });

  it("stays quiet when no branch in the wave adds a rule", () => {
    const r = runWaveCheck(["adds-code", "docs-only"], fixture);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(
      "none — no branch in this wave adds a rule another one must satisfy.",
    );
    expect(r.stdout).not.toContain("RULE      ");
  });

  it("does not pair a rule branch with a branch that adds no scanned code", () => {
    const r = runWaveCheck(["adds-rule", "docs-only"], fixture);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(
      "none — no branch in this wave adds a rule another one must satisfy.",
    );
  });
});
