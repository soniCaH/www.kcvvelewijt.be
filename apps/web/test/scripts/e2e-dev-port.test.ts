// @vitest-environment node
/**
 * `derivePort` (#3141 member 5) — the Playwright e2e dev server's port. Two
 * worktrees defaulting to the same `:3000` let a second lane silently reuse
 * the first lane's server and test the wrong build; a port derived from the
 * worktree's own path keeps two worktrees from colliding at all, on top of
 * `webServer.reuseExistingServer: false` (playwright.config.ts) refusing to
 * reuse ANY already-listening port, colliding worktree or not.
 */
import { describe, expect, it } from "vitest";

import { derivePort } from "../../scripts/e2e-dev-port.mjs";
import { e2eConfigDir } from "../../scripts/e2e-port-cli.mjs";

describe("derivePort", () => {
  it("returns a port in the documented range, below Linux's ephemeral range", () => {
    const port = derivePort("/Users/dev/Sites/KCVV/kcvv-issue-3141");

    expect(port).toBeGreaterThanOrEqual(20000);
    expect(port).toBeLessThan(30000);
    // CI's container runs under Linux's default ephemeral range,
    // 32768–60999 — an unrelated outbound connection can be handed any port
    // in it at any moment. Staying below that avoids the collision class
    // entirely rather than merely making it unlikely.
    expect(port).toBeLessThan(32768);
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

describe("e2eConfigDir", () => {
  it("points at test/e2e — the exact directory playwright.config.ts derives its port from", () => {
    expect(e2eConfigDir()).toMatch(/apps[/\\]web[/\\]test[/\\]e2e$/);
  });
});
