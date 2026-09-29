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
 * variant="nav">` on `/hulp`. Horizontal only: the slot carries no
 * `py-*` of its own, because its height is no longer tuned to sit under the
 * chip's — it matches the chip **by construction**. `<HubSearch>`'s `nav`
 * wrapper and this box both take `self-stretch` (the wrapper against the
 * bar row it sits in, the box against the wrapper), so the box's height is
 * always exactly the row's cross size, whatever that is — the same
 * mechanism that gives every other item on the row its height, not a
 * second, padding-tuned one (#3248, replacing #2821's hand-worked table).
 *
 * Nothing asserts the resulting pixel value: the unit runner is happy-dom,
 * which performs no layout and cannot measure a rendered box. What catches
 * a regression is the VR baseline of `<OrganigramSectionNav>`'s
 * **`RevealedSearch`** story — the only one that renders the slot *inside
 * the bar, beside the chips*, which is where the comparison lives.
 * `Default` cannot: its decorator keeps `#hub-hero` in view, so the slot
 * never mounts. Nor can `features-organigram-hubsearch--nav--*`, which
 * renders the slot alone on a swatch with neither chips nor the consumer's
 * own width classes. A geometry `play` on the same story
 * (`SlotHeightMatchesTheChip`) asserts the equality directly, at 375 and
 * 1280px.
 */
export const SECTION_NAV_TRAILING_SLOT_PADDING = "px-2.5";
