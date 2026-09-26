/**
 * The anti-no-op half of the structural-assertion mechanism (#2861,
 * `structural-assertions.ts` in this same directory). `postVisit` in
 * `.storybook/test-runner.ts` only runs an assertion when a story is tagged
 * for it — which means a renamed or deleted tag makes the assertion vanish
 * silently, exactly the failure mode this whole mechanism exists to close
 * (the guard it replaces, `apps/web/test/e2e/scroll-arrows.spec.ts`'s
 * StandingsTable case, `test.skip()`s itself whenever the live sitemap
 * doesn't happen to carry a numbered table).
 *
 * This file runs as plain Vitest — part of the web gate
 * (`turbo run … --filter=@kcvv/web`) — so a broken tag fails fast, long before (and far more often
 * than) a 25–60 minute VR pass would ever catch it. Three ways a tag can be
 * present in a file yet never actually run in `postVisit` (review #2861):
 *
 *   1. **In a comment, not a `tags:` array.** A raw substring search over
 *      the whole file text matches a JSDoc example, a "don't use this tag"
 *      note, or a commented-out story just as readily as a live
 *      declaration. Fixed by parsing actual `tags: [...]` array literals
 *      out of comment-stripped source, not grepping the raw file.
 *   2. **The tagged story is excluded from the VR run itself.** The run is
 *      `test-storybook --includeTags vr --excludeTags vr-skip`
 *      (`apps/web/package.json`) — a story only gets visited, and its
 *      `postVisit` only runs, when its COMBINED tags (`combineTags` unions
 *      meta-level `tags` with the story's own — confirmed against
 *      `prepareStory`) include `vr` and exclude `vr-skip`. A tag can be
 *      textually present on a story whose meta never opted into `vr`, or
 *      that also carries `vr-skip` (on the story itself, or on the file's
 *      meta — which disables every story in the file) — reactive additions
 *      after a CI OOM/crash flake, exactly the kind of edit nobody thinks
 *      to cross-check against this mechanism.
 *   3. **A file extension this scan didn't look at.** `.storybook/main.ts`
 *      registers `../src/**\/*.stories.@(js|jsx|mjs|ts|tsx)` — a tag on a
 *      plain-TS `.stories.ts` file (no JSX required) is real and running,
 *      but a `.tsx`-only glob here would call it "nowhere referenced".
 *
 * `it.each` over the registry itself, mirroring
 * `apps/web/src/app/__tests__/cross-page-consistency.test.ts`'s "an empty
 * case list fails the run on its own" shape — Vitest rejects an `it.each`
 * with zero cases, so `STRUCTURAL_ASSERTIONS` accidentally emptying out
 * can't silently pass this file either.
 */
import { describe, expect, it } from "vitest";
import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { STRUCTURAL_ASSERTIONS } from "./structural-assertions";

const srcDir = resolve(__dirname, "../../src");
// Mirrors `.storybook/main.ts`'s own `stories` glob exactly — see class 3
// in the file doc above.
const storyFiles = globSync("**/*.stories.{js,jsx,mjs,ts,tsx}", {
  cwd: srcDir,
}).sort();

/**
 * Comment/string-stripping pass borrowed from
 * `apps/web/src/app/__tests__/cross-page-consistency.test.ts`: strips both
 * line and block comments — which could otherwise carry a tag string in a
 * JSDoc example or an explanatory note — while leaving string literals
 * (where a real `tags: [...]` entry lives) untouched.
 */
const COMMENT_OR_STRING =
  /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

function stripComments(code: string): string {
  return code.replace(COMMENT_OR_STRING, (token) =>
    token.startsWith("/") ? "" : token,
  );
}

interface TagsArrayMatch {
  /** Offset of the match within the (comment-stripped) source it was found in. */
  index: number;
  tags: string[];
}

/** Every `tags: [...]` array literal in `code`, comment-stripped source
 * expected — `\b` keeps this from matching a differently-named field that
 * merely ends in "tags" (e.g. a hypothetical `storyTags:`). */
function findTagsArrays(code: string): TagsArrayMatch[] {
  const arrays: TagsArrayMatch[] = [];
  const re = /\btags\s*:\s*\[([^\]]*)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(code))) {
    const tags = Array.from(
      match[1]!.matchAll(/["']([^"']+)["']/g),
      (m) => m[1]!,
    );
    arrays.push({ index: match.index, tags });
  }
  return arrays;
}

