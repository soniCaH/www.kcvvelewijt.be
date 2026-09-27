/**
 * Regression fixture for `scripts/backfill-staging-search.sh` (#2845).
 *
 * Same shape as `trigger-psd-sync.test.ts`: a stub server stands in for
 * `wrangler dev`, records every request, and prints the log lines the script
 * keys off. `BACKFILL_STAGING_SEARCH_SERVER_CMD` replaces the wrangler launch
 * and skips the vector-count read, so nothing reaches Cloudflare.
 *
 * What it pins: exactly one `/__scheduled` hit, for the search-index cron
 * only (never the `0 2 * * *` PSD sync); a failed sweep exits non-zero; a
 * config that would point staging at the production index is refused before
 * any server starts; and the secrets file wrangler gets has lost every
 * spelling of the two keys the dataset/index guard reads.
 *
 * Runs `/bin/bash`, not `bash` from PATH: the shebang's macOS bash is 3.2,
 * and a Homebrew bash 5 on PATH would hide a 3.2-only failure.
 */
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  existsSync,
  mkdirSync,
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
 * Stands in for `wrangler dev --env staging --remote --test-scheduled`. Copies
 * the secrets file the script built into the log, logs the `Ready on …` line,
 * then on `/__scheduled` the sweep's terminal line (`index.ts`), `ok` or
 * `failed` per argv. Appends every request's full URL to a file.
 */
const STUB_SERVER = `
import { createServer } from "node:http";
import { appendFileSync, readFileSync } from "node:fs";

const [port, hitsFile, outcome] = process.argv.slice(2);
console.log("ENV_FILE>>" + readFileSync(process.env.BACKFILL_STAGING_SEARCH_ENV_FILE, "utf8") + "<<ENV_FILE");

createServer((req, res) => {
  appendFileSync(hitsFile, req.url + "\\n");
  if (req.url.startsWith("/__scheduled")) {
    console.log("[search-sync] Indexed 12/12 articles");
    console.log("[scheduled] sanity-index-sync settled: " + outcome);
  }
  res.writeHead(200).end("ok");
}).listen(Number(port), () => {
  console.log("Ready on http://localhost:" + port);
});
`;

/** Every spelling wrangler's dotenv parser accepts, plus one real secret. */
const DEV_VARS = [
  "SANITY_DATASET=production",
  "export SEARCH_INDEX_NAME=kcvv-search",
  "SANITY_DATASET: production",
  "SANITY_API_TOKEN=secret-token",
  "",
].join("\n");

let dir = "";
let stubPath = "";
let devVarsDir = "";
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
  devVarsDir = join(dir, "api");
  mkdirSync(devVarsDir);
  writeFileSync(join(devVarsDir, ".dev.vars"), DEV_VARS, "utf8");
});

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

type Run = SpawnSyncReturns<string> & { hits: string[]; log: string };

async function run(
  outcome: "ok" | "failed",
  extraEnv: Record<string, string> = {},
): Promise<Run> {
  const n = seq++;
  const port = await freePort();
  const hitsFile = join(dir, `hits-${n}.txt`);
  const logPath = join(dir, `backfill-${n}.log`);
  writeFileSync(hitsFile, "", "utf8");

  const result = spawnSync("/bin/bash", [SCRIPT], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      BACKFILL_STAGING_SEARCH_SERVER_CMD: `node ${stubPath} ${port} ${hitsFile} ${outcome}`,
      BACKFILL_STAGING_SEARCH_PORT: String(port),
      BACKFILL_STAGING_SEARCH_LOG: logPath,
      BACKFILL_STAGING_SEARCH_DEV_VARS_DIR: devVarsDir,
      BACKFILL_STAGING_SEARCH_POLL_S: "0.05",
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
  /** One happy-path run, shared by every test that only reads its output. */
  let ok: Run;
  beforeAll(async () => {
    ok = await run("ok");
  });

  it("fires the search-index cron exactly once, and never the PSD sync", () => {
    expect(ok.status, ok.log).toBe(0);
    expect(ok.hits).toHaveLength(1);
    const url = new URL(ok.hits[0]!, "http://localhost");
    expect(url.pathname).toBe("/__scheduled");
    expect(url.searchParams.get("cron")).toBe("30 2 * * *");
  });

  it("names the target index and dataset before it writes, and reports what landed", () => {
    expect(ok.stdout).toContain("Vectorize index : kcvv-search-staging");
    expect(ok.stdout).toContain("Sanity dataset  : staging");
    expect(ok.stdout).toContain("[search-sync] Indexed 12/12 articles");
  });

  it("hands wrangler the secrets without any spelling of the two guarded keys", () => {
    const envFile = /ENV_FILE>>([\s\S]*)<<ENV_FILE/.exec(ok.log)?.[1];
    expect(envFile, ok.log).toBeDefined();
    expect(envFile).toContain("SANITY_API_TOKEN=secret-token");
    expect(envFile).not.toMatch(/SANITY_DATASET|SEARCH_INDEX_NAME/);
  });

  it("exits non-zero when the sweep settles as failed", async () => {
    const r = await run("failed");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("the sweep failed");
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

  it("refuses to start without a secrets file", async () => {
    const empty = join(dir, "no-secrets");
    mkdirSync(empty);
    const r = await run("ok", { BACKFILL_STAGING_SEARCH_DEV_VARS_DIR: empty });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("no .dev.vars");
    expect(r.hits).toEqual([]);
  });
});
