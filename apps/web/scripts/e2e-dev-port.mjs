#!/usr/bin/env node
// Derives a per-worktree TCP port for the Playwright e2e dev server (#3141
// member 5). Playwright's `webServer.reuseExistingServer` matches purely on
// the URL it is told to poll, so two worktrees that both default to `:3000`
// let a second lane's e2e run silently reuse the first lane's server and test
// the wrong build — it does not fail, it lies. Deriving the port from the
// worktree's own absolute path means two worktrees only collide if their
// paths hash into the same slot, and a repeat run of the SAME worktree still
// legitimately reuses its own server, because the path — and therefore the
// port — never changes between runs.
//
// The range stays BELOW 32768 on purpose: Linux's ephemeral port range
// (net.ipv4.ip_local_port_range, 32768–60999 by default — the range CI's
// container runs under) can hand out any port at or above 32768 to an
// unrelated outbound connection at any moment, which would then collide with
// a derived port up there. Below 32768 is reserved for services that bind a
// specific port, which is exactly what this is.
//
// This file exports ONLY the pure function, deliberately: it is `import`ed
// by test/e2e/playwright.config.ts, which Playwright loads through its own
// CJS/ESM interop layer — a module here that touches `import.meta.url` at
// import time breaks that loader ("exports is not defined in ES module
// scope"). The path-resolving CLI lives in `scripts/e2e-port-cli.mjs`
// instead, which nothing imports.
import { createHash } from "node:crypto";

const PORT_RANGE_START = 20000;
const PORT_RANGE_SIZE = 10000;

/**
 * @param {string} worktreePath an absolute path unique to one worktree, e.g.
 *   the e2e config directory's own path — every worktree checks this file
 *   out at a different absolute path.
 * @returns {number} a port in [20000, 30000), deterministic for the same path.
 */
export function derivePort(worktreePath) {
  const digest = createHash("sha256").update(worktreePath).digest();
  return PORT_RANGE_START + (digest.readUInt16BE(0) % PORT_RANGE_SIZE);
}
