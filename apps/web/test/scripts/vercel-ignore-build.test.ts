/**
 * `scripts/vercel-ignore-build.sh` is Vercel's Ignored Build Step (#3597,
 * #3743): exit 0 skips the deployment, exit 1 builds it, and any other code
 * FAILS it (#3604 — a force-push left the previous SHA out of the clone,
 * `git diff` exited 128 and the deploy errored). Fixtures are throwaway
 * `git init` repos under `os.tmpdir()`, run from their `apps/web` like Vercel
 * does; `origin` is the fixture itself, so `git fetch origin main` stays
 * local. `curl` is a stub first on PATH, so no case touches the network.
 */
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SCRIPT = join(__dirname, "..", "..", "scripts", "vercel-ignore-build.sh");

let repo: string;
let stubs: string;
let base: string;
let docsOnly: string;
let apiOnly: string;
let webChange: string;

const git = (...args: string[]) =>
  spawnSync("git", args, { cwd: repo, encoding: "utf8" }).stdout.trim();

const commit = (path: string, body: string) => {
  mkdirSync(join(repo, path, ".."), { recursive: true });
  writeFileSync(join(repo, path), body);
  git("add", "-A");
  git("commit", "-q", "-m", path);
  return git("rev-parse", "HEAD");
};

const curlLog = () => join(stubs, "curl.log");

const run = (env: Record<string, string>, at: string) => {
  git("checkout", "-q", at);
  return spawnSync("bash", [SCRIPT], {
    cwd: join(repo, "apps", "web"),
    // Blank the Vercel vars first, so only each case's own values count.
    env: {
      ...process.env,
      PATH: `${stubs}:${process.env.PATH}`,
      VERCEL_GIT_COMMIT_REF: "",
      VERCEL_GIT_PREVIOUS_SHA: "",
      VERCEL_GIT_COMMIT_SHA: "",
      VERCEL_GIT_COMMIT_MESSAGE: "",
      VERCEL_GIT_REPO_OWNER: "",
      VERCEL_GIT_REPO_SLUG: "",
      STUB_CURL_BODY: "[]",
      STUB_CURL_EXIT: "0",
      ...env,
    },
    encoding: "utf8",
  }).status;
};

/** A first push: Vercel has no previous successful deploy of the branch. */
const firstPush = (at: string, env: Record<string, string> = {}) =>
  run({ VERCEL_GIT_COMMIT_SHA: at, ...env }, at);

/** A bot branch's push, as Vercel reports it (no previous successful deploy). */
const botPush = (
  ref: string,
  env: Record<string, string> = {},
  at = webChange,
) =>
  run(
    {
      VERCEL_GIT_COMMIT_REF: ref,
      VERCEL_GIT_COMMIT_SHA: at,
      VERCEL_GIT_COMMIT_MESSAGE: "⬆️ chore(deps): update x",
      ...env,
    },
    at,
  );

/** GitHub's reply to `pulls?head=…`: the open PRs of a branch, with labels. */
const pulls = (...names: string[]) =>
  JSON.stringify([{ number: 42, labels: names.map((name) => ({ name })) }]);

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), "vercel-ignore-"));
  stubs = mkdtempSync(join(tmpdir(), "vercel-ignore-stubs-"));
  writeFileSync(
    join(stubs, "curl"),
    `#!/bin/sh\necho "$@" >> "${curlLog()}"\nprintf '%s' "$STUB_CURL_BODY"\nexit "$STUB_CURL_EXIT"\n`,
  );
  chmodSync(join(stubs, "curl"), 0o755);
  mkdirSync(join(repo, "apps", "web"), { recursive: true });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  git("remote", "add", "origin", repo);
  base = commit("apps/web/page.ts", "1");
  docsOnly = commit("docs/notes.md", "1");
  apiOnly = commit("apps/api/index.ts", "1");
  webChange = commit("apps/web/page.ts", "2");
  // origin/main stays at `base`; the branches under test sit on top of it.
  git("checkout", "-q", "--detach");
  git("branch", "-f", "main", base);
});

