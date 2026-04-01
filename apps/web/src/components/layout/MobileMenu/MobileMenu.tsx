/**
 * MobileMenu Component
 * Off-canvas mobile navigation menu
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, SocialLinks } from "@/components/design-system";
import { X, ChevronDown } from "@/lib/icons";
import type { TeamNavVM } from "@/lib/repositories/team.repository";
import { buildMenuItems } from "../menuItems";
import type { MenuItem } from "../menuItems";

export interface MobileMenuProps {
  /**
   * Whether the menu is open
   */
  isOpen: boolean;
  /**
   * Callback when the menu should close
   */
  onClose: () => void;
  youthTeams?: TeamNavVM[];
  seniorTeams?: TeamNavVM[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Mobile off-canvas navigation menu
 *
 * Visual specifications (matching Gatsby):
 * - Width: 280px
 * - Background: #1E2024 (black)
 * - Links: 4px green left border on hover/active
 * - Font: 0.6875rem (11px), uppercase, bold
 * - Border-bottom: 1px solid #292c31
 * - Padding: 1rem 2rem (16px 32px)
 * - Submenu: darker background with inset shadows
 */
const buildSeniorMenuItem = (
  team: TeamNavVM | undefined,
  label: string,
): MenuItem | null => {
  if (!team?.slug) return null;
  const href = `/ploegen/${team.slug}`;
  return {
    label,
    href,
    children: [
      { label: "Info", href },
      { label: "Spelers & Staff", href: `${href}?tab=opstelling` },
      { label: "Wedstrijden", href: `${href}?tab=wedstrijden` },
      { label: "Stand", href: `${href}?tab=klassement` },
    ],
  };
};

export const MobileMenu = ({
  isOpen,
  onClose,
  youthTeams,
  seniorTeams,
  className,
}: MobileMenuProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const seniorNavLabel = (name: string): string => {
    const lastWord = name.trim().split(/\s+/).at(-1) ?? name;
    return /^[A-Z]$/.test(lastWord) ? `${lastWord}-Ploeg` : name;
  };

  const jeugdItem: MenuItem = {
    label: "Jeugd",
    href: "/jeugd",
    children: youthTeams
      ?.filter((t) => t.age != null)
      .map((t) => ({
        label: t.age!,
        href: `/ploegen/${t.slug}`,
      })),
  };

  const seniorMenuItems = (seniorTeams ?? []).map((t) =>
    buildSeniorMenuItem(t, seniorNavLabel(t.name)),
  );

  const menuItems = buildMenuItems(seniorMenuItems, jeugdItem);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close menu when pathname changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

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
    // but NOT if we're on a tab (e.g., /ploegen/a-ploeg should not be active when on ?tab=opstelling)
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

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(openSubmenu === href ? null : href);
  };

  return (
    <>
      {/* Styles for mobile menu left border effect - using dangerouslySetInnerHTML for Storybook compatibility */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .mobile-nav-link {
              position: relative;
            }
            .mobile-nav-link::before {
              content: "";
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 4px;
              background-color: transparent;
              transition: background-color 0.3s ease;
              z-index: 1;
            }
            .mobile-nav-link:hover::before,
            .mobile-nav-link.active::before {
              background-color: #4acf52;
            }
          `,
        }}
      />

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <nav
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-[#1E2024] z-50",
          "transform transition-transform duration-500 ease-in-out",
          "shadow-[0_0_10px_rgba(0,0,0,0.7)]",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
          <Link href="/" onClick={onClose}>
            <Image
              src="/images/logo-flat.png"
              alt="KCVV ELEWIJT"
              width={100}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 text-white hover:text-kcvv-green-bright transition-colors"
          >
            <Icon icon={X} size="lg" />
          </button>
        </div>

        {/* Menu Items — scrollable area, keeps social footer always visible below */}
        <div className="flex-1 overflow-y-auto">
          <ul className="list-none m-0 p-0">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              const hasChildren = item.children && item.children.length > 0;
              const isSubmenuOpen = openSubmenu === item.href;

              return (
                <li key={item.href} className="relative">
                  {hasChildren ? (
                    <>
                      {/* Parent with submenu */}
                      <button
                        onClick={() => toggleSubmenu(item.href)}
                        className={cn(
                          "mobile-nav-link w-full flex items-center justify-between px-8 py-4 text-left border-b border-[#292c31] text-white text-[0.6875rem] uppercase font-bold transition-colors",
                          active && "active",
                        )}
                      >
                        <span>{item.label}</span>
                        <Icon
                          icon={ChevronDown}
                          size="xs"
                          className={cn(
                            "transition-transform",
                            isSubmenuOpen && "rotate-180",
                          )}
                        />
                      </button>

                      {/* Submenu */}
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300",
                          isSubmenuOpen ? "max-h-[800px]" : "max-h-0",
                        )}
                      >
                        <ul
                          className="list-none m-0 p-0 bg-[#292c31]"
                          style={{
                            boxShadow:
                              "inset 0 7px 9px -7px #1E2024, inset 0 -7px 9px -7px #1E2024",
                          }}
                        >
                          {item.children?.map((child) => {
                            const childActive = isActive(child.href);

                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    "mobile-nav-link block px-8 py-4 text-[0.6875rem] uppercase font-bold border-b border-[#62656A] no-underline transition-colors",
                                    childActive
                                      ? "text-kcvv-green-bright active"
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
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "mobile-nav-link block px-8 py-4 text-[0.6875rem] uppercase font-bold border-b border-[#292c31] text-white no-underline transition-colors",
                        active && "active",
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Social Links — outside scroll area so they never overlap menu items */}
        <div className="shrink-0 p-6 border-t border-white/10">
          <div className="flex items-center justify-center">
            <SocialLinks variant="inline" size="lg" />
          </div>
        </div>
      </nav>
    </>
  );
};
