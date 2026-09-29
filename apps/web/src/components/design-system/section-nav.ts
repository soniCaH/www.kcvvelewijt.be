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
 * for its own shadow and `SECTION_NAV_TRAILING_SLOT_CLASSES` for its box —
 * the trailing slot in the same bar wears the chip's exact paper weight
 * *and* its height (rule 5 addendum; the height by construction, see that
 * constant). Both constants live here, next to the
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
 * Box classes for the bar's **trailing slot** — today only `<HubSearch
 * variant="nav">` on `/hulp`. The slot matches the chip's height **by
 * construction**, not by tuned padding: its consumer's root takes
 * `self-stretch` against the bar row (overriding the row's `items-center`),
 * and this box fills that root with `h-full`. So the box is always exactly
 * the row's height, which the chip sets — and the bar does not change
 * height when the slot mounts mid-scroll (#2821). Horizontal padding only:
 * a `py-*` here could make the slot the row's tallest item again (#3248,
 * replacing #2821's hand-worked table).
 *
 * The one condition: the slot's own content (16px field on touch, 1.6
 * line-height, 1px borders ≈ 27.6px) must stay shorter than the chip
 * (≈ 33.3px), or it grows the row instead of filling it.
 *
 * What catches a regression: the `SlotHeightMatchesTheChip*` geometry
 * `play` stories on `<OrganigramSectionNav>` (375 and 1280px, mouse
 * pointer), and the VR baseline of its **`RevealedSearch`** story — the
 * only one that renders the slot *inside the bar, beside the chips*.
 */
export const SECTION_NAV_TRAILING_SLOT_CLASSES = "h-full px-2.5";
