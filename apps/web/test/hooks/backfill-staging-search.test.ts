/**
 * Regression fixture for `scripts/backfill-staging-search.sh` (#2845).
 *
 * Same shape as `trigger-psd-sync.test.ts`: a stub server stands in for
 * `wrangler dev`, records every request, and prints the log lines the script
 * keys off. `BACKFILL_STAGING_SEARCH_SERVER_CMD` replaces the wrangler launch
 * and skips the vector-count read, so nothing reaches Cloudflare.
 *
 * What it pins: exactly one `/__scheduled` hit, for the search-index cron
 * only (never the `0 2 * * *` PSD sync); a failed sweep exits non-zero; and a
 * config that would point staging at the production index is refused before
 * any server starts.
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

const SCRIPT = join(repoRoot, "scripts", "backfill-staging-search.sh");

/**
 * Stands in for `wrangler dev --env staging --remote --test-scheduled`. Logs
 * the `Ready on …` line, then on `/__scheduled` the sweep's terminal line
 * (`index.ts`), `ok` or `failed` per argv. Appends every request's full URL
 * to a file so the test can count hits and read the cron expression.
 */
const STUB_SERVER = `
import { createServer } from "node:http";
import { appendFileSync } from "node:fs";

const [port, hitsFile, outcome] = process.argv.slice(2);

createServer((req, res) => {
  appendFileSync(hitsFile, req.url + "\\n");
  if (req.url.startsWith("/__scheduled")) {
    console.log("[search-sync] Indexing 12 articles");
    console.log("[scheduled] sanity-index-sync settled: " + outcome);
  }
  res.writeHead(200).end("ok");
}).listen(Number(port), () => {
  console.log("Ready on http://localhost:" + port);
});
`;

let dir = "";
let stubPath = "";
let seq = 0;

/** OS-assigned, released before use — see `trigger-psd-sync.test.ts` (#3109). */
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
  dir = mkdtempSync(join(tmpdir(), "staging-search-fixture-"));
  stubPath = join(dir, "stub.mjs");
  writeFileSync(stubPath, STUB_SERVER, "utf8");
});

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

async function run(outcome: "ok" | "failed", extraEnv = {}) {
  const n = seq++;
  const port = await freePort();
  const hitsFile = join(dir, `hits-${n}.txt`);
  const logPath = join(dir, `backfill-${n}.log`);
  writeFileSync(hitsFile, "", "utf8");

  const result = spawnSync("bash", [SCRIPT], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      BACKFILL_STAGING_SEARCH_SERVER_CMD: `node ${stubPath} ${port} ${hitsFile} ${outcome}`,
      BACKFILL_STAGING_SEARCH_PORT: String(port),
      BACKFILL_STAGING_SEARCH_LOG: logPath,
      ...extraEnv,
    },
  });
  const log = existsSync(logPath) ? readFileSync(logPath, "utf8") : "";
  const hits = readFileSync(hitsFile, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean);
  return { ...result, hits, log };
}

describe("backfill-staging-search.sh", () => {
  it("fires the search-index cron exactly once, and never the PSD sync", async () => {
    const r = await run("ok");
    expect(r.status, r.log).toBe(0);
    expect(r.hits).toHaveLength(1);
    const url = new URL(r.hits[0]!, "http://localhost");
    expect(url.pathname).toBe("/__scheduled");
    expect(url.searchParams.get("cron")).toBe("30 2 * * *");
  });

  it("names the target index and dataset before it writes", async () => {
    const r = await run("ok");
    expect(r.stdout).toContain("Vectorize index : kcvv-search-staging");
    expect(r.stdout).toContain("Sanity dataset  : staging");
  });

  it("exits non-zero when the sweep settles as failed", async () => {
    const r = await run("failed");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("failed");
  });

  it("refuses a wrangler.toml that points staging at the production index, before starting anything", async () => {
    const toml = join(dir, "wrangler-prod-index.toml");
    writeFileSync(
      toml,
      readFileSync(join(repoRoot, "apps/api/wrangler.toml"), "utf8").replaceAll(
        '"kcvv-search-staging"',
        '"kcvv-search"',
      ),
      "utf8",
    );
    const r = await run("ok", { BACKFILL_STAGING_SEARCH_WRANGLER_TOML: toml });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("refusing");
    expect(r.hits).toEqual([]);
  });
});
