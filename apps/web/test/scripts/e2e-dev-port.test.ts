// @vitest-environment node
/**
 * `derivePort` (#3141 member 5) — the Playwright e2e dev server's port under
 * `reuseExistingServer`. Two worktrees defaulting to the same `:3000` let a
 * second lane silently reuse the first lane's server and test the wrong
 * build; a port derived from the worktree's own path keeps that from
 * happening while a repeat run of the SAME worktree still legitimately
 * reuses its own server.
 */
import { describe, expect, it } from "vitest";

import { derivePort } from "../../scripts/e2e-dev-port.mjs";

describe("derivePort", () => {
  it("returns a port in the documented range", () => {
    const port = derivePort("/Users/dev/Sites/KCVV/kcvv-issue-3141");

    expect(port).toBeGreaterThanOrEqual(30000);
    expect(port).toBeLessThan(40000);
  });

  it("is deterministic for the same worktree path", () => {
    const path = "/Users/dev/Sites/KCVV/kcvv-issue-3141";

    expect(derivePort(path)).toBe(derivePort(path));
  });

  it("gives different worktrees different ports", () => {
    const a = derivePort("/Users/dev/Sites/KCVV/kcvv-issue-3141");
    const b = derivePort("/Users/dev/Sites/KCVV/kcvv-issue-3150");
    const main = derivePort("/Users/dev/Sites/KCVV/www.kcvvelewijt.be");

    expect(new Set([a, b, main]).size).toBe(3);
  });

  it("returns an integer, never a fraction", () => {
    expect(Number.isInteger(derivePort("/Users/dev/Sites/KCVV/anything"))).toBe(
      true,
    );
  });
});
