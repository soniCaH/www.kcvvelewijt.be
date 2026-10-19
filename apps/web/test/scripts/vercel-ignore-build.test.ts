/**
 * `scripts/vercel-ignore-build.sh` is Vercel's Ignored Build Step (#3597):
 * exit 0 skips the deployment, exit 1 builds it, and any other code FAILS it
 * (#3604 — a force-push left the previous SHA out of the clone, `git diff`
 * exited 128 and the deploy errored). Fixtures are throwaway `git init` repos
 * under `os.tmpdir()`, run from their `apps/web` like Vercel does.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SCRIPT = join(__dirname, "..", "..", "scripts", "vercel-ignore-build.sh");

let repo: string;
let base: string;
let apiOnly: string;
let webChange: string;

const git = (...args: string[]) =>
  spawnSync("git", args, { cwd: repo, encoding: "utf8" }).stdout.trim();

const commit = (path: string, body: string) => {
  writeFileSync(join(repo, path), body);
  git("add", "-A");
  git("commit", "-q", "-m", path);
  return git("rev-parse", "HEAD");
};

const run = (env: Record<string, string>, at: string) => {
  git("checkout", "-q", at);
  return spawnSync("bash", [SCRIPT], {
    cwd: join(repo, "apps", "web"),
    // Blank the Vercel vars first, so only each case's own values count.
    env: {
      ...process.env,
      VERCEL_GIT_COMMIT_REF: "",
      VERCEL_GIT_PREVIOUS_SHA: "",
      VERCEL_GIT_COMMIT_SHA: "",
      ...env,
    },
    encoding: "utf8",
  }).status;
};

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), "vercel-ignore-"));
  mkdirSync(join(repo, "apps", "web"), { recursive: true });
  mkdirSync(join(repo, "apps", "api"), { recursive: true });
  git("init", "-q");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  base = commit("apps/web/page.ts", "1");
  apiOnly = commit("apps/api/index.ts", "1");
  webChange = commit("apps/web/page.ts", "2");
});

afterAll(() => rmSync(repo, { recursive: true, force: true }));

describe("vercel-ignore-build.sh", () => {
  it("skips (0) when nothing the web app builds from changed", () => {
    expect(
      run(
        { VERCEL_GIT_PREVIOUS_SHA: base, VERCEL_GIT_COMMIT_SHA: apiOnly },
        apiOnly,
      ),
    ).toBe(0);
  });

  it("builds (1) when the web app changed", () => {
    expect(
      run(
        { VERCEL_GIT_PREVIOUS_SHA: apiOnly, VERCEL_GIT_COMMIT_SHA: webChange },
        webChange,
      ),
    ).toBe(1);
  });

  it("builds (1), never errors, when the previous SHA is not in the clone (#3604)", () => {
    const gone = "6940eb9100dd80394caac932088acf6352fced1c";
    expect(
      run(
        { VERCEL_GIT_PREVIOUS_SHA: gone, VERCEL_GIT_COMMIT_SHA: webChange },
        webChange,
      ),
    ).toBe(1);
  });

  it("builds (1) on a branch's first deploy", () => {
    expect(run({ VERCEL_GIT_COMMIT_SHA: webChange }, webChange)).toBe(1);
  });

  it("skips (0) the VR bot's diff branches", () => {
    expect(
      run(
        {
          VERCEL_GIT_COMMIT_REF: "vr-diffs/pr-1",
          VERCEL_GIT_PREVIOUS_SHA: base,
          VERCEL_GIT_COMMIT_SHA: webChange,
        },
        webChange,
      ),
    ).toBe(0);
  });
});
