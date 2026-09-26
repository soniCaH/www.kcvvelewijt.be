/**
 * Regression fixture for `scripts/trigger-psd-sync.sh`.
 *
 * The bug this exists for (#2890): an ad-hoc version of this script used the
 * cron URL as its readiness probe. `/__scheduled` is the trigger, not a health
 * endpoint, so polling it *ran the sync* — the script fired two concurrent
 * syncs over the same team and only the partial-patch shape of `upsertPlayer`
 * kept them from overwriting each other's work.
 *
 * The property under test is therefore countable: across one whole invocation,
 * `/__scheduled` must be requested exactly once. A stub server records every
 * request path, so "once" is measured rather than reasoned about.
 *
 * Like `wave-check.test.ts` and `check-branch.test.ts`, this script lives
 * outside every workspace and nothing else in CI would exercise it. This file
 * is its only home: it rides the existing `apps/web` vitest config, so
 * `pnpm --filter @kcvv/web test` and the web gate collect it.
 *
 * No Cloudflare round-trip happens: `TRIGGER_PSD_SYNC_SERVER_CMD` replaces the
 * wrangler launch and skips the KV cursor write, so `wrangler` is never invoked
 * and nothing real is synced.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** Worktree-safe: resolves the checkout we are running in, not a `../..` walk. */
const repoRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).stdout.trim();

const SCRIPT = join(repoRoot, "scripts", "trigger-psd-sync.sh");

/**
 * Stands in for `wrangler dev --remote --test-scheduled`.
 *
 * It reproduces the two things the script keys off — the `Ready on …` line on
 * stdout, and the sync's own `…: done` completion line — and appends every
 * request path to a file so the test can count them.
 */
const STUB_SERVER = `
import { createServer } from "node:http";
import { appendFileSync } from "node:fs";

const [port, hitsFile] = process.argv.slice(2);

createServer((req, res) => {
  appendFileSync(hitsFile, req.url.split("?")[0] + "\\n");
  if (req.url.startsWith("/__scheduled")) {
    // The shape a real team pass logs, trimmed to the lines the script parses.
    console.log("processing team 1/21: 1 (Test Team)");
    console.log("team 1: 3 players, 1 staff");
    console.log("[uploadPlayerImage] player=100 patch committed — image upload complete");
    console.log("[uploadPlayerImage] player=101 patch committed — image upload complete");
    console.log("player 102: image up-to-date (hasPsdImage=true)");
    // A staff-only rate limit (#2895 review fixture): must not bleed into
    // the players' rate-limited count.
    console.log("[uploadStaffImage] staff=200 patch committed — image upload complete");
    console.log("staff 201: image upload failed — Sanity asset upload rate limited (429) | cause: undefined");
    console.log("team 1 (Test Team): done");
    // The genuine terminal line. The per-team "done" above fires before three
    // KV writes, the reconciliation branch and the cursor advance, so the
    // script deliberately waits for this one instead (#2890 review).
    // No backticks in this block: it is all one template literal.
    console.log("sync completed — cursor advanced to 1 (next: team index 1)");
  }
  res.writeHead(200).end("ok");
}).listen(Number(port), () => {
  console.log("Ready on http://localhost:" + port);
});
`;

let dir = "";
let stubPath = "";

/**
 * Each run gets its own port, hits file and log. Sharing them across cases let
 * a later run append to an earlier run's hits, which would make the
 * exactly-once assertion pass or fail on test ordering rather than on the
 * script's behaviour — and a reused port raced the previous stub's shutdown.
 */
let seq = 0;

/**
 * Ask the OS for a free port, then release it. A base port plus a counter
 * handed every Vitest process the same four numbers, so two worktrees in a
 * wave bound the same ports and one lost with `EADDRINUSE` (#3109). The lint
 * rule cannot see a port passed through argv, so this stays OS-assigned. No
 * host, like the stub, so the probe checks the same dual-stack address.
 * ponytail: the port is free when checked, not reserved. Another process can
 * take it before the stub binds; the OS hands out ephemeral ports in rotation,
 * so this is rare. If it bites, have the stub listen on 0 and the script read
 * the port off its `Ready on` line.
 */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.once("error", reject);
    s.listen(0, () => {
      const { port } = s.address() as { port: number };
      s.close(() => resolve(port));
    });
  });
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "psd-sync-fixture-"));
  stubPath = join(dir, "stub.mjs");
  writeFileSync(stubPath, STUB_SERVER, "utf8");
});

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

async function run(args: string[]) {
  const n = seq++;
  const port = await freePort();
  const hitsFile = join(dir, `hits-${n}.txt`);
  const logPath = join(dir, `sync-${n}.log`);
  writeFileSync(hitsFile, "", "utf8");

  const result = spawnSync("bash", [SCRIPT, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      TRIGGER_PSD_SYNC_SERVER_CMD: `node ${stubPath} ${port} ${hitsFile}`,
      TRIGGER_PSD_SYNC_PORT: String(port),
      TRIGGER_PSD_SYNC_LOG: logPath,
    },
  });
  // The stub's own errors (`EADDRINUSE`) land only in this log. A refused
  // argument exits before the script creates it.
  const log = existsSync(logPath) ? readFileSync(logPath, "utf8") : "";
  return { ...result, hitsFile, log };
}

function hitsOf(hitsFile: string) {
  return readFileSync(hitsFile, "utf8").trim().split("\n").filter(Boolean);
}

describe("trigger-psd-sync.sh", () => {
  it("requests /__scheduled exactly once — the readiness probe never fires the cron (#2890)", async () => {
    const r = await run(["0"]);
    expect(r.status, r.log).toBe(0);

    const hits = hitsOf(r.hitsFile);

    // The whole point. Two hits is the shipped bug: one from the probe, one
    // from the explicit fire, two concurrent syncs over the same team.
    expect(hits.filter((h) => h === "/__scheduled")).toHaveLength(1);

    // And nothing was requested before it — readiness came off the log, not
    // off an HTTP call, so the cron hit is the only request in the run.
    expect(hits).toEqual(["/__scheduled"]);
  });

  it("names the target dataset before it writes, so production is never a surprise", async () => {
    const r = await run(["0"]);
    expect(r.status, r.log).toBe(0);
    expect(r.stdout).toContain("Sanity dataset :");
    expect(r.stdout).toContain("fixture mode — skipping the KV cursor write");
  });

  it("summarises what actually committed, players and staff counted separately (#2895)", async () => {
    const r = await run(["0"]);
    expect(r.status, r.log).toBe(0);
    expect(r.stdout).toContain("processing team 1/21: 1 (Test Team)");
    expect(r.stdout).toContain("team 1: 3 players, 1 staff");
    expect(r.stdout).toContain("images committed        : players 2, staff 1");
    expect(r.stdout).toContain("already up to date      : players 1, staff 0");
    // The fixture's staff-only 429 must not bleed into the players' count.
    expect(r.stdout).toContain("rate-limited (429)      : players 0, staff 1");
  });

  it("refuses a missing or non-numeric team index rather than syncing the wrong team", async () => {
    expect((await run([])).status).toBe(64);
    expect((await run(["first-team"])).status).toBe(64);
  });
});
