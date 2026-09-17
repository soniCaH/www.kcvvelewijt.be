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
 * This file statically greps every `*.stories.tsx` file for each registered
 * tag and fails if a tag is referenced nowhere. It runs as plain Vitest —
 * part of `pnpm --filter @kcvv/web check-all` — so a dropped tag fails fast,
 * long before (and far more often than) a 25–60 minute VR pass would ever
 * catch it.
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
const storyFiles = globSync("**/*.stories.tsx", { cwd: srcDir }).sort();

describe("structural VR assertion tags stay wired to a story", () => {
  it.each(STRUCTURAL_ASSERTIONS)(
    'tag "$tag" is referenced by at least one *.stories.tsx file',
    ({ tag, description }) => {
      const referencingFiles = storyFiles.filter((relPath) => {
        const code = readFileSync(resolve(srcDir, relPath), "utf8");
        return code.includes(`"${tag}"`) || code.includes(`'${tag}'`);
      });

      expect(
        referencingFiles.length,
        `No *.stories.tsx file references the structural-assertion tag ` +
          `"${tag}" (${description}). If it was renamed or the tagged ` +
          `story was deleted, the postVisit check in ` +
          `.storybook/test-runner.ts silently stops running — restore the ` +
          `tag on a story, or delete this entry from ` +
          `STRUCTURAL_ASSERTIONS in structural-assertions.ts.`,
      ).toBeGreaterThan(0);
    },
  );
});
