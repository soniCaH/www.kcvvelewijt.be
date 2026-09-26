// @vitest-environment node
/**
 * Guard fixture for `apps/web/scripts/vr-docker.mjs` (#2380). `decide()` is the
 * pure decision; the two spawn cases prove it is wired to the CLI's exit code
 * and that a refusal never reaches the Storybook build or Docker.
 *
 * The last block covers the other half of the same hazard: `vr:run:update` in
 * `package.json`, which bypasses this wrapper entirely and is gated on CI
 * instead (#3140).
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import {
  acquireLock,
  buildDockerArgs,
  checkImageStatus,
  computeExpectedImageHash,
  decide,
  dockerNotRunningMessage,
  hashImageInputs,
  imageAbsentMessage,
  imageStaleMessage,
  isVrContainerRunning,
  lockBusyMessage,
  releaseLock,
  VR_IMAGE_BUILD_COMMAND,
  VR_IMAGE_HASH_LABEL,
} from "../../scripts/vr-docker.mjs";

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "scripts",
  "vr-docker.mjs",
);

/** Run the wrapper with a PATH that has no `docker`/`pnpm`, so an allowed run
 *  fails loudly instead of starting a 2.5 h suite on the developer's machine. */
const runScript = (args: string[]) =>
  spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    env: { ...process.env, PATH: "/nonexistent" },
  });

describe("decide", () => {
  it("refuses check mode even with a pattern — check mode cannot be scoped", () => {
    expect(decide({ mode: "check", args: ["ui-button"] }).ok).toBe(false);
  });

  it.each(["update", "update:single", "update:story"])(
    "refuses %s with no positional pattern",
    (mode) => {
      expect(decide({ mode, args: [] }).ok).toBe(false);
    },
  );

  it.each([
    ["a flag", ["--maxWorkers=1"]],
    ["an empty string", ["--", ""]],
    ["a space-separated option value", ["--", "--maxWorkers", "1"]],
    ["a URL option value", ["--", "--url", "http://127.0.0.1:6006"]],
  ])("does not mistake %s for a pattern", (_label, args) => {
    expect(decide({ mode: "update", args }).ok).toBe(false);
  });

  it("still sees the pattern when it follows an option and its value", () => {
    expect(
      decide({
        mode: "update",
        args: ["--", "--maxWorkers", "1", "ui-button"],
      }),
    ).toEqual({
      ok: true,
      dockerArgs: ["-u", "--", "--maxWorkers", "1", "ui-button"],
    });
  });

  it("names the cost, the scoped alternative and the override when refusing", () => {
    const result = decide({ mode: "update", args: [] });

    if (result.ok) throw new Error("expected a refusal");
    expect(result.message).toContain("2.5 h");
    expect(result.message).toContain("vr:update:story");
    expect(result.message).toContain("VR_FULL_RUN=1");
    expect(result.message).toContain("docs/agents/testing-ops.md");
  });

  // `pnpm vr:update:story -- ui-button` reaches the wrapper as ["update:story",
  // "--", "ui-button"] — pnpm keeps the separator, and before #2380 it appended
  // that same tail to the script string. Both the bare and the `--`-separated
  // shape must reproduce the arguments docker saw then.
  it.each([
    ["update:story", ["ui-button"], ["-u", "ui-button"]],
    ["update:story", ["--", "ui-button"], ["-u", "--", "ui-button"]],
    ["update:single", ["ui-button"], ["-u", "--maxWorkers=1", "ui-button"]],
    [
      "update:single",
      ["--", "ui-button"],
      ["-u", "--maxWorkers=1", "--", "ui-button"],
    ],
  ])("preserves today's docker args for %s %j", (mode, args, dockerArgs) => {
    expect(decide({ mode, args })).toEqual({ ok: true, dockerArgs });
  });

  it.each(["check", "update", "update:single", "update:story"])(
    "lets VR_FULL_RUN=1 through for %s",
    (mode) => {
      expect(decide({ mode, args: [], fullRun: true }).ok).toBe(true);
    },
  );

  it("rejects an unknown mode", () => {
    expect(() => decide({ mode: "nope", args: [] })).toThrow(/nope/);
  });
});

