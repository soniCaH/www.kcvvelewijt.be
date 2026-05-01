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
 * `bg-ink text-cream` with the soft `--shadow-paper-sm-soft`. Hover
 * collapses the shadow fully (`hover:shadow-none`) and translates by 4 px
 * on both axes (`hover:translate-x-1 hover:translate-y-1`) over
 * `transition-all duration-300` — the canonical press-down hover shared
 * with `<Button>`, `<BrandedTabs>`, `<ScrollArrowButton>`, and the slider
 * arrows. Counts render inline after a 1 px hairline pipe — no pill, no
 * badge.
 *
 * Used in: Organigram, News Categories, Sponsors, Responsibility Finder.
 * State management is left to the parent (`activeTab` + `onChange?`); when
 * `renderAsLinks` is true, tabs with `href` render as `<a>` instead of
 * `<button>` for full-page Next.js navigation.
 *
 * Direction D retired the leading-glyph slot — `FilterTab.icon` is no
 * longer part of the prop surface (closes #1573).
 */

import { cn } from "@/lib/utils/cn";
import { useScrollHint } from "@/components/design-system/ScrollHint/useScrollHint";
import { ScrollArrowButton } from "@/components/design-system/ScrollHint/ScrollArrowButton";

export interface FilterTab {
  /** Unique identifier */
  value: string;
  /** Display label */
  label: string;
  /** Optional count rendered inline after a 1 px hairline pipe divider */
  count?: number;
  /** Optional href — only consumed when `renderAsLinks` is true */
  href?: string;
}

export type FilterTabsSize = "sm" | "md" | "lg";

export interface FilterTabsProps {
  /** Array of filter options */
  tabs: FilterTab[];
  /** Currently active tab value */
  activeTab: string;
  /** Change handler (for controlled tabs) */
  onChange?: (value: string) => void;
  /** Size variant — controls padding + font-size only */
  size?: FilterTabsSize;
  /** Show count after a hairline pipe divider when present */
  showCounts?: boolean;
  /** Additional CSS classes applied to the outer container */
  className?: string;
  /** Optional aria-label for the tablist */
  ariaLabel?: string;
  /** Render as links instead of buttons (for Next.js Link / SSR routing) */
  renderAsLinks?: boolean;
}

const CHIP_BASE_CLASSES = [
  // gap-2 (8 px) is the *internal* gap between the chip label and the
  // count `<span>` — matches the mockup's `.f-chip { gap: 8px }`. Don't
  // confuse with the row-level `gap-3` (12 px) below, which is the
  // BrandedTabs-aligned breathing space *between* chips.
  "inline-flex flex-shrink-0 items-center gap-2",
  "rounded-none border-2 border-ink",
  "font-mono font-semibold uppercase tracking-[0.08em]",
  "transition-all duration-300",
  "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jersey-deep focus-visible:ring-offset-2",
] as const;

const CHIP_INACTIVE_CLASSES = [
  "bg-cream-soft text-ink",
  "shadow-paper-sm",
] as const;

const CHIP_ACTIVE_CLASSES = [
  "bg-ink text-cream",
  "shadow-paper-sm-soft",
] as const;

const SIZE_CLASSES: Record<FilterTabsSize, string> = {
  sm: "px-[9px] py-[5px] text-[10px]",
  md: "px-3 py-2 text-[11px]",
  lg: "px-4 py-[11px] text-xs",
};

const ARROW_SIZE_CLASSES: Record<FilterTabsSize, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

const SCROLL_PADDING_LEFT: Record<FilterTabsSize, string> = {
  sm: "pl-10",
  md: "pl-12",
  lg: "pl-14",
};

const SCROLL_PADDING_RIGHT: Record<FilterTabsSize, string> = {
  sm: "pr-10",
  md: "pr-12",
  lg: "pr-14",
};

export function FilterTabs({
  tabs,
  activeTab,
  onChange,
  size = "md",
  showCounts = true,
  className = "",
  ariaLabel = "Filter tabs",
  renderAsLinks = false,
}: FilterTabsProps) {
  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } =
    useScrollHint<HTMLDivElement>();

  const renderTab = (tab: FilterTab) => {
    const isActive = activeTab === tab.value;
    const chipClasses = cn(
      ...CHIP_BASE_CLASSES,
      SIZE_CLASSES[size],
      ...(isActive ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES),
    );

    const content = (
      <>
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
          role="tab"
          aria-selected={isActive ? "true" : "false"}
          aria-current={isActive ? "page" : undefined}
          tabIndex={isActive ? 0 : -1}
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
        role="tab"
        aria-selected={isActive ? "true" : "false"}
        type="button"
        tabIndex={isActive ? 0 : -1}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={cn("relative", className)}>
      {canScrollLeft && (
        <ScrollArrowButton
          direction="left"
          onClick={scrollLeft}
          className={ARROW_SIZE_CLASSES[size]}
        />
      )}

      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          // scrollbar-hide @utility lives in globals.css. pb-1.5 (6 px)
          // gives the 4 × 4 paper shadow room to render — `overflow-x: auto`
          // is silently normalised by browsers to clip on both axes when
          // the other axis would be `visible`, otherwise cropping the
          // shadow's bottom edge (same fix as BrandedTabs #1576). Tab gap
          // matches BrandedTabs (`gap-3` = 12 px) — overrides the mockup's
          // 8 px to keep the two atoms visually consistent at the row level.
          "scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pb-1.5",
          canScrollLeft ? SCROLL_PADDING_LEFT[size] : "pl-0",
          canScrollRight ? SCROLL_PADDING_RIGHT[size] : "pr-0",
        )}
      >
        {tabs.map(renderTab)}
      </div>

      {canScrollRight && (
        <ScrollArrowButton
          direction="right"
          onClick={scrollRight}
          className={ARROW_SIZE_CLASSES[size]}
        />
      )}
    </div>
  );
}
