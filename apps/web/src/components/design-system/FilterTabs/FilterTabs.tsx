"use client";

/**
 * FilterTabs — Pure presentational filter chip row.
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html
 * (`.f-chip` rules, ink-invert active variant chosen — see compare.md
 * lines 60–70).
 *
 * Each chip is a paper-chip body: `border-2 ink` + `--shadow-paper-sm` +
 * `bg-cream-soft`, mono caps label, sharp corners. Active inverts to
 * `bg-ink text-cream` with the soft `--shadow-paper-sm-soft` — unconditionally,
 * regardless of `surface` (see below). Hover collapses the shadow fully
 * (`hover:shadow-none`) and translates by 4 px on both axes
 * (`hover:translate-x-1 hover:translate-y-1`) over `transition-all
 * duration-300` — the canonical press-down hover shared with `<Button>`,
 * `<ScrollArrowButton>`, and the slider arrows. Counts render inline after
 * a 1 px hairline pipe — no pill, no badge.
 *
 * **Stale-reference correction (#2444 resolution).** This docblock and
 * `<HorizontalSlider>`'s used to still name `<BrandedTabs>` as a peer
 * overflow scroller in three places below — that component no longer
 * exists (retired pre-#2429); the mentions were historical rationale for
 * specific pixel values (a gap, a shadow-clip fix) inherited from it, not
 * a claim that it still ships. Corrected here rather than deleted outright
 * so the numbers keep their provenance.
 *
 * **The single filter primitive (#2429 / #2564).** One `<FilterTabs>` now
 * absorbs every filter row on the site — News categories, search result
 * types, `/kalender`'s by-type chips, `/evenementen`'s by-type chips, and
 * both of `/hulp`'s rows (audience + category) — replacing the bespoke
 * `KalenderFilterBar` and `EventFilterBar` (deleted) plus HulpFinder's two
 * hand-rolled chip rows. Per-facet colour identity survives absorption as
 * the optional `FilterTab.color` prop (sourced from each domain's own
 * colour map, e.g. `EVENT_TYPE_FILL` — this component stays colour-agnostic
 * and never hardcodes a facet's fill) rather than being flattened to
 * neutral. `surface="inverse"` opts the whole row's INACTIVE chips into the
 * soft shadow for a host on an ink/dark ground (DESIGN.md: a hard ink
 * shadow is invisible there) — the same fact `<EmptyState surface="inverse">`
 * names for its own card, so the two use the same word for it.
 *
 * **`surface="inverse"` also fixes the row's `<ScrollRail>` fade to
 * `from-jersey-deep-dark` (#2805).** The overflow fade's gradient start
 * colour must match what's actually behind the track (`<ScrollRail>`'s own
 * docblock), and `/evenementen`'s `jersey-deep-dark` field is the only
 * `inverse` row on the site today — the same token the organigram
 * breadcrumb passes for its own dark panel. Before this, `<FilterTabs>`
 * forwarded no `fadeFromClassName` at all, so this row took the cream
 * default and painted a cream smear over the arrow. This is a hardcoded
 * colour, not a resolved ground: `<FilterTabs>` exposes no
 * `fadeFromClassName` pass-through, so a future `inverse` row on a plain
 * `bg-ink` field (not `jersey-deep-dark`) would need that axis widened at
 * this call site first — don't assume `inverse` covers every dark ground
 * for the fade the way it already does for the chip shadow below.
 *
 * **Overflow is plain scroll, on purpose.** Four alternatives (wrap-capped,
 * sticky "Alles", "Alles" outside the scroller, snap-back-on-empty) were
 * prototyped on the real `/kalender` route and rejected as unintuitive
 * (#2429 resolution, rule 3) — this row never wraps and never traps the
 * reset off-screen behind different chrome. `overflow-x-auto` + the shared
 * absolute-positioned scroll arrows is the only overflow treatment.
 *
 * **The scroll arrow — `<ScrollRail>`'s "row of discrete things" idiom
 * (#2444, as amended by #2489).** A chip is a tap target, and covered
 * means unreachable — so unlike a table or a diagram, this row holds a
 * 40px gutter on both sides exactly when the track overflows at the
 * current width, never as a permanent breakpoint-gated rail, and the spent
 * direction disables in place instead of unmounting. See `<ScrollRail>`'s
 * own docblock for the full contract shared with `<TeamSectionNav>` and
 * the organigram breadcrumb. This replaces the former `pl-0 ↔ pl-10` /
 * `pr-0 ↔ pr-10` padding that toggled **mid-scroll** with the arrow's own
 * direction — a shipped defect (#2447-adjacent): driving `scrollLeft` 0 →
 * 40 left the first chip at exactly the same viewport x, because the 40px
 * of new padding cancelled the 40px of scroll. The arrow itself is
 * `register="control"` — 32 × 32, `jersey-deep` fill, cream glyph — a fill
 * no chip can wear, so it reads as a control rather than a peer of the
 * chips beside it (the `size="sm"` 32×32 override this row used to need is
 * now the register's own default).
 *
 * **`role="group"` + `aria-pressed`, not `role="tablist"`/`"tab"`.** A
 * filter narrows a list in place — a set of toggles, not tabs — and this
 * component renders no `tabpanel` for `role="tab"` to associate with
 * (#2429 resolution, rule 7). `role="tablist"` stays reserved for genuine
 * segmented switchers elsewhere (the Maand·Week·Agenda toggle,
 * `MemberDetailPanel`'s holder switcher), which are a different component.
 *
 * **One chip size.** The `size` prop is deleted (#2429 resolution, rule 6)
 * — every chip renders at the former `md` dimensions, ending the four
 * shipped heights (24/27/31/44px) this primitive's various absorbed rows
 * used to disagree on.
 *
 * **Leading-glyph slot.** `FilterTab.icon` returns as an optional prop
 * (#2429 resolution addendum, "rule 9") — a filter row may carry a
 * Phosphor Fill icon before its label. This deliberately reverses the
 * Direction D checkpoint lock (`docs/design/mockups/phase-2-track-b/compare.md`
 * lines 22 + 70, which is left unedited as the historical record of that
 * checkpoint). The slot is optional: a row with no glyph renders exactly as
 * before.
 *
 * State management is left to the parent (`activeTab` + `onChange?`); when
 * `renderAsLinks` is true, tabs with `href` render as `<a>` instead of
 * `<button>` for full-page Next.js navigation.
 *
 * Known repo-wide gap, not specific to this component: the press-down hover
 * above is hand-written rather than `PRESS_DOWN_CLASSES`
 * (`design-system/press-down.ts`), and unlike that canonical string this
 * one doesn't gate the translate behind `motion-safe:`. ~20 other sites
 * share the same ungated form — a repo-wide sweep, not something to fix
 * here — but this component is now the press-down for all six filter rows,
 * so it's worth more than the other ~20 (#2564 review, "note, don't fix").
 */

