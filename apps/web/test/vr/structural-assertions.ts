/**
 * Registry behind the fourth throw-family in `.storybook/test-runner.ts`'s
 * `postVisit` block (#2861). A "structural assertion" is an opt-in,
 * tag-scoped check on a story's rendered DOM — beyond the pixel-snapshot
 * comparison every `vr`-tagged story already gets — that the VR run fails
 * loudly if the underlying invariant breaks, on a deterministic Storybook
 * fixture rather than on whatever the live dataset happens to contain that
 * day.
 *
 * The shape deliberately mirrors the existing `vr-skip` tag contract: a
 * plain story tag opts a story in, no extra `parameters.vr.*` plumbing
 * required. `postVisit` reads `story.tags` (see `getStoryContext` in
 * `.storybook/test-runner.ts`) and looks up which entries here apply.
 *
 * **Why a registry, not an inline conditional:** the ticket that introduced
 * this (#2861) exists because the *previous* guard for "does the standings
 * table overflow at mobile" only ran against live production data
 * (`apps/web/test/e2e/scroll-arrows.spec.ts`) and skipped itself whenever no
 * team or match in that day's sitemap happened to render a numbered table —
 * the normal pre-season state. A hard-coded story id in a `postVisit`
 * `if` branch would reproduce the same failure mode one level up: rename or
 * delete the story and the check silently stops running, with nothing in
 * the tree to say so. Two things close that gap instead:
 *
 *   1. The tag lives on the *story*, not on this file, so any story anywhere
 *      can opt in without touching `postVisit` again — the next such
 *      assertion is a new entry here plus a tag on a story, not new
 *      branching logic.
 *   2. `structural-assertions.test.ts` (this directory) statically greps
 *      every `*.stories.tsx` file for each registered tag and fails the
 *      **Vitest** suite — part of `pnpm --filter @kcvv/web check-all`,
 *      which runs far more often and far faster than a full VR pass — the
 *      moment a tag stops being referenced anywhere. Renaming or deleting
 *      the tagged story trips that guard immediately instead of the
 *      assertion just quietly never firing again.
 */
import type { VrViewportName } from "./viewport-scoping";

export interface StructuralAssertion {
  /** Story tag that opts a story into this assertion. Add it to a story
   * export's own `tags` array (it merges with the meta-level `tags`, same
   * as `vr-skip`) — never gate on a story id. */
  tag: string;
  /** One-line explanation surfaced in the `postVisit` throw message and
   * cross-referenced by the static coverage test below. */
  description: string;
  /** The VR viewport (see `viewport-scoping.ts`) this assertion measures
   * at. The tagged story must actually request this viewport — `postVisit`
   * throws if `parameters.vr.viewports` excludes it, since that would be
   * another silent no-op. */
  viewport: VrViewportName;
  /** CSS selector, relative to the story's rendered root, for the single
   * scrollable "track" element whose `scrollWidth` vs `clientWidth` proves
   * (or disproves) the overflow this assertion exists to guard. Must match
   * exactly one element — `postVisit` throws otherwise. */
  trackSelector: string;
}

export const STRUCTURAL_ASSERTIONS: readonly StructuralAssertion[] = [
  {
    tag: "vr-assert-mobile-overflow",
    description:
      "StandingsTable's numbered scroll track must overflow at the mobile " +
      "viewport (#2861) — a deterministic-fixture backstop for " +
      "apps/web/test/e2e/scroll-arrows.spec.ts's live-data case, which " +
      "test.skip()s itself whenever no team/match in the current sitemap " +
      "renders a numbered table (the normal pre-season state).",
    viewport: "mobile",
    trackSelector: '[data-testid="standings-table"] [role="region"]',
  },
];
