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
import { X, ChevronDown, MapPin } from "@/lib/icons";
import { trackEvent } from "@/lib/analytics/track-event";
import type { TeamNavVM } from "@/lib/repositories/team.repository";
import {
  buildMenuItems,
  buildSeniorMenuItem,
  seniorNavLabel,
  buildJeugdItem,
  isMenuItemActive,
} from "../menuItems";
import "./MobileMenu.css";

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

  const jeugdItem = buildJeugdItem(youthTeams);

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

  const isActive = (href: string) =>
    isMenuItemActive(href, pathname, searchParams);

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(openSubmenu === href ? null : href);
  };

  return (
    <>
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
          "fixed top-0 left-0 h-full w-[280px] bg-kcvv-black z-50",
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
            className="min-h-11 min-w-11 flex items-center justify-center text-white hover:text-kcvv-green-bright transition-colors"
          >
            <Icon icon={X} size="lg" />
          </button>
        </div>

        {/* Stadion quick action */}
        <div className="px-4 py-3 border-b border-white/10">
          <Link
            href="/club/contact"
            onClick={() => {
              if (pathname === "/club/contact") {
                onClose();
                return;
              }
              trackEvent("directions_clicked", { source: "mobile_menu" });
            }}
            className="inline-flex items-center gap-2 text-[0.6875rem] uppercase font-bold text-white hover:text-kcvv-green-bright transition-colors"
          >
            <Icon icon={MapPin} size="sm" />
            Stadion
          </Link>
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
                        aria-expanded={isSubmenuOpen}
                        className={cn(
                          "mobile-nav-link w-full flex items-center justify-between px-8 py-4 text-left border-b border-kcvv-gray-dark text-white text-[0.6875rem] uppercase font-bold transition-colors",
                          active && "active",
                        )}
                      >
                        <span>{item.label}</span>
                        <Icon
                          icon={ChevronDown}
                          size="sm"
                          className={cn(
                            "transition-transform duration-200",
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
                          className="list-none m-0 p-0 bg-kcvv-gray-dark"
                          style={{
                            boxShadow:
                              "inset 0 7px 9px -7px var(--color-kcvv-black), inset 0 -7px 9px -7px var(--color-kcvv-black)",
                          }}
                        >
                          {item.children?.map((child) => {
                            const childActive = isActive(child.href);

                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    "mobile-nav-link block px-8 py-4 text-[0.6875rem] uppercase font-bold border-b border-kcvv-gray no-underline transition-colors",
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
                        "mobile-nav-link block px-8 py-4 text-[0.6875rem] uppercase font-bold border-b border-kcvv-gray-dark text-white no-underline transition-colors",
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
            <SocialLinks variant="inline" size="md" />
          </div>
        </div>
      </nav>
    </>
  );
};