describe("the native update script", () => {
  /** `vr:run:update`'s CI gate, run on its own — never the capture behind it. */
  const guard = () => {
    const { scripts } = JSON.parse(
      readFileSync(join(dirname(SCRIPT), "..", "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const [gate] = scripts["vr:run:update"].split("; concurrently");
    return (CI: string) =>
      spawnSync("sh", ["-c", `${gate}; echo REACHED_CAPTURE`], {
        encoding: "utf8",
        env: { ...process.env, CI },
      });
  };

  // vr:run:update is `test-storybook -u` with no wrapper and no container, so
  // run on a developer's Mac it rewrites every baseline on arm64 (#2370). CI is
  // the only place it is correct, and Actions always sets CI=true (#3140).
  it("refuses outside CI, before reaching the capture", () => {
    const result = guard()("");

    expect(result.status).toBe(1);
    expect(result.stdout).not.toContain("REACHED_CAPTURE");
    expect(result.stderr).toContain("vr:update:story");
  });

  it("lets CI through", () => {
    expect(guard()("true").stdout).toContain("REACHED_CAPTURE");
  });
});

describe("cli", () => {
  it("refuses before touching the Storybook build or Docker", () => {
    // PATH is empty, so reaching either child process would surface an ENOENT
    // for `pnpm`/`docker` rather than the guard's own message.
    const result = runScript(["update"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toContain("ENOENT");
    expect(result.stderr).toContain("VR_FULL_RUN=1");
  });

  it("gets past the guard once scoped", () => {
    // Scoped, so the guard passes — the run then dies unable to run `docker
    // info` (docker itself is missing on this PATH), reported as "Docker
    // does not appear to be running" rather than a raw ENOENT. That is the
    // proof it got past the guard: a refusal never reaches this point.
    const result = runScript(["update:story", "ui-button"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toContain("VR_FULL_RUN=1");
    expect(result.stderr).toContain("Docker does not appear to be running");
  });
});

describe("hashImageInputs", () => {
  it("is deterministic for the same inputs", () => {
    expect(hashImageInputs("lockfile-a", "dockerfile-a")).toBe(
      hashImageInputs("lockfile-a", "dockerfile-a"),
    );
  });

  it("changes when either input changes", () => {
    const base = hashImageInputs("lockfile-a", "dockerfile-a");

    expect(hashImageInputs("lockfile-b", "dockerfile-a")).not.toBe(base);
    expect(hashImageInputs("lockfile-a", "dockerfile-b")).not.toBe(base);
  });
});

describe("computeExpectedImageHash", () => {
  it("hashes the lockfile and Dockerfile it is given, in order", () => {
    const readFile = (path: string) =>
      path.endsWith("Dockerfile.vr") ? "dockerfile-contents" : "lock-contents";

    expect(computeExpectedImageHash({ readFile })).toBe(
      hashImageInputs("lock-contents", "dockerfile-contents"),
    );
  });
});

describe("checkImageStatus", () => {
  const okDaemon = () => ({ status: 0 });

  it("is docker-not-running when `docker info` fails", () => {
    expect(
      checkImageStatus("kcvv-vr-runner:latest", {
        spawn: () => ({ status: 1 }),
        expectedHash: "abc",
      }),
    ).toEqual({ status: "docker-not-running" });
  });

  it("is docker-not-running when `docker info` errors (docker missing)", () => {
    const boom = Object.assign(new Error("boom"), { code: "ENOENT" });
    expect(
      checkImageStatus("kcvv-vr-runner:latest", {
        spawn: () => ({ error: boom }),
        expectedHash: "abc",
      }),
    ).toEqual({ status: "docker-not-running" });
  });

  it("is absent when the daemon is up but the image inspect fails", () => {
    let call = 0;
    const spawn = () => (call++ === 0 ? okDaemon() : { status: 1 });

    expect(
      checkImageStatus("kcvv-vr-runner:latest", { spawn, expectedHash: "abc" }),
    ).toEqual({ status: "absent" });
  });

  it("is stale when the image's label does not match the expected hash", () => {
    let call = 0;
    const spawn = () =>
      call++ === 0 ? okDaemon() : { status: 0, stdout: "old-hash\n" };

    expect(
      checkImageStatus("kcvv-vr-runner:latest", {
        spawn,
        expectedHash: "new-hash",
      }),
    ).toEqual({
      status: "stale",
      actualHash: "old-hash",
      expectedHash: "new-hash",
    });
  });

  it("is ok when the image's label matches the expected hash", () => {
    let call = 0;
    const spawn = () =>
      call++ === 0 ? okDaemon() : { status: 0, stdout: "same-hash\n" };

    expect(
      checkImageStatus("kcvv-vr-runner:latest", {
        spawn,
        expectedHash: "same-hash",
      }),
    ).toEqual({ status: "ok" });
  });

  it("asks docker for the content-hash label", () => {
    let call = 0;
    let inspectArgs: string[] = [];
    const spawn = (_cmd: string, args: string[]) => {
      if (call++ === 0) return okDaemon();
      inspectArgs = args;
      return { status: 0, stdout: "same-hash\n" };
    };

    checkImageStatus("kcvv-vr-runner:latest", {
      spawn,
      expectedHash: "same-hash",
    });

    expect(inspectArgs.join(" ")).toContain(VR_IMAGE_HASH_LABEL);
  });
});

describe("imageAbsentMessage", () => {
  it("names the exact build command and points at the register", () => {
    const message = imageAbsentMessage("kcvv-vr-runner:latest");

    expect(message).toContain(VR_IMAGE_BUILD_COMMAND);
    expect(message).toContain("kcvv-vr-runner:latest");
    expect(message).toContain(".claude/skills/ralph-afk/SKILL.md");
  });
});

describe("imageStaleMessage", () => {
  it("names the exact build command and explains the shared tag", () => {
    const message = imageStaleMessage("kcvv-vr-runner:latest");

    expect(message).toContain(VR_IMAGE_BUILD_COMMAND);
    expect(message).toContain("kcvv-vr-runner:latest");
    expect(message).toContain("pnpm-lock.yaml");
  });
});

describe("dockerNotRunningMessage", () => {
  it("tells the caller to start Docker Desktop", () => {
    expect(dockerNotRunningMessage()).toContain("Docker Desktop");
  });
});

describe("isVrContainerRunning", () => {
  it("is true when docker ps returns a container id", () => {
    expect(
      isVrContainerRunning({
        spawn: () => ({ status: 0, stdout: "abc123\n" }),
      }),
    ).toBe(true);
  });

  it("is false when docker ps returns nothing", () => {
    expect(
      isVrContainerRunning({ spawn: () => ({ status: 0, stdout: "\n" }) }),
    ).toBe(false);
  });

  it("is false when docker itself fails or errors, rather than throwing", () => {
    expect(isVrContainerRunning({ spawn: () => ({ status: 1 }) })).toBe(false);
    expect(
      isVrContainerRunning({ spawn: () => ({ error: new Error("boom") }) }),
    ).toBe(false);
  });

  it("filters on the VR image", () => {
    let seenArgs: string[] = [];
    isVrContainerRunning({
      spawn: (_cmd: string, args: string[]) => {
        seenArgs = args;
        return { status: 0, stdout: "" };
      },
    });
    expect(seenArgs.join(" ")).toContain("ancestor=kcvv-vr-runner:latest");
  });
});

describe("buildDockerArgs", () => {
  it("never carries --build (#3141) — the image is built once, in step 0", () => {
    expect(buildDockerArgs(["-u", "ui-button"])).not.toContain("--build");
  });

  it("preserves the compose invocation shape", () => {
    expect(buildDockerArgs(["-u", "ui-button"])).toEqual([
      "compose",
      "-f",
      "docker-compose.vr.yml",
      "run",
      "--rm",
      "vr",
      "-u",
      "ui-button",
    ]);
  });
});

describe("the exclusive lock", () => {
  let tmpParent: string;
  let lockDir: string;

  const freshLockDir = () => {
    tmpParent = mkdtempSync(join(tmpdir(), "kcvv-vr-lock-test-"));
    lockDir = join(tmpParent, "lock");
    return lockDir;
  };

  afterEach(() => {
    rmSync(tmpParent, { recursive: true, force: true });
  });

  it("acquires a fresh lock and writes its own pid", () => {
    const dir = freshLockDir();

    expect(acquireLock(dir)).toEqual({ ok: true });
    expect(readFileSync(join(dir, "pid"), "utf8")).toBe(String(process.pid));
  });

  it("refuses a second caller while the holder is alive", () => {
    const dir = freshLockDir();
    acquireLock(dir, { pid: 4242, isAlive: () => true });

    const second = acquireLock(dir, {
      isAlive: () => true,
      isContainerRunning: () => false,
    });

    expect(second).toEqual({ ok: false, holderPid: 4242 });
  });

  it("treats the lock as busy when the holder pid is dead but its container is still running", () => {
    const dir = freshLockDir();
    acquireLock(dir, { pid: 4242, isAlive: () => true });

    const second = acquireLock(dir, {
      isAlive: () => false,
      isContainerRunning: () => true,
    });

    expect(second).toEqual({ ok: false, holderPid: 4242 });
  });

  it("reclaims a stale lock whose holder process AND container are both gone", () => {
    const dir = freshLockDir();
    acquireLock(dir, { pid: 4242, isAlive: () => true });

    const reclaimed = acquireLock(dir, {
      pid: 9999,
      isAlive: () => false,
      isContainerRunning: () => false,
    });

    expect(reclaimed).toEqual({ ok: true });
    expect(readFileSync(join(dir, "pid"), "utf8")).toBe("9999");
  });

  it("treats a lock directory with no pid file as busy when it is fresh", () => {
    const dir = freshLockDir();
    // Simulates the narrow window inside claimLockDir between mkdir-ing the
    // temp dir and renaming it into place — a directory that exists here
    // with no pid file is (almost certainly) another caller mid-claim, not a
    // dead one (#3141 finding 1a).
    mkdirSync(dir);

    const result = acquireLock(dir, { isContainerRunning: () => false });

    expect(result).toEqual({ ok: false, holderPid: null });
  });

  it("reclaims a directory with no pid file once it is old enough to be orphaned", () => {
    const dir = freshLockDir();
    mkdirSync(dir);
    const farFuture = () => Date.now() + 120_000;

    const result = acquireLock(dir, {
      now: farFuture,
      isContainerRunning: () => false,
    });

    expect(result).toEqual({ ok: true });
  });

  it("does not delete a fresh lock that appeared between the staleness check and the reclaim (#3141 finding 1b)", () => {
    const dir = freshLockDir();
    acquireLock(dir, { pid: 4242, isAlive: () => true });
    let calls = 0;
    // On the first isAlive() check (for the original holder, 4242) simulate
    // another lane fully reclaiming AND reacquiring the lock in the gap
    // before our own reclaim runs.
    const isAlive = (candidatePid: number) => {
      calls += 1;
      if (calls === 1) {
        rmSync(dir, { recursive: true, force: true });
        mkdirSync(dir);
        writeFileSync(join(dir, "pid"), "5555");
        return false; // our check of the ORIGINAL holder (4242) still says dead
      }
      return candidatePid === 5555; // the second read is of the new, live holder
    };

    const result = acquireLock(dir, {
      isAlive,
      isContainerRunning: () => false,
    });

    expect(result).toEqual({ ok: false, holderPid: 5555 });
    // The other lane's fresh lock must have survived, untouched.
    expect(readFileSync(join(dir, "pid"), "utf8")).toBe("5555");
  });

  it("claims the lock outright when a stale holder's lock is fully released before reclaim", () => {
    const dir = freshLockDir();
    acquireLock(dir, { pid: 4242, isAlive: () => true });
    let calls = 0;
    const isAlive = () => {
      calls += 1;
      if (calls === 1) {
        rmSync(dir, { recursive: true, force: true }); // released, not re-claimed
        return false;
      }
      return true;
    };

    const result = acquireLock(dir, {
      isAlive,
      isContainerRunning: () => false,
    });

    expect(result).toEqual({ ok: true });
  });

  it("releases the lock so a later caller can acquire it", () => {
    const dir = freshLockDir();
    acquireLock(dir);

    releaseLock(dir);

    expect(acquireLock(dir)).toEqual({ ok: true });
  });

  it("does not release a lock held by a different pid", () => {
    const dir = freshLockDir();
    acquireLock(dir, { pid: 4242, isAlive: () => true });

    releaseLock(dir, { pid: 9999 });

    expect(
      acquireLock(dir, {
        isAlive: () => true,
        isContainerRunning: () => false,
      }),
    ).toEqual({ ok: false, holderPid: 4242 });
  });
});

describe("lockBusyMessage", () => {
  it("names the holder pid and the lock path", () => {
    const message = lockBusyMessage(4242, "/tmp/kcvv-vr-docker.lock");

    expect(message).toContain("4242");
    expect(message).toContain("/tmp/kcvv-vr-docker.lock");
  });

  it("still reads sensibly when the holder pid is unknown", () => {
    expect(lockBusyMessage(null, "/tmp/kcvv-vr-docker.lock")).not.toContain(
      "null",
    );
  });

  it("names how to clear a truly stale lock by hand", () => {
    const message = lockBusyMessage(4242, "/tmp/kcvv-vr-docker.lock");

    expect(message).toContain("rm -rf /tmp/kcvv-vr-docker.lock");
  });
});
