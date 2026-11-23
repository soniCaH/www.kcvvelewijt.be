#!/usr/bin/env node
// Fails when a CLAUDE.md or docs/ file names a repo path in backticks that does not exist (#3839).
// Run from anywhere: `node scripts/check-doc-paths.mjs`. Reads tracked files only (`git ls-files`).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Archived history names files that were deleted on purpose; rewriting it would falsify it.
// Research notes describe other repos, old stacks and measurements, not this tree.
export const EXCLUDED_PREFIXES = [
  "docs/prd/archive/",
  "docs/plans/",
  "docs/research/",
  // Locked design records: each names the components as they were when the design was decided.
  "docs/design/mockups/",
  // Point-in-time audits and reviews: each cites code, with line numbers, as it was on the day
  // it was written, including files the audit itself says were retired or moved.
  "docs/design/articles-query-interface.md",
  "docs/design/delight-wayfinder-map.md",
  "docs/design/interview-multi-subject-review.md",
  "docs/design/ploegen-wayfinder-map.md",
  "docs/pre-go-live-remarks.md",
];

// A token with no extension counts as a path only when it starts at one of these
// top-level dirs; `next/image` or `effect/Schema` are package imports, not files.
const TOP_LEVEL_DIRS = new Set([
  "apps",
  "packages",
  "docs",
  "scripts",
  ".github",
  ".claude",
  ".husky",
]);

// Installed or generated, never tracked: a doc may name them without a CI checkout holding them.
const IGNORED_PREFIXES = [
  "node_modules/",
  ".next/",
  "dist/",
  // Next.js internals that docs/agents/testing-ops.md cites; they live in node_modules.
  "next/dist/",
  // Playwright's diff output, written by a failing VR run.
  "apps/web/test/vr/__diff_output__",
];

// Paths a doc names that only exist after a build, a typegen or a local setup, so a CI
// checkout cannot resolve them. Each needs its one-line why.
export const GENERATED_OR_LOCAL = new Set([
  // Gitignored, copied in by hand per machine.
  "apps/web/.env.local",
  "apps/api/.dev.vars",
  // The ADR folder is created with the first ADR (.claude/CLAUDE.md → Domain docs).
  "docs/adr",
]);

// An allowlist, not "any dot": `soniCaH/www.kcvvelewijt.be` is a GitHub slug, not a file.
const FILE_EXTENSION =
  /\.(tsx?|jsx?|mjs|cjs|json|jsonc|md|mdx|ya?ml|css|sh|html|txt|xlsx?|png|jpe?g|webp|svg|py)$/;

// Fenced blocks hold trees, command output and samples, not claims about the tree.
const stripFences = (markdown) =>
  markdown.replace(/^[ \t]*(```|~~~)[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, "");

// Turns one backticked token into a repo path candidate, or null when it is not one.
export const toCandidate = (token) => {
  // Command lines, placeholders, globs, URLs, routes (`/club`), home paths and
  // regex/JSX fragments are not files.
  if (/[\s<>*?{}$|=,;!"'`\\^]/.test(token)) return null;
  if (/^(https?:|~|\/|\.+$|\.{3}|@)/.test(token)) return null;
  // `file.ts:42` and `file.ts#L10` point into a file; the file is the claim.
  const file = token.replace(/(:\d+(-\d+)?|#.*)$/, "").replace(/\/$/, "");
  if (!file.includes("/")) return null;
  const segments = file.split("/");
  const hasExtension = FILE_EXTENSION.test(segments.at(-1));
  if (!hasExtension && !TOP_LEVEL_DIRS.has(segments[0])) return null;
  // `www.kcvvelewijt.be/foo.txt` is a URL without a scheme, not a repo path.
  if (
    /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(segments[0]) &&
    !segments[0].startsWith(".")
  ) {
    return null;
  }
  return file;
};

export const extractCandidates = (markdown) => {
  const spans = stripFences(markdown).matchAll(/(?<!`)`([^`\n]+)`(?!`)/g);
  return [...spans].map((m) => toCandidate(m[1])).filter(Boolean);
};

// Docs write paths from the repo root (`apps/web/src/...`), from their own workspace
// (`src/lib/...`), relative to themselves (`../x`) or as a shorthand under a source dir
// (`webhooks/index-handler.ts` in apps/api/CLAUDE.md means apps/api/src/webhooks/...).
// So a path resolves when an ancestor directory of the doc holds it, or, for a path that
// does not start at a top-level dir, when any tracked path ends in it.
// shortcut: the suffix match can pass a stale path when a same-named file lives elsewhere;
// tighten if a real stale path slips through.
export const resolves = (docFile, candidate, tracked) => {
  if (GENERATED_OR_LOCAL.has(candidate)) return true;
  if (IGNORED_PREFIXES.some((prefix) => candidate.startsWith(prefix)))
    return true;
  for (let dir = path.dirname(docFile); ; dir = path.dirname(dir)) {
    if (tracked.has(path.posix.normalize(path.posix.join(dir, candidate))))
      return true;
    if (dir === ".") break;
  }
  if (TOP_LEVEL_DIRS.has(candidate.split("/")[0])) return false;
  const tail = `/${candidate.replace(/^\.\.\//, "")}`;
  return [...tracked].some((entry) => entry.endsWith(tail));
};

export const findMissing = (docFile, markdown, tracked) =>
  [...new Set(extractCandidates(markdown))].filter(
    (candidate) => !resolves(docFile, candidate, tracked),
  );

// Every tracked file plus every directory above one, so a doc may name a folder too.
export const trackedPaths = (files) => {
  const all = new Set();
  for (const file of files) {
    for (let p = file; p !== "." && !all.has(p); p = path.posix.dirname(p))
      all.add(p);
  }
  return all;
};

export const isChecked = (file) =>
  /(^|\/)CLAUDE\.md$/.test(file) ||
  (file.startsWith("docs/") &&
    file.endsWith(".md") &&
    !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)));

const main = () => {
  const tracked = execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\n")
    .filter(Boolean);
  const files = tracked.filter(isChecked);
  const known = trackedPaths(tracked);
  const failures = files.flatMap((file) =>
    findMissing(
      file,
      readFileSync(path.join(repoRoot, file), "utf8"),
      known,
    ).map((candidate) => `${file}: \`${candidate}\` does not exist`),
  );
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    console.error(
      `\n${failures.length} backticked path(s) point at a missing file. Fix the path or delete the line.`,
    );
    process.exit(1);
  }
  console.log(`doc paths ok (${files.length} files checked)`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
