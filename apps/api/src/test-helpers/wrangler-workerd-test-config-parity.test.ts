import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `wrangler.workerd-test.jsonc` (vitest.workers.config.ts's test-only Worker
 * config) hand-copies `compatibility_date`, `compatibility_flags`, and the
 * `PsdGate` Durable Object migration off the real `wrangler.toml` — nothing
 * enforces that the copy stays equal as the real config changes. This is a
 * pure-logic check (parsing two committed text files), so it runs on
 * `node`, not `workers` — it asserts nothing about runtime behaviour, only
 * that the two files agree (#3145 review).
 */

// ─── Two deliberately tiny, scoped readers — no TOML/JSONC dependency ──────
//
// Mirrors webhooks/wrangler-config.test.ts's own reasoning: apps/api has no
// TOML parser, and this test adds none. Each reader only understands what
// its one file actually contains.

/** `key = ["a", "b"]` → `["a", "b"]`. `undefined` if the bracketed group
 * itself is `undefined` (regex didn't match) rather than merely empty. */
function parseStringArray(bracketed: string | undefined): string[] | undefined {
  return bracketed
    ?.split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function readWranglerTomlTopLevel(source: string) {
  // Everything before the first `[section]`/`[[section]]` header — the root
  // config, before any `[env.*]` override block.
  const topLevel = source.split(/\n\[/)[0]!;
  const date = /^compatibility_date\s*=\s*"([^"]*)"/m.exec(topLevel)?.[1];
  const flags = parseStringArray(
    /^compatibility_flags\s*=\s*\[([^\]]*)\]/m.exec(topLevel)?.[1],
  );
  const migrationClasses = parseStringArray(
    /new_sqlite_classes\s*=\s*\[([^\]]*)\]/.exec(source)?.[1],
  );
  return { date, flags, migrationClasses };
}

function readWorkerdTestConfig(source: string) {
  // Strip `//` line comments — wrangler.workerd-test.jsonc is JSONC, and
  // JSON.parse doesn't tolerate them.
  const stripped = source.replace(/^\s*\/\/.*$/gm, "");
  const config = JSON.parse(stripped) as {
    compatibility_date?: string;
    compatibility_flags?: string[];
    migrations?: { new_sqlite_classes?: string[] }[];
  };
  return {
    date: config.compatibility_date,
    flags: config.compatibility_flags,
    migrationClasses: config.migrations?.flatMap(
      (m) => m.new_sqlite_classes ?? [],
    ),
  };
}

describe("wrangler.workerd-test.jsonc stays in lock-step with wrangler.toml", () => {
  const real = readWranglerTomlTopLevel(
    readFileSync(join(__dirname, "..", "..", "wrangler.toml"), "utf-8"),
  );
  const test = readWorkerdTestConfig(
    readFileSync(
      join(__dirname, "..", "..", "wrangler.workerd-test.jsonc"),
      "utf-8",
    ),
  );

  it("compatibility_date matches", () => {
    expect(real.date).toBeDefined();
    expect(test.date).toBe(real.date);
  });

  it("compatibility_flags matches", () => {
    expect(real.flags).toBeDefined();
    expect(test.flags).toEqual(real.flags);
  });

  it("the PsdGate Durable Object migration's class name matches", () => {
    expect(real.migrationClasses).toBeDefined();
    expect(test.migrationClasses).toEqual(real.migrationClasses);
  });
});
