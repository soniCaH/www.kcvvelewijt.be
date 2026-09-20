/**
 * Shared classes for a sticky in-page section nav (#2478 rules 1 and 4) —
 * the light chip, deliberately quieter than `<FilterTabs>`'s: 1px border,
 * 1px shadow at rest, no press-down. Consumed by `<SectionNavChip>` (the
 * real item, both states) and by both route loading skeletons
 * (`hulp/loading.tsx`, `ploegen/[slug]/loading.tsx`), so a skeleton can
 * never drift from the shape it stands in for (#2432's "a skeleton that
 * disagrees with the thing it stands in for is a layout shift by
 * construction" — see `<FilterTabsSkeleton>`'s docblock, the direct
 * precedent for this file).
 *
 * `<HubSearch>`'s `nav` variant also takes `SECTION_NAV_CHIP_SHADOW_CLASS`
 * for its own shadow and `SECTION_NAV_TRAILING_SLOT_PADDING` for its box —
 * the trailing slot in the same bar wears the chip's exact paper weight
 * *and* its height (rule 5 addendum). Both constants live here, next to the
 * chip's own, because the rule they serve is a comparison between the two:
 * split across files, they drift, which is exactly what #2821 found.
 */

export const SECTION_NAV_BAR_CLASSES =
  "bg-cream-deep border-ink sticky top-[var(--sticky-header-h)] z-30 border-b-2";

/** Border + padding — shared by both chip states and the skeleton. The 1px
 *  shadow is a separate constant: it belongs to the *resting* look only —
 *  the active fill drops it (no press-down, rule 1). */
export const SECTION_NAV_CHIP_BASE_CLASSES =
  "border-ink inline-block border px-3 py-1.5";

export const SECTION_NAV_CHIP_SHADOW_CLASS =
  "shadow-[1px_1px_0_0_var(--color-ink)]";

/**
 * Padding for the bar's **trailing slot** — today only `<HubSearch
 * variant="nav">` on `/hulp`. Tuned so the slot is never taller than the
 * chip beside it, which is what DESIGN.md § Navigation means by the bar
 * reading as *"one row of one kind of object"*.
 *
 * The arithmetic, at `--line-height-loose: 1.75`:
 *
 * | box   | border | padding-y | content              | total     |
 * | ----- | ------ | --------- | -------------------- | --------- |
 * | chip  | 1 + 1  | 6 + 6     | 11px × 1.75 = 19.25  | **33.25** |
 * | slot  | 1 + 1  | 4 + 4     | 13px × 1.75 = 22.75  | **32.75** |
 *
 * The slot keeps 13px text — it is a field you type into, not a label — so
 * it buys the 2px back out of its padding instead. Landing 0.5px *under*
 * the chip is deliberate: the chip stays the row's tallest item, so the
 * bar's height does not change when the slot appears mid-scroll (#2821).
 * Before this, the slot's `py-2` made it 41px and the bar grew 8px on the
 * hand-over — the resize `useSectionNav` then had to publish and
 * `useHashLandingCorrection` had to correct against.
 *
 * If either box's padding, border or type size changes, re-run this table.
 * Nothing asserts it: the unit runner is happy-dom, which performs no
 * layout and cannot measure a rendered box. What catches a change is the
 * VR baseline of `<OrganigramSectionNav>`'s **`RevealedSearch`** story —
 * the only one that renders the slot *inside the bar, beside the chips*,
 * which is where the comparison lives. `Default` cannot: its decorator
 * keeps `#hub-hero` in view, so the slot never mounts. Nor can
 * `features-organigram-hubsearch--nav--*`, which renders the slot alone on
 * a swatch with neither chips nor the consumer's own width classes. And
 * only if a reviewer looks at it.
 */
export const SECTION_NAV_TRAILING_SLOT_PADDING = "px-2.5 py-1";
