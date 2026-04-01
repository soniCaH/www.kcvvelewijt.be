/**
 * Navigation Component
 * Desktop horizontal navigation menu with dropdowns
 * Matches Gatsby visual: white text on green, underline hover effects, black dropdowns
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { TeamNavVM } from "@/lib/repositories/team.repository";
import {
  buildMenuItems,
  buildSeniorMenuItem,
  seniorNavLabel,
  buildJeugdItem,
  isMenuItemActive,
} from "../menuItems";
import type { MenuItem } from "../menuItems";

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

  const jeugdItem = buildJeugdItem(youthTeams);

  const seniorMenuItems = (seniorTeams ?? []).map((t) =>
    buildSeniorMenuItem(t, seniorNavLabel(t.name)),
  );

  const menuItems = buildMenuItems(seniorMenuItems, jeugdItem);

  const isActive = (href: string) =>
    isMenuItemActive(href, pathname, searchParams);

  const hasActiveChild = (item: MenuItem) => {
    return item.children?.some((child) => isActive(child.href)) || false;
  };

  return (
    <>
      {/* Styles for navigation hover effects - using dangerouslySetInnerHTML for Storybook compatibility */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .nav-link {
              position: relative;
            }
            .nav-link::after {
              content: "";
              display: block;
              position: absolute;
              bottom: 0;
              left: 50%;
              height: 2px;
              width: 0;
              background: #4acf52;
              transition: width 0.3s ease 0s, left 0.3s ease 0s;
            }
            .nav-link:hover::after,
            .nav-link.active::after {
              width: 100%;
              left: 0;
            }
            .dropdown-trigger::after {
              content: "";
              display: inline-block;
              margin-left: 9px;
              width: 6px;
              height: 4px;
              background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 4'%3E%3Cpath transform='translate(-586.156 -1047.28)' fill='%23fff' d='M586.171,1048l0.708-.71,2.828,2.83-0.707.71Zm4.95-.71,0.707,0.71L589,1050.83l-0.707-.71Z'/%3E%3C/svg%3E");
              background-size: 6px 4px;
              background-repeat: no-repeat;
              background-position: center center;
              position: relative;
              top: -2px;
            }
          `,
        }}
      />

      <nav className={cn("flex grow max-w-[90%]", className)}>
        <ul className="flex items-center justify-between grow flex-nowrap list-none m-0 p-0">
          {menuItems.map((item, index) => {
            const active = isActive(item.href) || hasActiveChild(item);
            const hasDropdown = item.children && item.children.length > 0;
            // Align dropdown to right for last 2 items to prevent overflow
            const isNearEnd = index >= menuItems.length - 2;

            return (
              <li
                key={item.href}
                className="inline-block relative"
                onMouseEnter={() => hasDropdown && setOpenDropdown(item.href)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "text-[0.7rem] xl:text-[0.875rem] uppercase font-bold text-white whitespace-nowrap no-underline py-2 px-2 transition-all duration-300",
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
                      "absolute top-full mt-0 min-w-[200px] bg-[#1E2024] border border-gray-700 z-10",
                      isNearEnd ? "right-0" : "left-0",
                    )}
                  >
                    <ul className="list-none m-0 p-0">
                      {item.children?.map((child) => {
                        const childActive = isActive(child.href);

                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block px-7 py-3 text-[0.6875rem] uppercase font-bold no-underline transition-colors duration-300 text-left",
                                childActive
                                  ? "text-kcvv-green-bright"
                                  : "text-white hover:text-kcvv-green-bright",
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
    </>
  );
};
