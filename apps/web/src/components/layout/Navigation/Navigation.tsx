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
import { Search } from "@/lib/icons";
import type {
  YouthTeamNavItem,
  SeniorTeamNavItem,
} from "@/lib/sanity/queries/teams";

export interface NavigationProps {
  youthTeams?: YouthTeamNavItem[];
  seniorTeams?: SeniorTeamNavItem[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

const staticMenuItems: MenuItem[] = [
  { label: "Home", href: "/" },
  { label: "Nieuws", href: "/news" },
  { label: "Evenementen", href: "/events" },
  { label: "Sponsors", href: "/sponsors" },
  { label: "Hulp", href: "/hulp" },
  {
    label: "De club",
    href: "/club",
    children: [
      { label: "Geschiedenis", href: "/club/history" },
      { label: "Organigram", href: "/club/organigram" },
      { label: "Bestuur", href: "/club/bestuur" },
      { label: "Jeugdbestuur", href: "/club/jeugdbestuur" },
      { label: "KCVV Angels", href: "/club/angels" },
      { label: "KCVV Ultras", href: "/club/ultras" },
      { label: "Contact", href: "/club/contact" },
      { label: "Downloads", href: "/club/downloads" },
      { label: "Praktische Info", href: "/club/register" },
      { label: "Cashless clubkaart", href: "/club/cashless" },
    ],
  },
];

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
const buildSeniorMenuItem = (
  team: SeniorTeamNavItem | undefined,
  label: string,
): MenuItem | null => {
  if (!team?.slug) return null;
  const href = `/team/${team.slug}`;
  return {
    label,
    href,
    children: [
      { label: "Info", href },
      { label: "Spelers & Staff", href: `${href}?tab=lineup` },
      { label: "Wedstrijden", href: `${href}?tab=matches` },
      { label: "Stand", href: `${href}?tab=standings` },
    ],
  };
};

export const Navigation = ({
  youthTeams,
  seniorTeams,
  className,
}: NavigationProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const aTeam = seniorTeams?.find((t) => t.age === "A");
  const bTeam = seniorTeams?.find((t) => t.age === "B");

  const jeugdItem: MenuItem = {
    label: "Jeugd",
    href: "/jeugd",
    children: youthTeams?.map((t) => ({
      label: t.age,
      href: `/team/${t.slug}`,
    })),
  };

  const menuItems: MenuItem[] = [
    ...staticMenuItems.slice(0, 3), // Home, Nieuws, Evenementen
    buildSeniorMenuItem(aTeam, "A-Ploeg"),
    buildSeniorMenuItem(bTeam, "B-Ploeg"),
    jeugdItem,
    ...staticMenuItems.slice(3), // Sponsors, Hulp, De club
  ].filter((item): item is MenuItem => item !== null);

  /**
   * Check if a menu item is active, handling both pathname and query params
   */
  const isActive = (href: string) => {
    // Parse the href to separate pathname and query params
    const [itemPath, itemQuery] = href.split("?");

    if (itemPath === "/") {
      return pathname === "/" && !itemQuery;
    }

    // If href has query params, check both pathname and query param match
    if (itemQuery) {
      const itemParams = new URLSearchParams(itemQuery);
      const itemTab = itemParams.get("tab");

      // Must match pathname exactly and have the same tab param
      return pathname === itemPath && searchParams.get("tab") === itemTab;
    }

    // For items without query params, check if it's a base path match
    // but NOT if we're on a tab (e.g., /team/a-ploeg should not be active when on ?tab=lineup)
    if (pathname === itemPath) {
      // Only active if there's no tab param in the URL
      return !searchParams.get("tab");
    }

    // Check for nested routes (but not for team pages with tabs)
    if (pathname?.startsWith(itemPath + "/")) {
      return true;
    }

    return false;
  };

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
              background: #fff;
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

      <nav className={cn("flex flex-grow max-w-[90%]", className)}>
        <ul className="flex items-center justify-between flex-grow flex-nowrap list-none m-0 p-0">
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

          {/* Search Link */}
          <li className="inline-block">
            <Link
              href="/search"
              className="nav-link text-[0.7rem] xl:text-[0.875rem] uppercase font-bold text-white whitespace-nowrap no-underline py-2 px-2 transition-all duration-300 inline-block"
              aria-label="Search"
            >
              <Search size={16} className="inline-block align-middle" />
              <span className="sr-only">Search</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
};
