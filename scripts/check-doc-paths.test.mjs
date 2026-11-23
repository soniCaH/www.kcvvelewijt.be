// Run with `pnpm test:doc-paths` (node:test, no dependencies).
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractCandidates,
  findMissing,
  isChecked,
  toCandidate,
  trackedPaths,
} from "./check-doc-paths.mjs";

const tracked = trackedPaths([
  "apps/web/src/lib/icons.ts",
  "apps/api/src/psd/service.ts",
  "docs/agents/ralph.md",
]);

test("toCandidate keeps repo paths and strips line suffixes", () => {
  assert.equal(
    toCandidate("apps/web/src/lib/icons.ts"),
    "apps/web/src/lib/icons.ts",
  );
  assert.equal(
    toCandidate("apps/web/src/lib/icons.ts:42"),
    "apps/web/src/lib/icons.ts",
  );
  assert.equal(toCandidate("apps/web/a.ts:12:5"), "apps/web/a.ts");
  assert.equal(toCandidate("apps/web/a.ts:12-20"), "apps/web/a.ts");
  assert.equal(toCandidate("apps/web/a.ts#L10"), "apps/web/a.ts");
  assert.equal(toCandidate("docs/agents/"), "docs/agents");
  assert.equal(
    toCandidate("app/(main)/club/page.tsx"),
    "app/(main)/club/page.tsx",
  );
});

test("toCandidate skips what is not a repo file", () => {
  for (const token of [
    "pnpm test",
    "apps/web/src/<name>.ts",
    "src/**/*.ts",
    "https://example.com/a.ts",
    "~/Sites/a.ts",
    "/club/geschiedenis",
    "next/image",
    "soniCaH/www.kcvvelewijt.be",
    "www.kcvvelewijt.be/llms.txt",
    "index.ts",
    ".../react/index.js",
  ]) {
    assert.equal(toCandidate(token), null, token);
  }
});

test("extractCandidates ignores fenced blocks", () => {
  const md = [
    "See `apps/web/a.ts`.",
    "```text",
    "`apps/web/in-fence.ts`",
    "```",
    "`docs/b.md`",
  ].join("\n");
  assert.deepEqual(extractCandidates(md), ["apps/web/a.ts", "docs/b.md"]);
});

test("extractCandidates ends a fence at a closing fence as long as its opening", () => {
  const md = [
    "````md",
    "```text",
    "`apps/web/in-fence.ts`",
    "```",
    "`apps/web/still-in-fence.ts`",
    "````",
    "`docs/b.md`",
  ].join("\n");
  assert.deepEqual(extractCandidates(md), ["docs/b.md"]);
});

test("findMissing passes a path from the root, the doc's workspace or a source-dir shorthand", () => {
  const md =
    "`apps/web/src/lib/icons.ts` `src/lib/icons.ts` `psd/service.ts` `../agents/ralph.md`";
  assert.deepEqual(findMissing("apps/web/CLAUDE.md", md, tracked), []);
  assert.deepEqual(
    findMissing("docs/design/x.md", "`../agents/ralph.md`", tracked),
    [],
  );
});

test("findMissing flags a missing file", () => {
  assert.deepEqual(
    findMissing(
      "docs/a.md",
      "`apps/web/src/lib/gone.ts` and `apps/api/src/psd/service.ts`",
      tracked,
    ),
    ["apps/web/src/lib/gone.ts"],
  );
  assert.deepEqual(findMissing("docs/a.md", "`psd/gone.ts`", tracked), [
    "psd/gone.ts",
  ]);
});

test("isChecked covers CLAUDE.md and docs, minus the archive list", () => {
  assert.equal(isChecked("apps/web/CLAUDE.md"), true);
  assert.equal(isChecked("docs/agents/ralph.md"), true);
  assert.equal(isChecked("docs/prd/archive/2026/a.md"), false);
  assert.equal(isChecked("docs/research/a.md"), false);
  assert.equal(isChecked("README.md"), false);
});
