"use client";

/**
 * BrandedTabs — Pure presentational tab bar
 *
 * Renders a horizontal row of tab buttons with the KCVV branded look:
 * uppercase, tracked, with a 4px green bottom border on the active tab
 * and a hover state on the inactive ones.
 *
 * When tabs overflow on narrow screens, navigation arrows appear at the
 * edges (shared scroll-hint pattern via `useScrollHint`).
 *
 * State management is left to the parent — pass `activeTabId` and
 * `onTabChange`. Use this with `useState`, `useUrlTab`, or any other
 * mechanism that suits the consumer.
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
          "scrollbar-hide flex gap-8 overflow-x-auto border-b border-gray-200",
          /* scrollbar-hide: @utility in globals.css — hides native scrollbar across all browsers */
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
                "flex-shrink-0 border-b-4 px-1 py-4 text-sm font-bold tracking-[0.05em] whitespace-nowrap uppercase",
                "transition-all duration-200",
                "active:scale-[0.98]",
                "focus-visible:ring-kcvv-green-bright focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                isActive
                  ? "border-kcvv-green-bright text-kcvv-green-dark"
                  : "text-kcvv-gray-blue hover:text-kcvv-black active:bg-kcvv-green-dark/10 border-transparent",
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