afterAll(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(stubs, { recursive: true, force: true });
});

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

  it("builds (1) when a same-commit redeploy has a previous SHA", () => {
    expect(
      run(
        {
          VERCEL_GIT_PREVIOUS_SHA: webChange,
          VERCEL_GIT_COMMIT_SHA: webChange,
        },
        webChange,
      ),
    ).toBe(1);
  });

  describe("first push of a branch (compared against main)", () => {
    it("skips (0) when it changes only docs/", () => {
      expect(firstPush(docsOnly)).toBe(0);
    });

    it("skips (0) when it changes only docs/ and apps/api/", () => {
      expect(firstPush(apiOnly)).toBe(0);
    });

    it("builds (1) when it changes the web app", () => {
      expect(firstPush(webChange)).toBe(1);
    });

    it("skips (0) again on Redeploy of a skipped first push (still no previous SHA)", () => {
      expect(
        firstPush(docsOnly, { VERCEL_GIT_COMMIT_REF: "feat/docs-only" }),
      ).toBe(0);
    });

    it("builds (1) when main cannot be fetched", () => {
      git("remote", "rename", "origin", "gone");
      try {
        expect(firstPush(apiOnly)).toBe(1);
      } finally {
        git("remote", "rename", "gone", "origin");
      }
    });

    it("builds (1) on main itself", () => {
      expect(firstPush(base, { VERCEL_GIT_COMMIT_REF: "main" })).toBe(1);
    });
  });

  describe("bot branches", () => {
    it.each([
      ["renovate/x", "⬆️ chore(deps): update x"],
      ["renovate/x", "📌 chore(deps): pin x"],
      ["renovate/x", "🔧 chore(config): migrate renovate config"],
      ["dependabot/npm_and_yarn/x", "chore(deps): bump x"],
      ["imgbot", "[ImgBot] Optimize images"],
    ])("skips (0) %s with %j", (ref, message) => {
      expect(botPush(ref, { VERCEL_GIT_COMMIT_MESSAGE: message })).toBe(0);
    });

    it.each(["💥 chore(deps): update x", "🔒 fix(deps): update x"])(
      "builds (1) a renovate push starting with %j, without asking GitHub",
      (message) => {
        rmSync(curlLog(), { force: true });
        expect(
          botPush("renovate/x", { VERCEL_GIT_COMMIT_MESSAGE: message }),
        ).toBe(1);
        expect(() => readFileSync(curlLog())).toThrow();
      },
    );

    it("builds (1) when the PR has the preview label, reading it from the public API", () => {
      rmSync(curlLog(), { force: true });
      expect(
        botPush("dependabot/npm_and_yarn/x", {
          STUB_CURL_BODY: pulls("dependencies", "preview"),
        }),
      ).toBe(1);
      const call = readFileSync(curlLog(), "utf8");
      expect(call).toContain(
        "https://api.github.com/repos/soniCaH/www.kcvvelewijt.be/pulls?head=soniCaH:dependabot/npm_and_yarn/x&state=open",
      );
      expect(call).toMatch(/-\w*L/);
    });

    it("takes the owner and repo from Vercel's env", () => {
      rmSync(curlLog(), { force: true });
      botPush("renovate/x", {
        VERCEL_GIT_REPO_OWNER: "acme",
        VERCEL_GIT_REPO_SLUG: "site",
      });
      expect(readFileSync(curlLog(), "utf8")).toContain(
        "https://api.github.com/repos/acme/site/pulls?head=acme:renovate/x&state=open",
      );
    });

    it("builds (1) a labelled imgbot PR", () => {
      expect(botPush("imgbot", { STUB_CURL_BODY: pulls("preview") })).toBe(1);
    });

    it("builds (1) a labelled Renovate PR on Redeploy (no previous successful deploy)", () => {
      expect(botPush("renovate/x", { STUB_CURL_BODY: pulls("preview") })).toBe(
        1,
      );
    });

    it("skips (0) when the PR has other labels only", () => {
      expect(
        botPush("dependabot/npm_and_yarn/x", {
          STUB_CURL_BODY: pulls("dependencies", "previewed"),
        }),
      ).toBe(0);
    });

    it("skips (0) when the branch has no open PR yet (empty list)", () => {
      expect(botPush("renovate/x", { STUB_CURL_BODY: "[]" })).toBe(0);
    });

    it("finds the PR by branch, whatever VERCEL_GIT_PULL_REQUEST_ID says", () => {
      expect(
        botPush("renovate/x", {
          VERCEL_GIT_PULL_REQUEST_ID: "",
          STUB_CURL_BODY: pulls("preview"),
        }),
      ).toBe(1);
    });

    it("builds (1) when the GitHub API fails (rate limit, outage)", () => {
      expect(botPush("renovate/x", { STUB_CURL_EXIT: "22" })).toBe(1);
    });

    it("skips (0) an unlabelled bot push even when the web app changed", () => {
      expect(
        run(
          {
            VERCEL_GIT_COMMIT_REF: "renovate/x",
            VERCEL_GIT_PREVIOUS_SHA: base,
            VERCEL_GIT_COMMIT_SHA: webChange,
            VERCEL_GIT_COMMIT_MESSAGE: "⬆️ chore(deps): update x",
          },
          webChange,
        ),
      ).toBe(0);
    });
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