import { cn } from "@/lib/utils/cn";
import { ScrollRail } from "@/components/design-system/ScrollHint/ScrollRail";
import type { RedesignIconProps } from "@/lib/icons.redesign";
import type { ComponentType } from "react";

/** A tab's per-facet colour identity — border always, fill only when
 *  selected. Sourced by the caller from its own domain colour map (e.g.
 *  `EVENT_TYPE_FILL`); omit for the neutral ink/cream Direction D chip. */
export interface FilterTabColor {
  /** Border colour class, e.g. `"border-jersey-deep"`. Applied at rest and selected. */
  border: string;
  /** Background + text classes applied only when this tab is selected, e.g. `"bg-jersey-deep text-white"`. */
  fill: string;
}

export interface FilterTab {
  /** Unique identifier */
  value: string;
  /** Display label */
  label: string;
  /** Optional count rendered inline after a 1 px hairline pipe divider */
  count?: number;
  /** Optional href — only consumed when `renderAsLinks` is true */
  href?: string;
  /** Optional leading glyph — a Phosphor Fill icon component (`@/lib/icons.redesign`). */
  icon?: ComponentType<RedesignIconProps>;
  /** Optional per-facet colour identity. Omit for the neutral chip. */
  color?: FilterTabColor;
}

/** The row's ground — `"paper"` (default) for a cream/paper field, where the
 *  hard ink shadow reads correctly; `"inverse"` for a row hosted on an ink
 *  or dark-green ground, where DESIGN.md's rule is that the hard shadow is
 *  invisible and the soft one is used instead. Only INACTIVE chips read
 *  this for their shadow — the active chip is unconditionally the soft
 *  shadow regardless of ground. Same word `<EmptyState surface>` /
 *  `<TapedCard shadow>` use for the same fact, so a row and a nearby empty
 *  state name their ground identically instead of two props disagreeing on
 *  one truth.
 *
 *  Also drives `<ScrollRail>`'s overflow-fade start colour (#2805), but
 *  narrower than the shadow axis above: `"inverse"` hardcodes
 *  `from-jersey-deep-dark`, the one dark ground an `inverse` row actually
 *  sits on today (`/evenementen`). It is not "any ink or dark-green
 *  ground" for the fade — a row on plain `bg-ink` would need
 *  `fadeFromClassName` exposed as its own pass-through prop first, which
 *  this component does not do (no caller needs it yet). */
export type FilterTabsSurface = "paper" | "inverse";

