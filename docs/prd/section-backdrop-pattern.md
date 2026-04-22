# PRD: Section Backdrop Pattern

**Status**: Ready for implementation
**Date**: 2026-04-22
**Issues**: TBD (primitive), #1350 (consumer migration)
**Blocked-by**: #1360

---

## 1. Problem statement

Several current and future home-page and feature-page sections need a **photographic or gradient backdrop** that extends seamlessly into the diagonal transition strips on either side — not only into the section's own content box.

Today, the only section that does this (`YouthSection`) achieves it by hand-rolling inline SVG diagonals and abusing a negative `marginTop` / `paddingBottom` pattern so its `<section>` physically extends into the neighboring sections' space. The shared `SectionTransition` primitive cannot express the pattern:

- In non-overlap mode, both triangles are painted opaque.
- In overlap mode, the transparent FROM triangle reveals the _previous_ section, not the current section's backdrop.

This already causes concrete problems:

- **Sub-pixel seam hairlines** at the YouthSection → next-section boundary (see #1350 context, surfaced in PR #1349 review).
- **Drift risk**: any `SectionTransition` seam-fix, token change, or accessibility improvement has to be manually mirrored into YouthSection's hand-rolled code.
- **Scaling pain**: more backgrounded sections are planned; each would duplicate the hacky pattern.

## 2. Goals

Add a declarative `backdrop` capability to `SectionStack` + `SectionTransition` so any section can paint a full-bleed backdrop (photo, gradient, composite) that automatically extends into adjacent diagonal transition strips, with no per-consumer positioning math and no regressions to the existing seam-guard behavior.

Concrete targets:

- One API addition: `SectionConfig.backdrop: ReactNode`.
- `SectionStack` owns the geometry; consumers never touch `calc()` or z-index.
- `SectionTransition` gains `revealFrom` / `revealTo` flags, auto-propagated by `SectionStack` based on neighbors' `backdrop` presence. Consumers never set reveal flags manually.
- Works with all existing transition types: `diagonal`, `double-diagonal`, `overlap: "none" | "half" | "full"`.
- Single source of truth for diagonal height: `var(--footer-diagonal)` (established by #1360).

## 3. API — Shape A

### 3.1 `SectionConfig` gains `backdrop`

```typescript
export interface SectionConfig {
  bg: SectionBg;
  content: React.ReactNode;
  /**
   * Optional backdrop layer painted full-bleed behind the section content
   * AND into the top/bottom halves of any adjacent diagonal transitions.
   * Rendered absolutely positioned at z-0; section content sits at z-10.
   *
   * When set, SectionStack automatically sets revealFrom/revealTo on the
   * adjacent transitions so their triangles on this section's side stay
   * transparent and the backdrop shows through.
   */
  backdrop?: React.ReactNode;
  paddingTop?: string;
  paddingBottom?: string;
  transition?: SectionTransitionConfig;
  key?: string;
}
```

### 3.2 `SectionTransition` gains `revealFrom` / `revealTo`

```typescript
export interface SectionTransitionProps {
  from: SectionBg;
  to: SectionBg;
  type: "diagonal" | "double-diagonal";
  direction: "left" | "right";
  via?: SectionBg;
  overlap?: TransitionOverlap;
  /**
   * Make the FROM triangle transparent so the previous section's backdrop
   * shows through. Auto-set by SectionStack when the FROM section has
   * a backdrop. Do not set manually in consumer code.
   */
  revealFrom?: boolean;
  /**
   * Make the TO triangle transparent so the next section's backdrop
   * shows through. Auto-set by SectionStack when the TO section has
   * a backdrop. Do not set manually in consumer code.
   */
  revealTo?: boolean;
  className?: string;
}
```

Consumers in `page.tsx`-style files never pass `revealFrom` or `revealTo`. `SectionStack` derives them from neighbor `backdrop` props.

## 4. Layout mechanics

```text
┌─────────────────────┐
│  Section N          │  bg=kcvv-black (no backdrop)
└─────────────────────┘
  ┌───────────────────┐  SectionTransition
  │ ◣ FROM opaque     │    from=kcvv-black, to=kcvv-green-dark
  │   TO transparent ◢│    revealTo=true  ← auto-propagated; N+1 has backdrop
  └───────────────────┘
┌─────────────────────┐
│  Section N+1        │  bg=kcvv-green-dark
│  ┌───────────────┐  │    backdrop=<YouthBackdrop/>
│  │ backdrop @z-0 │  │    ← spans content + halves of adjacent transitions
│  └───────────────┘  │
│    content @z-10    │
└─────────────────────┘
  ┌───────────────────┐  SectionTransition
  │ ◣ FROM transparent│    from=kcvv-green-dark, to=gray-100
  │   TO opaque      ◢│    revealFrom=true ← auto-propagated; N+1 has backdrop
  └───────────────────┘
┌─────────────────────┐
│  Section N+2        │  bg=gray-100 (no backdrop)
└─────────────────────┘
```

## 5. Invariants (the load-bearing rules)

These are the rules that must hold. Regressions here are exactly the months of pain referenced in §1. Future maintainers: do not "simplify" these without reading the "Why" clauses.

### 5.1 Z-index discipline

- Section wrappers: `position: relative`, no explicit z-index (z-auto). Each establishes its own stacking context.
- Backdrop inside wrapper: `position: absolute`, `z-0` within its section's context; `pointer-events: none`, `aria-hidden="true"`; extends past wrapper via `top: calc(-1 * var(--footer-diagonal))` and/or `bottom: calc(-1 * var(--footer-diagonal))` whenever the corresponding neighbor transition exists and the current section is TO/FROM of that transition.
- Section content inside wrapper: `position: relative`, `z-10` within its section's context.
- Transition sibling: `position: relative`, **`z-index: 1`** (non-overlap) / **`z-index: 10`** (overlap, preserving existing behavior).

**Why**: without `z-index: 1` on non-overlap transitions, DOM-order painting means a following section's backdrop (rendered with negative `top`) paints above the transition, obscuring its opaque triangle. `z-index: 1` forces the transition's opaque polygon to paint above backdrop overflow from either neighbor. Existing non-overlap transitions carried no z-index because there was no upward overflow to worry about; this is a new constraint introduced by `backdrop`.

### 5.2 Wrapper background transparency rule

`SectionTransition`'s wrapper `<div>` has a `background` CSS property used as a seam guard against sub-pixel gaps. The rule is binary:

- `revealFrom || revealTo` → `background: transparent`.
- `overlap !== "none"` (and not revealing) → `background: linear-gradient(to bottom, transparent 98%, BG_COLOR[to] 98%)` (existing behavior).
- Otherwise → `background: BG_COLOR[to]` (existing behavior).

**Why**: the wrapper background paints uniformly behind the SVG. If the FROM triangle is transparent but the wrapper is painted in `BG_COLOR[to]`, the to-color leaks through the FROM triangle where the backdrop should show — wrong. The binary rule ensures any reveal drops the wrapper to transparent. Seam sealing on the TO side is picked up by the transition's existing `marginBottom: -1px` (which overlaps the next section's `bg` by 1px). On the FROM side, the opaque FROM polygon with `shape-rendering="crispEdges"` against the matching `bg` color of the section above is sufficient — if a seam appears here in practice, fix in a follow-up.

### 5.3 Reveal-fill composition

Per-triangle fill resolution inside `SectionTransition`:

- FROM triangle:
  - `revealFrom === true` → transparent
  - `overlap !== "none" && revealFrom !== false` → transparent (existing overlap behavior)
  - Otherwise → `BG_COLOR[from]`
- TO triangle:
  - `revealTo === true` → transparent
  - Otherwise → `BG_COLOR[to]`

`from` and `to` remain required props; reveal flags override the fill on their side only.

### 5.4 `double-diagonal` composition

`double-diagonal` has an upper half (from → via) and a lower half (via → to).

- `revealFrom === true` → upper half's FROM polygon transparent. Lower half's `via` and `to` polygons unaffected (they are not adjacent to FROM).
- `revealTo === true` → lower half's TO polygon transparent. Upper half's `from` and `via` polygons unaffected.
- `via` is always opaque — it is a color transition layer, not a reveal surface.

Storybook must cover both single-side reveals in `double-diagonal` mode.

### 5.5 Two consecutive backdropped sections

If section N and section N+1 both have `backdrop`, the transition between them has `revealFrom && revealTo` → both triangles transparent, wrapper `background: transparent`. **The transition strip is visually invisible**; both backdrops paint through it. The diagonal height is still reserved in DOM flow.

**Semantics**: when both neighbors are backdropped, there is no color transition to draw. The visual boundary, if any, belongs to the backdrops themselves. This is intended behavior, not a bug.

### 5.6 First / last section edge cases

If the first section has `backdrop` but no transition above, the backdrop's `top: 0` (no negative overflow). Similarly last section with no transition below → `bottom: 0`. Implementation derives extensions from the presence of neighbor transitions, not unconditionally.

### 5.7 `SectionStack` outer container

**Do not add `overflow: hidden` to `SectionStack`'s outer `<div>`.** Backdrop overflows stay within each section's stacking context, but the outer div defaulting to `overflow: visible` is load-bearing for correct paint order. If a future change tightens overflow at the outer level, backdrops will be clipped at section boundaries and the pattern silently breaks.

### 5.8 Single source of truth for diagonal height

All diagonal-related offsets read `var(--footer-diagonal)` from `globals.css` (established by #1360). `SectionStack`'s backdrop `top`/`bottom` uses `calc(-1 * var(--footer-diagonal))`. `SectionTransition`'s internal `DIAGONAL_HEIGHT` export is `"var(--footer-diagonal)"`. No `clamp(2rem, 6vw, 5rem)` literal appears anywhere outside `globals.css`.

## 6. Acceptance criteria (primitive issue)

- [ ] `SectionConfig` exports `backdrop?: React.ReactNode` with JSDoc as in §3.1.
- [ ] `SectionStack` absolutely positions `{section.backdrop}` at `z-0` with `top: calc(-1 * var(--footer-diagonal))` when the previous transition exists (current section as TO), and `bottom: calc(-1 * var(--footer-diagonal))` when the next transition exists (current section as FROM).
- [ ] `SectionStack` sets `revealFrom` on a transition when the FROM section has `backdrop`, and `revealTo` when the TO section has `backdrop`. No consumer sets these manually.
- [ ] `SectionTransition` supports `revealFrom` / `revealTo` and their composition with `overlap` modes (`none`, `half`, `full`) for both `type: "diagonal"` and `type: "double-diagonal"` per §5.3 and §5.4.
- [ ] `SectionTransition` sibling renders at `z-index: 1` (non-overlap) / `z-index: 10` (overlap) per §5.1.
- [ ] Wrapper-background transparency rule per §5.2. Code comment in `SectionTransition.tsx` documents the invariant with a pointer to this PRD section.
- [ ] New Storybook stories under `UI/SectionTransition`: `BackgroundedFrom`, `BackgroundedTo`, `BackgroundedBoth`, `DoubleDiagonalBackgroundedFrom`, `DoubleDiagonalBackgroundedTo`. Each renders a mock photo backdrop so reviewers can visually verify the reveal.
- [ ] New Storybook story under `UI/SectionStack`: `BackdroppedSection` demonstrating a full mock backdrop + gradient section flanked by plain siblings.
- [ ] Unit tests:
  - (a) `SectionStack` auto-propagates `revealFrom` / `revealTo` when neighbors have `backdrop`.
  - (b) `SectionTransition` FROM polygon is transparent iff `revealFrom === true || (isOverlap && revealFrom !== false)`.
  - (c) `SectionTransition` TO polygon is transparent iff `revealTo === true`.
  - (d) Wrapper background is `transparent` whenever any reveal flag is truthy.
  - (e) Z-index on the transition sibling is stable across modes.
  - (f) Two-consecutive-backdrop case produces a fully-transparent transition.
- [ ] No visual regression on existing home-page transitions (hero double-diagonal, matchWidget → bannerA, bannerA → latestNews, etc.). Manual Storybook review; automated check once VR Phase 2 lands (see `visual-regression-testing.md`).
- [ ] `pnpm --filter @kcvv/web check-all` passes.
- [ ] `pnpm --filter @kcvv/web storybook:build` passes.

## 7. Acceptance criteria (consumer migration, #1350)

- [ ] Zero `<svg>` elements inside `YouthSection.tsx`.
- [ ] `YouthSection.tsx` does not import `DIAGONAL_HEIGHT` or `BG_COLOR`.
- [ ] `YouthSectionProps` reduced to `{ className?: string }` — no `prevBg` / `nextBg`.
- [ ] Co-located `YouthBackdrop.tsx` component renders the image + gradient overlay with visual parity to today.
- [ ] `apps/web/src/app/page.tsx`: `matchesSliderSection.transition` declared; `youthSection.transition` + `youthSection.backdrop` declared; `matchesSliderSection.paddingBottom: "pb-32"` removed; `youthSection.paddingTop` / `paddingBottom` use defaults (or documented reason otherwise).
- [ ] Top and bottom boundaries of YouthSection use `SectionTransition` via `SectionStack`, consistent with every other home-page section.
- [ ] No hairline seam between YouthSection and the sections above/below at any viewport width.
- [ ] Backdrop + gradient visually extends into both diagonal bands, matching or improving on today's appearance (side-by-side with production screenshot).
- [ ] Stories and tests updated.
- [ ] `pnpm --filter @kcvv/web check-all` passes. Storybook builds.

## 8. Anti-patterns / do-not

- **Do not set `revealFrom` / `revealTo` manually in consumer code.** They are derived by `SectionStack` from neighbor `backdrop`. Manual setting defeats the auto-propagation contract.
- **Do not add `overflow: hidden` to `SectionStack`'s outer div.** §5.7.
- **Do not hardcode `clamp(2rem, 6vw, 5rem)` anywhere outside `globals.css`.** Read `var(--footer-diagonal)`. §5.8.
- **Do not re-introduce per-page bottom padding for footer safe-area.** That pattern was deliberately removed in #1322 / #1360; the primitive work replaces it.
- **Do not inline SVG diagonals in any new section** for "photo-through-diagonal" effects. Use `backdrop`.

## 9. Dependencies

- **Blocked-by #1360.** #1360 establishes `--footer-diagonal` as a CSS custom property and introduces the semantic-landmark `<main>` structure. The primitive assumes both as preconditions — shipping before #1360 would require temporary duplication of the `clamp()` literal or re-work.

## 10. Scope summary

**Packages touched**: `apps/web` only.

**Primitive issue files**:

- `apps/web/src/components/design-system/SectionStack/SectionStack.tsx`
- `apps/web/src/components/design-system/SectionStack/SectionStack.stories.tsx`
- `apps/web/src/components/design-system/SectionStack/SectionStack.test.tsx`
- `apps/web/src/components/design-system/SectionTransition/SectionTransition.tsx`
- `apps/web/src/components/design-system/SectionTransition/SectionTransition.stories.tsx` (new or existing)
- `apps/web/src/components/design-system/SectionTransition/SectionTransition.test.tsx`

**#1350 consumer-migration files**:

- `apps/web/src/components/home/YouthSection/YouthSection.tsx` (heavy edit)
- `apps/web/src/components/home/YouthSection/YouthBackdrop.tsx` (new)
- `apps/web/src/components/home/YouthSection/index.ts` (export check)
- `apps/web/src/components/home/YouthSection/YouthSection.stories.tsx`
- `apps/web/src/components/home/YouthSection/YouthSection.test.tsx`
- `apps/web/src/components/home/Homepage.stories.tsx` (verify only)
- `apps/web/src/app/page.tsx` (update `matchesSliderSection` + `youthSection`)

## 11. Out of scope

- Migrating sections that do not currently have backdrops — they gain nothing; touching them is unnecessary churn.
- Any redesign of the diagonal shape, angle, or height.
- Re-introducing per-page safe-area padding (handled by #1360).

## 12. References

- #1322, PR #1353 — prior diagonal seam fix, source of the overlap-full overlap approach.
- #1350 — YouthSection migration, the initial consumer of this primitive.
- #1360 — `--footer-diagonal` CSS custom property + semantic `<main>` — blocker.
- #1349, #1323 — surfacing of the hairline seam that motivates the refactor.
- `docs/prd/visual-regression-testing.md` — sibling PRD. Phase 2 baselines will capture the primitive's new stories and prevent regressions on the invariants in §5.
