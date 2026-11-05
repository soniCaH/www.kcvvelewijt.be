// @vitest-environment node
/**
 * The `ralph-config` block in `docs/agents/ralph.md` (#3715). The shared ralph
 * core reads it with `awk` + `eval` and feeds the surfaces to `grep -E`; a
 * mangled pattern there makes `wave-check.sh` match nothing and report every
 * wave clean. This reads the block the way the core does and runs the real
 * `grep -E` against known paths.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).stdout.trim();
const CONFIG = join(repoRoot, "docs", "agents", "ralph.md");

/** Same extraction as `~/personal-skills/ralph-afk/scripts/config.sh`. */
const READ_BLOCK = `eval "$(awk '/^\`\`\`sh ralph-config[[:space:]]*$/ { f = 1; next } f && /^\`\`\`[[:space:]]*$/ { exit } f' "$CONFIG")"`;

const configValue = (name: string) =>
  spawnSync("bash", ["-c", `${READ_BLOCK}; printf '%s' "\${${name}}"`], {
    encoding: "utf8",
    env: { ...process.env, CONFIG },
  }).stdout;

const matches = (surface: string, path: string) =>
  spawnSync("grep", ["-qE", configValue(surface)], { input: `${path}\n` })
    .status === 0;

describe("docs/agents/ralph.md ralph-config", () => {
  it("names the worktree prefix", () => {
    expect(configValue("SHORT")).toBe("kcvv");
  });

  it.each([
    "apps/web/eslint.config.mjs",
    "commitlint.config.js",
    ".husky/pre-commit",
    ".claude/hooks/check-branch.sh",
    "apps/web/src/__tests__/copy-consistency.test.ts",
  ])("RULE_SURFACE matches %s", (path) => {
    expect(matches("RULE_SURFACE", path)).toBe(true);
  });

  it("RULE_SURFACE leaves plain source alone", () => {
    expect(matches("RULE_SURFACE", "apps/web/src/app/page.tsx")).toBe(false);
  });

  it.each(["apps/api/src/index.ts", "packages/api-contract/src/index.ts"])(
    "CODE_SURFACE matches %s",
    (path) => {
      expect(matches("CODE_SURFACE", path)).toBe(true);
    },
  );

  it("CODE_SURFACE leaves docs alone", () => {
    expect(matches("CODE_SURFACE", "docs/agents/ralph.md")).toBe(false);
  });

  it("LOCKFILE_SURFACE matches the lockfile", () => {
    expect(matches("LOCKFILE_SURFACE", "pnpm-lock.yaml")).toBe(true);
  });
});
