"use client";

/**
 * BrandedTabs — Pure presentational tab bar
 *
 * Renders a horizontal row of tab buttons with the KCVV branded look:
 * uppercase, tracked, with a 4px green bottom border on the active tab
 * and a hover state on the inactive ones.
 *
 * State management is left to the parent — pass `activeTabId` and
 * `onTabChange`. Use this with `useState`, `useUrlTab`, or any other
 * mechanism that suits the consumer.
 */

import { cn } from "@/lib/utils/cn";

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
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex gap-8 border-b border-gray-200", className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "border-b-4 px-1 py-4 text-sm font-bold uppercase tracking-[0.05em] transition-colors",
              isActive
                ? "border-kcvv-green-bright text-kcvv-green-dark"
                : "border-transparent text-kcvv-gray hover:text-kcvv-black",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
