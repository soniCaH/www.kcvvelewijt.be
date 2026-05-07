/**
 * Navigation Component
 * Desktop horizontal navigation menu with dropdowns
 * Matches Gatsby visual: white text on green, underline hover effects, black dropdowns
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { TeamNavVM } from "@/lib/repositories/team.repository";
import {
  buildMenuItems,
  buildSeniorMenuItem,
  seniorNavLabel,
  buildJeugdItem,
  flattenChildren,
  isMenuItemActive,
} from "../menuItems";
import type { MenuItem } from "../menuItems";
import "./Navigation.css";

export interface NavigationProps {
  youthTeams?: TeamNavVM[];
  seniorTeams?: TeamNavVM[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Desktop horizontal navigation with dropdown menus
 *
 * Visual specifications (matching Gatsby):
 * - Font: 0.7rem (11.2px) / 0.875rem at 1240px+
 * - Text-transform: uppercase
 * - Font-weight: bold
 * - Color: white
 * - Hover: white 2px underline animating from center (width 0->100%, left 50%->0)
 * - Transition: all 0.3s ease
 * - Dropdown background: black (#1E2024)
 * - Dropdown border: 1px solid gray-700
 * - Dropdown font-size: 0.6875rem (11px)
 */
export const Navigation = ({
  youthTeams,
  seniorTeams,
  className,
}: NavigationProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const closeDropdown = useCallback(() => setOpenDropdown(null), []);

  // Close on Escape key
  useEffect(() => {
    if (!openDropdown) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openDropdown, closeDropdown]);

  // Close on click outside
  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, closeDropdown]);

  const jeugdItem = buildJeugdItem(youthTeams);

  const seniorMenuItems = (seniorTeams ?? []).map((t) =>
    buildSeniorMenuItem(t, seniorNavLabel(t.name)),
  );

  const menuItems = buildMenuItems(seniorMenuItems, jeugdItem);

  const isActive = (href: string) =>
    isMenuItemActive(href, pathname, searchParams);

  const hasActiveChild = (item: MenuItem) => {
    return flattenChildren(item).some((child) => isActive(child.href));
  };

  return (
    <nav ref={navRef} className={cn("flex max-w-[90%] grow", className)}>
      <ul className="m-0 flex grow list-none flex-nowrap items-center justify-between p-0">
        {menuItems.map((item, index) => {
          const active = isActive(item.href) || hasActiveChild(item);
          const dropdownChildren = flattenChildren(item);
          const hasDropdown = dropdownChildren.length > 0;
          // Align dropdown to right for last 2 items to prevent overflow
          const isNearEnd = index >= menuItems.length - 2;

          return (
            <li
              key={item.href}
              className="relative inline-block"
              onMouseEnter={() => hasDropdown && setOpenDropdown(item.href)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  "px-2 py-2 text-[0.7rem] font-bold whitespace-nowrap text-white uppercase no-underline transition-all duration-300 xl:text-[0.875rem]",
                  hasDropdown ? "dropdown-trigger" : "nav-link",
                  active && !hasDropdown && "active",
                )}
              >
                {item.label}
              </Link>

              {/* Dropdown Menu */}
              {hasDropdown && openDropdown === item.href && (
                <div
                  className={cn(
                    "bg-kcvv-black absolute top-full z-10 mt-0 min-w-[200px] border border-gray-700",
                    isNearEnd ? "right-0" : "left-0",
                  )}
                >
                  <ul className="m-0 list-none p-0">
                    {dropdownChildren.map((child) => {
                      const childActive = isActive(child.href);

                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              "block px-7 py-3 text-left text-[0.6875rem] font-bold uppercase no-underline transition-colors duration-300",
                              childActive
                                ? "text-kcvv-green-bright"
                                : "hover:text-kcvv-green-bright text-white",
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
