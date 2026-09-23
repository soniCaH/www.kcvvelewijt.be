// @vitest-environment node
/**
 * One command surface for visual regression (#3140).
 *
 * Capturing a baseline has one local entrypoint per mode, and all of them route
 * through `apps/web/scripts/vr-docker.mjs`. The wrapper refuses an unscoped run,
 * rebuilds Storybook, and runs the capture inside the `platform: linux/amd64`
 * container from `docker-compose.vr.yml`. Each raw form gives up a different
 * part of that: the runner and the native update scripts capture on arm64,
 * which does not match CI (#2370); a hand-written `docker compose … run vr`
 * keeps the pin but skips the rebuild and the scoping guard (#2380).
 *
 * Agent-facing docs handed out two of them anyway — the AFK brief and
 * `apps/web/CLAUDE.md` both taught a bare `-u <prefix>` — which is what this
 * test exists to stop.
 *
 * The patterns match command shapes, not mentions: prose may still explain that
 * a pattern has to follow `-u`, or that CI calls `vr:ci:update`, because neither
 * is something an agent can copy and run.
 *
 * Deliberately still allowed: `vr:run` / `vr:run:single`, the native compare
 * runs `docs/agents/testing-ops.md` sanctions for OOM triage. They carry no
 * `-u`, so they cannot write a baseline.
 *
 * Out of scope: `docs/research/`, `docs/prd/` and `docs/plans/`. Those are dated
 * records, and quoting the raw form is what a record is for.
 */
import { globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
);

/** The files an agent is told to read and act on. */
const SURFACE = [
  ".claude/CLAUDE.md",
  "apps/web/CLAUDE.md",
  ...globSync(
    [
      ".claude/agents/**/*.md",
      ".claude/commands/**/*.md",
      ".claude/skills/**/*.md",
      "docs/agents/**/*.md",
    ],
    { cwd: ROOT },
  ).sort(),
];

const SCOPED_CAPTURE =
  "pnpm --filter @kcvv/web run vr:update:story -- <story-id-prefix>";

const FORBIDDEN: {
  what: string;
  pattern: RegExp;
  unless?: RegExp;
  instead: string;
}[] = [
  {
    what: "the raw container command",
    // Both spellings of the binary, but only when the line actually runs the
    // service. `[^`]*` cannot cross a backtick, so prose naming the file —
    // "`docker-compose.vr.yml` pins the `vr` service" — stays legal.
    pattern: /docker[-\s]compose\b[^`]*\brun\b[^`]*\bvr\b/,
    instead: `${SCOPED_CAPTURE} — the compose file keeps the amd64 pin, but a hand-written run skips the Storybook rebuild and the scoping guard`,
  },
  {
    what: "the raw runner",
    // The binary followed by a flag is an invocation. Naming `test-storybook`
    // in a sentence is not.
    pattern: /\btest-storybook\s+--?\w/,
    instead:
      "name the vr:* script, or the flags alone without the binary — an invocation here skips Docker and captures on arm64",
  },
  {
    what: "the raw update flag",
    // `-u` carrying a pattern is the teaching form. A bare `-u` inside prose is
    // an explanation, so it stays legal. The exemption is anchored to a git
    // subcommand (`git push -u origin …`) rather than the whole line, so a line
    // that runs both a capture and a git command is still caught.
    // ponytail: git is the only exemption. A future doc writing `curl -u` or
    // `docker run -u 1000` trips this with a VR message — widen the list then,
    // not before.
    pattern: /(?:^|[\s`])-u\s+[^\s`-]/,
    unless: /\bgit\s+\w+[^|&;]*\s-u\s/,
    instead: `${SCOPED_CAPTURE} — a bare -u captures on arm64`,
  },
  {
    what: "a native update script",
    // `vr:run:update` / `vr:ci:update` are CI's entrypoints: `test-storybook -u`
    // with no wrapper and no container. Only a copy-pasteable invocation is
    // forbidden — prose saying which script CI calls is not a call site.
    pattern: /\b(?:pnpm|npm|corepack|yarn)\b[^`]*\bvr:(?:run|ci):update\b/,
    instead: `${SCOPED_CAPTURE} — the native update scripts belong to CI, which already runs on amd64`,
  },
];

const bypasses = (file: string): string[] =>
  readFileSync(join(ROOT, file), "utf8")
    .split("\n")
    .flatMap((text, index) =>
      FORBIDDEN.filter(
        (rule) => rule.pattern.test(text) && !rule.unless?.test(text),
      ).map(
        (rule) =>
          `${file}:${index + 1} names ${rule.what}\n    ${text.trim()}\n    use instead: ${rule.instead}`,
      ),
    );

describe("the visual-regression command surface", () => {
  it("still reaches every globbed directory", () => {
    // One file per glob: a renamed or moved directory silently empties its
    // pattern, and `it.each` below would then pass by scanning nothing.
    expect(SURFACE).toEqual(
      expect.arrayContaining([
        ".claude/agents/kcvv-implementer.md",
        ".claude/commands/ralph.md",
        ".claude/skills/ralph-afk/AFK-BRIEF.md",
        "docs/agents/testing-ops.md",
      ]),
    );
  });

  it.each(SURFACE)("%s reaches VR only through the wrapper", (file) => {
    expect(bypasses(file).join("\n")).toBe("");
  });
});
