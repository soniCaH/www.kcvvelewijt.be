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
import { createHash } from "node:crypto";

const PORT_RANGE_START = 30000;
const PORT_RANGE_SIZE = 10000;

/**
 * @param {string} worktreePath an absolute path unique to one worktree, e.g.
 *   this module's own `import.meta.dirname` — every worktree checks this file
 *   out at a different absolute path.
 * @returns {number} a port in [30000, 40000), deterministic for the same path.
 */
export function derivePort(worktreePath) {
  const digest = createHash("sha256").update(worktreePath).digest();
  return PORT_RANGE_START + (digest.readUInt16BE(0) % PORT_RANGE_SIZE);
}