export interface FilterTabsProps {
  /** Array of filter options */
  tabs: FilterTab[];
  /** Currently active tab value */
  activeTab: string;
  /** Change handler (for controlled tabs) */
  onChange?: (value: string) => void;
  /** Show count after a hairline pipe divider when present */
  showCounts?: boolean;
  /** Additional CSS classes applied to the outer container */
  className?: string;
  /** Optional aria-label for the filter group */
  ariaLabel?: string;
  /** Render as links instead of buttons (for Next.js Link / SSR routing) */
  renderAsLinks?: boolean;
  /** The row's ground — `"inverse"` for a row hosted on an ink/dark ground.
   *  Drives both the inactive chip's shadow and the `<ScrollRail>` overflow
   *  fade's start colour (#2805). */
  surface?: FilterTabsSurface;
}

const CHIP_BASE_CLASSES = [
  // gap-2 (8 px) is the *internal* gap between the chip label and the
  // count `<span>` — matches the mockup's `.f-chip { gap: 8px }`. Don't
  // confuse with the row-level `gap-3` (12 px) below, which is the
  // breathing space *between* chips (a value inherited from the retired
  // `<BrandedTabs>`, not a live consistency claim — see the docblock above).
  "inline-flex flex-shrink-0 items-center gap-2",
  "rounded-none border-2 border-ink",
  "font-mono font-semibold uppercase tracking-[0.08em]",
  "px-3 py-2 text-[11px]",
  "transition-all duration-300",
  "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jersey-deep focus-visible:ring-offset-2",
] as const;

export function FilterTabs({
  tabs,
  activeTab,
  onChange,
  showCounts = true,
  className = "",
  ariaLabel = "Filter tabs",
  renderAsLinks = false,
  surface = "paper",
}: FilterTabsProps) {
  const renderTab = (tab: FilterTab) => {
    const isActive = activeTab === tab.value;
    const Icon = tab.icon;
    // One `cn()` call: the colour's border applies at rest AND selected, so
    // it sits outside the active/inactive branch entirely — twMerge's
    // last-argument-wins per utility group makes `tab.color.border` beat
    // the base `border-ink` either way, without a second, nested `cn()`
    // parsing the same colour classes twice per coloured chip.
    const chipClasses = cn(
      ...CHIP_BASE_CLASSES,
      isActive ? "bg-ink text-cream" : "bg-cream-soft text-ink",
      isActive
        ? "shadow-paper-sm-soft"
        : surface === "inverse"
          ? "shadow-paper-sm-soft"
          : "shadow-paper-sm",
      // A caller's `fill` may be white-on-jersey-deep (e.g. event-type-style.ts's
      // EVENT_TYPE_FILL.Clubevent) rather than cream — kept deliberately: this is
      // the selected tab's own colour identity, a primitive white-on-green case
      // parked for the owner by #2421, not a stray text-white to sweep to cream.
      isActive && tab.color?.fill,
      tab.color?.border,
    );

    const content = (
      <>
        {Icon && <Icon size={14} aria-hidden />}
        <span>{tab.label}</span>
        {showCounts && typeof tab.count !== "undefined" && (
          <span
            className={cn(
              "border-l pl-2 text-[10px] font-semibold",
              isActive
                ? "border-cream text-cream"
                : "border-ink-muted text-ink-muted",
            )}
          >
            {tab.count}
          </span>
        )}
      </>
    );

    if (renderAsLinks && tab.href) {
      return (
        <a
          key={tab.value}
          href={tab.href}
          className={chipClasses}
          aria-current={isActive ? "page" : undefined}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        key={tab.value}
        onClick={() => onChange?.(tab.value)}
        className={chipClasses}
        aria-pressed={isActive}
        type="button"
      >
        {content}
      </button>
    );
  };

  return (
    <ScrollRail
      className={className}
      role="group"
      ariaLabel={ariaLabel}
      // The fade must match the row's own ground (#2805) — see the
      // `surface` doc comment above.
      fadeFromClassName={
        surface === "inverse" ? "from-jersey-deep-dark" : "from-cream"
      }
      // scrollbar-hide @utility lives in globals.css. pb-1.5 (6 px) gives
      // the 4 × 4 paper shadow room to render — `overflow-x: auto` is
      // silently normalised by browsers to clip on both axes when the
      // other axis would be `visible`, otherwise cropping the shadow's
      // bottom edge (same fix the retired `<BrandedTabs>` used, #1576).
      // Tab gap is `gap-3` = 12 px — overrides the mockup's 8 px, a value
      // inherited from `<BrandedTabs>` at the time it still shipped
      // alongside this component.
      trackClassName="scrollbar-hide flex gap-3 scroll-smooth pb-1.5"
    >
      {tabs.map(renderTab)}
    </ScrollRail>
  );
}
