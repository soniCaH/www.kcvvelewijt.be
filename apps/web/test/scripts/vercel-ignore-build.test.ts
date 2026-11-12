/**
 * Pins every case of `scripts/vercel-ignore-build.sh`; its header says what it
 * skips and why. Fixtures are throwaway `git init` repos run from their
 * `apps/web`; `origin` is the fixture itself, and `curl` is a stub first on
 * PATH, so no case touches the network.
 */
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const SCRIPT = join(__dirname, "..", "..", "scripts", "vercel-ignore-build.sh");

const stubs = mkdtempSync(join(tmpdir(), "vercel-ignore-stubs-"));
const curlLog = join(stubs, "curl.log");

let repo: string;
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

/** What the stub `curl` was called with; "" when it never ran. */
const curlCalls = () =>
  existsSync(curlLog) ? readFileSync(curlLog, "utf8") : "";

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
  writeFileSync(
    join(stubs, "curl"),
    `#!/bin/sh\necho "$@" >> "${curlLog}"\nprintf '%s' "$STUB_CURL_BODY"\nexit "$STUB_CURL_EXIT"\n`,
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

beforeEach(() => rmSync(curlLog, { force: true }));

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
    it.each([
      [0, "only docs/ changed", () => docsOnly, {}],
      [0, "only docs/ and apps/api/ changed", () => apiOnly, {}],
      [1, "the web app changed", () => webChange, {}],
      [
        0,
        "a Redeploy of a skipped first push (still no previous SHA)",
        () => docsOnly,
        { VERCEL_GIT_COMMIT_REF: "feat/docs-only" },
      ],
      [1, "main itself", () => base, { VERCEL_GIT_COMMIT_REF: "main" }],
    ])("exits %i for %s", (expected, _name, at, env) => {
      expect(firstPush(at(), env)).toBe(expected);
    });

    it("builds (1) when main cannot be fetched", () => {
      git("remote", "rename", "origin", "gone");
      try {
        expect(firstPush(apiOnly)).toBe(1);
      } finally {
        git("remote", "rename", "gone", "origin");
      }
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
        expect(
          botPush("renovate/x", { VERCEL_GIT_COMMIT_MESSAGE: message }),
        ).toBe(1);
        expect(curlCalls()).toBe("");
      },
    );

    it.each([
      [
        1,
        "has the preview label",
        "renovate/x",
        pulls("dependencies", "preview"),
        "0",
      ],
      [1, "has the preview label (imgbot)", "imgbot", pulls("preview"), "0"],
      [
        0,
        "has other labels only",
        "dependabot/npm_and_yarn/x",
        pulls("previewed"),
        "0",
      ],
      [0, "has no open PR yet (empty list)", "renovate/x", "[]", "0"],
      [1, "cannot be read (API error, rate limit)", "renovate/x", "[]", "22"],
    ])("exits %i when the PR %s", (expected, _name, ref, body, curlExit) => {
      expect(
        botPush(ref, { STUB_CURL_BODY: body, STUB_CURL_EXIT: curlExit }),
      ).toBe(expected);
    });

    it("reads the labels from the public API, by branch", () => {
      botPush("dependabot/npm_and_yarn/x");
      expect(curlCalls()).toContain(
        "https://api.github.com/repos/soniCaH/www.kcvvelewijt.be/pulls?head=soniCaH:dependabot/npm_and_yarn/x&state=open",
      );
      expect(curlCalls()).toMatch(/-\w*L/);
    });

    it("takes the owner and repo from Vercel's env", () => {
      botPush("renovate/x", {
        VERCEL_GIT_REPO_OWNER: "acme",
        VERCEL_GIT_REPO_SLUG: "site",
      });
      expect(curlCalls()).toContain(
        "https://api.github.com/repos/acme/site/pulls?head=acme:renovate/x&state=open",
      );
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
