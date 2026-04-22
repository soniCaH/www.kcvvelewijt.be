"use client";

/**
 * MobileBottomNav Component
 *
 * Bottom navigation bar for mobile devices showing view navigation.
 * Positioned at the bottom of the screen for better thumb accessibility.
 *
 * Features:
 * - Fixed bottom positioning on mobile (<1024px)
 * - Large touch targets (min 48x48px)
 * - Active state with visual feedback
 * - Icon + label for clarity
 * - Safe area insets for modern mobile devices
 * - Hidden on desktop (shows regular FilterTabs instead)
 *
 * Accessibility:
 * - WCAG 2.1 Level AA compliant
 * - Minimum 44x44px touch targets
 * - Clear visual indicators
 * - Uses navigation semantics (not tab semantics)
 * - Proper ARIA labels and aria-current for active state
 */

import type { LucideIcon } from "@/lib/icons";

export interface MobileBottomNavTab {
  value: string;
  label: string;
  icon?: LucideIcon;
}

export interface MobileBottomNavProps {
  tabs: MobileBottomNavTab[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Render a mobile bottom navigation bar with large touch targets and clear icons.
 *
 * Only visible on mobile devices (<1024px). Provides easy thumb access to view switching.
 *
 * @param tabs - Array of navigation tabs with icons
 * @param activeTab - Currently active tab value
 * @param onChange - Callback when a tab is selected
 * @param className - Additional CSS classes
 */
export function MobileBottomNav({
  tabs,
  activeTab,
  onChange,
  className = "",
}: MobileBottomNavProps) {
  return (
    <nav
      className={`safe-bottom fixed right-0 bottom-0 left-0 z-40 border-t border-gray-200 bg-white shadow-2xl lg:hidden ${className} `}
      role="navigation"
      aria-label="Hoofdnavigatie"
    >
      <div className="pb-safe flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              className={`focus:ring-kcvv-green flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors focus:ring-2 focus:outline-none focus:ring-inset ${
                isActive
                  ? "text-kcvv-green-bright bg-kcvv-green-bright/5"
                  : "text-kcvv-gray hover:text-kcvv-green-bright hover:bg-gray-50"
              } `}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${tab.label}${isActive ? " (huidige weergave)" : ""}`}
              type="button"
            >
              {/* Icon - 24x24px with padding for 48x48 touch target */}
              {IconComponent && (
                <IconComponent
                  size={24}
                  className="flex-shrink-0"
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
              )}

              {/* Label */}
              <span
                className={`w-full truncate px-2 text-center text-xs font-medium ${isActive ? "font-semibold" : ""} `}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
