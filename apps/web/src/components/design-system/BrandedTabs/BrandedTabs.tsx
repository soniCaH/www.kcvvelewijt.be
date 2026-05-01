"use client";

/**
 * BrandedTabs — Pure presentational tab bar.
 *
 * Direction D ("Paper chrome, ink emphasis") locked at the Phase 2 Track B
 * design checkpoint (2026-04-30). Source-of-record:
 * docs/design/mockups/phase-2-track-b/option-d-paper-chrome-ink-emphasis.html.
 *
 * Each tab renders the paper-card vocabulary at tab scale: `border-2 ink`,
 * `--shadow-paper-sm`, `bg-cream`, mono caps, sharp corners — no rotation,
 * no tape. The active tab inverts to `bg-ink text-cream` with the soft
 * `--shadow-paper-sm-soft` so the ink body and shadow remain distinguishable.
 * Hover (active and inactive) shifts to a 3 × 3 offset shadow + a 1 × 1
 * translate — the canonical paper-press idiom.
 *
 * State is owned by the parent. When tabs overflow on narrow screens,
 * navigation arrows appear at the edges via the shared `useScrollHint`
 * hook.
 */

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { useScrollHint } from "@/components/design-system/ScrollHint/useScrollHint";
import { ScrollArrowButton } from "@/components/design-system/ScrollHint/ScrollArrowButton";

export interface BrandedTab {
  /** Stable ID used by the parent for state */
  id: string;
  /** Label rendered on the tab button */
  label: string;
}

export interface BrandedTabsProps {
  tabs: BrandedTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  /** Accessible label for the tablist */
  ariaLabel?: string;
  className?: string;
}

const TAB_BASE_CLASSES = [
  "flex-shrink-0",
  "rounded-none border-2 border-ink",
  "px-[18px] py-3",
  "font-mono text-xs font-semibold uppercase tracking-[0.08em]",
  "transition-all duration-300",
  "hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jersey-deep focus-visible:ring-offset-2",
] as const;

const TAB_INACTIVE_CLASSES = ["bg-cream text-ink", "shadow-paper-sm"] as const;

const TAB_ACTIVE_CLASSES = [
  "bg-ink text-cream",
  "shadow-paper-sm-soft",
] as const;

export function BrandedTabs({
  tabs,
  activeTabId,
  onTabChange,
  ariaLabel,
  className,
}: BrandedTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } =
    useScrollHint<HTMLDivElement>();

  const handleSelect = (tabId: string) => {
    if (tabId === activeTabId) return;
    onTabChange(tabId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
    if (currentIndex === -1) return;
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const targetIndex = (currentIndex + delta + tabs.length) % tabs.length;
    const targetTab = tabs[targetIndex];
    if (!targetTab) return;
    onTabChange(targetTab.id);
    tabRefs.current[targetIndex]?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      {canScrollLeft && (
        <ScrollArrowButton direction="left" onClick={scrollLeft} />
      )}

      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        data-scroll-container
        className={cn(
          // scrollbar-hide: @utility in globals.css — hides native scrollbar
          // across all browsers. Tab gap matches Direction D mockup (12 px).
          // pb-1.5 (6 px) gives the 4 × 4 paper shadow room to render —
          // mixing `overflow-x: auto` with `overflow-y: visible` is silently
          // normalised to both-axes scroll, which would otherwise clip the
          // shadow's bottom edge.
          "scrollbar-hide flex gap-3 overflow-x-auto pb-1.5",
          canScrollLeft ? "pl-12" : "pl-0",
          canScrollRight ? "pr-12" : "pr-0",
        )}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              id={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelect(tab.id)}
              onKeyDown={handleKeyDown}
              className={cn(
                ...TAB_BASE_CLASSES,
                ...(isActive ? TAB_ACTIVE_CLASSES : TAB_INACTIVE_CLASSES),
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <ScrollArrowButton direction="right" onClick={scrollRight} />
      )}
    </div>
  );
}
