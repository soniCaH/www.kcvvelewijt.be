"use client";

/**
 * FilterTabs Component
 *
 * Unified filter/tab component for consistent filtering UI across the app.
 * Used in: Organigram, News Categories, Sponsors, Responsibility Finder, etc.
 *
 * Features:
 * - Horizontal scrolling on mobile with navigation arrows
 * - Optional count badges
 * - Multiple size variants (sm, md, lg)
 * - Active state with green background (no side borders)
 * - Inactive state with green text and border
 * - Fully accessible and keyboard navigable
 * - Consistent with KCVV design system
 *
 * Design:
 * - Active: bg-kcvv-green-bright text-white (clean, no side borders)
 * - Inactive: bg-transparent text-kcvv-green-bright border-kcvv-green-bright
 * - Hover: bg-kcvv-green-bright text-white
 */

import { useScrollHint } from "@/components/design-system/ScrollHint/useScrollHint";
import { ScrollArrowButton } from "@/components/design-system/ScrollHint/ScrollArrowButton";
import { type LucideIcon } from "@/lib/icons";

export interface FilterTab {
  /** Unique identifier */
  value: string;
  /** Display label */
  label: string;
  /** Optional count badge */
  count?: number;
  /** Optional custom href (for Link-based tabs) */
  href?: string;
  /** Optional Lucide icon component */
  icon?: LucideIcon;
}

export interface FilterTabsProps {
  /** Array of filter options */
  tabs: FilterTab[];
  /** Currently active tab value */
  activeTab: string;
  /** Change handler (for controlled tabs) */
  onChange?: (value: string) => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show count badges */
  showCounts?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
  /** Render as links instead of buttons (for Next.js Link) */
  renderAsLinks?: boolean;
}

/**
 * Render a horizontally scrollable set of filter tabs with optional count badges, size variants, and arrow navigation.
 *
 * @param tabs - Array of tab options; each item should include `value`, `label`, and optional `count` and `href`
 * @param activeTab - The `value` of the currently active tab
 * @param onChange - Callback invoked with a tab's `value` when a non-link tab is activated
 * @param size - Visual size variant: `"sm" | "md" | "lg"` (default: `"md"`)
 * @param showCounts - Whether to display per-tab numeric badges (default: `true`)
 * @param className - Additional CSS classes applied to the root container
 * @param ariaLabel - Accessible label for the tablist (default: `"Filter tabs"`)
 * @param renderAsLinks - If `true`, tabs with `href` are rendered as anchor elements instead of buttons
 * @returns The rendered filter tabs React element
 */
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

  // Size-based styles
  const sizeClasses = {
    sm: {
      tab: "px-4 py-2 text-xs",
      badge: "ml-1.5 px-1.5 py-0.5 text-xs",
      arrow: "w-8 h-8",
    },
    md: {
      tab: "px-6 py-3 text-sm",
      badge: "ml-2 px-2 py-0.5 text-xs",
      arrow: "w-10 h-10",
    },
    lg: {
      tab: "px-8 py-4 text-base",
      badge: "ml-2.5 px-2.5 py-1 text-sm",
      arrow: "w-12 h-12",
    },
  };

  const currentSize = sizeClasses[size];

  // Active/Inactive styles - transparent border for active to prevent width shift
  const activeClasses =
    "bg-kcvv-green-bright text-white border-2 border-transparent";
  const inactiveClasses =
    "bg-transparent text-kcvv-green-bright hover:bg-kcvv-green-bright hover:text-white hover:border-transparent border-2 border-kcvv-green-bright";

  // Render individual tab
  const renderTab = (tab: FilterTab) => {
    const isActive = activeTab === tab.value;
    const baseClasses = `
      group
      ${currentSize.tab}
      ${isActive ? activeClasses : inactiveClasses}
      font-medium
      transition-all
      duration-200
      whitespace-nowrap
      flex-shrink-0
      rounded
      flex
      items-center
      focus:outline-none
    `;

    const IconComponent = tab.icon;
    const iconSize = size === "sm" ? 16 : size === "lg" ? 20 : 18;

    const content = (
      <>
        {IconComponent && (
          <IconComponent
            size={iconSize}
            className="flex-shrink-0"
            aria-hidden="true"
          />
        )}
        <span className={IconComponent ? "ml-2" : ""}>{tab.label}</span>
        {showCounts && typeof tab.count !== "undefined" && (
          <span
            className={`
              ${currentSize.badge}
              rounded-full
              font-semibold
              ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-kcvv-green-bright/10 text-kcvv-green-bright group-hover:bg-white/20 group-hover:text-white"
              }
            `}
            style={{ fontFamily: "ibm-plex-mono, monospace" }}
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
          className={baseClasses}
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
        className={baseClasses}
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
    <div className={`relative ${className}`}>
      {canScrollLeft && (
        <ScrollArrowButton
          direction="left"
          onClick={scrollLeft}
          className={currentSize.arrow}
        />
      )}

      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        className={`
          flex gap-2 overflow-x-auto scroll-smooth
          ${canScrollLeft ? (size === "sm" ? "pl-10" : size === "lg" ? "pl-14" : "pl-12") : "pl-0"}
          ${canScrollRight ? (size === "sm" ? "pr-10" : size === "lg" ? "pr-14" : "pr-12") : "pr-0"}
          scrollbar-hide
        `}
      >
        {tabs.map(renderTab)}
      </div>

      {canScrollRight && (
        <ScrollArrowButton
          direction="right"
          onClick={scrollRight}
          className={currentSize.arrow}
        />
      )}
    </div>
  );
}
