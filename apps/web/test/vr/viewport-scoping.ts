/**
 * Pure predicate behind the third throw in `.storybook/test-runner.ts`'s
 * `postVisit` block (#2803) — see the comment on the two throws there for the
 * "silent VR skip" family this joins. A story can point the Storybook
 * preview at a narrow width two ways:
 *
 *   - `globals: { viewport: { value: "…" } }` — the live Storybook 10 API.
 *   - `parameters: { viewport: { defaultViewport: "…" } }` — removed in
 *     Storybook 10 (it is inert: it scopes neither the preview pane nor the
 *     VR capture), but still checked here in case a copy-pasted or
 *     AI-generated story sets it out of habit.
 *
 * Neither one is read by the VR runner, which captures
 * `parameters.vr.viewports` (or every viewport) regardless. A story that
 * sets either without declaring `vr.viewports` (or opting out via
 * `vr.disable`) looks scoped to its author but still gets every viewport
 * captured.
 *
 * Lives in its own module — rather than inline in `.storybook/test-runner.ts`
 * — purely so it is importable from a Vitest test
 * (`test/vr/viewport-scoping.test.ts`) without pulling test-runner.ts's own
 * Storybook/Playwright-facing imports into the type-check graph: `tsgo`
 * checks `.storybook/test-runner.ts` only as a root file matched by
 * `apps/web/tsconfig.json`'s recursive TypeScript glob today (nothing
 * imports it), and reaching it through another file's import graph — which
 * importing it
 * directly from a Vitest test would do — surfaced two pre-existing findings
 * in its body that are otherwise silent. postVisit still owns the actual
 * `throw`, alongside its two siblings, so all three read the same way at the
 * call site.
 *
 * `VR_VIEWPORT_NAMES` is the single source of truth for the runner's
 * viewport set, in capture order. `.storybook/test-runner.ts` derives its
 * `allViewportNames` fallback from it, and any story that deliberately wants
 * the full set as an explicit choice (rather than defaulting into it) can
 * spread it directly — `parameters: { vr: { viewports: [...VR_VIEWPORT_NAMES] } }`
 * — so a fourth viewport joining the set is picked up everywhere at once
 * instead of leaving a hand-copied array behind.
 */
export const VR_VIEWPORT_NAMES = ["mobile", "tablet", "desktop"] as const;

export type VrViewportName = (typeof VR_VIEWPORT_NAMES)[number];

export const unscopedViewportOverrideMessage = (
  storyId: string,
  effectiveViewport: string | undefined,
  hasVrViewportsDeclared: boolean,
): string | null => {
  if (!effectiveViewport || hasVrViewportsDeclared) return null;
  return (
    `[VR] Story "${storyId}" sets a Storybook viewport override ` +
    `("${effectiveViewport}", via globals.viewport.value or the ` +
    `Storybook-10-removed parameters.viewport.defaultViewport) without ` +
    `declaring parameters.vr.viewports or parameters.vr.disable. The VR ` +
    `runner reads neither and still captures every viewport unless one of ` +
    `those two says otherwise.`
  );
};