/**
 * Approximates Storybook's `combineTags(meta.tags, story.tags)` for one
 * occurrence of a tag at `tagIndex` in comment-stripped `code` — a
 * text-based best effort, not a real CSF/AST parse, built on this repo's
 * established authoring convention: one meta object literal, then flat
 * top-level `export const <Name>` story exports, never nested (every
 * `*.stories.tsx` file in the tree follows this shape).
 *
 * Splits the file at the first top-level `export const` into a "meta
 * region" (everything before — where `const meta = {...}` or an inline
 * `export default { ... } satisfies Meta<...>` lives) and a "stories
 * region", further split at each subsequent `export const` boundary so
 * every story owns only the tags array(s) inside its own block. Returns
 * the union of the meta region's tags with whichever block contains
 * `tagIndex` — the same union `combineTags` performs at runtime.
 */
function effectiveTagsAt(code: string, tagIndex: number): Set<string> {
  const firstExportConst = code.search(/^export const /m);
  const metaRegionEnd =
    firstExportConst === -1 ? code.length : firstExportConst;
  const metaTags = findTagsArrays(code.slice(0, metaRegionEnd)).flatMap(
    (a) => a.tags,
  );

  if (tagIndex < metaRegionEnd) {
    // Declared on the meta object itself — every story in the file inherits it.
    return new Set(metaTags);
  }

  const storiesRegion = code.slice(metaRegionEnd);
  const relativeIndex = tagIndex - metaRegionEnd;
  const boundaries = Array.from(
    storiesRegion.matchAll(/^export const /gm),
    (m) => m.index!,
  );
  let blockStart = 0;
  let blockEnd = storiesRegion.length;
  for (let i = 0; i < boundaries.length; i++) {
    if (boundaries[i]! <= relativeIndex) {
      blockStart = boundaries[i]!;
      blockEnd = boundaries[i + 1] ?? storiesRegion.length;
    }
  }
  const ownTags = findTagsArrays(
    storiesRegion.slice(blockStart, blockEnd),
  ).flatMap((a) => a.tags);

  return new Set([...metaTags, ...ownTags]);
}

describe("structural VR assertion tags stay wired to a story the VR run actually visits", () => {
  it.each(STRUCTURAL_ASSERTIONS)(
    'tag "$tag" is applied, via a real `tags:` array, to a story whose combined tags include "vr" and exclude "vr-skip"',
    ({ tag, description }) => {
      let matchCount = 0;

      for (const relPath of storyFiles) {
        const code = stripComments(
          readFileSync(resolve(srcDir, relPath), "utf8"),
        );
        const owningArrays = findTagsArrays(code).filter((a) =>
          a.tags.includes(tag),
        );

        for (const { index } of owningArrays) {
          matchCount++;
          const effectiveTags = effectiveTagsAt(code, index);

          expect(
            effectiveTags.has("vr"),
            `${relPath} applies structural-assertion tag "${tag}" to a ` +
              `story whose combined tags (meta ∪ story) do not include ` +
              `"vr". The VR run is \`test-storybook --includeTags vr\` ` +
              `(apps/web/package.json) — it never visits this story, so ` +
              `the assertion never runs. (${description})`,
          ).toBe(true);
          expect(
            effectiveTags.has("vr-skip"),
            `${relPath} applies structural-assertion tag "${tag}" to a ` +
              `story whose combined tags (meta ∪ story) also include ` +
              `"vr-skip". The VR run excludes it ` +
              `(\`--excludeTags vr-skip\`), so the assertion never runs. ` +
              `(${description})`,
          ).toBe(false);
        }
      }

      expect(
        matchCount,
        `No *.stories.{js,jsx,mjs,ts,tsx} file applies the structural-` +
          `assertion tag "${tag}" inside a real \`tags:\` array ` +
          `(${description}). If it was renamed, removed, or only survives ` +
          `in a comment, the postVisit check in .storybook/test-runner.ts ` +
          `silently stops running — restore the tag on a story, or delete ` +
          `this entry from STRUCTURAL_ASSERTIONS in structural-assertions.ts.`,
      ).toBeGreaterThan(0);
    },
  );
});
