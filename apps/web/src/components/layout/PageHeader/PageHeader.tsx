/**
 * PageHeader Component
 * Main site header with logo and navigation
 * Matches Gatsby visual: green background (#4acf52) with pattern image
 */

"use client";

import { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Search, Menu } from "@/lib/icons";
import { Navigation } from "../Navigation";
import { MobileMenu } from "../MobileMenu";
import type {
  YouthTeamNavItem,
  SeniorTeamNavItem,
} from "@/lib/sanity/queries/teams";

export interface PageHeaderProps {
  youthTeams?: YouthTeamNavItem[];
  seniorTeams?: SeniorTeamNavItem[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Main site header with sticky navigation
 *
 * Visual specifications (matching Gatsby):
 * - Background: #4acf52 (bright green) with pattern image
 * - Text color: white
 * - Height: 5rem (80px) mobile, 7.5rem (120px) desktop at 960px+
 * - Pattern image: header-pattern.png positioned at 50% -7vw
 * - Fixed positioning with z-index 50 (above content)
 * - Transition: height 0.3s
 */
export const PageHeader = ({
  youthTeams,
  seniorTeams,
  className,
}: PageHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <header className={cn("relative z-50", className)}>
        {/* Navigation Container with Green Background + Pattern */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 h-20 lg:h-[7.5rem] transition-[height] duration-300"
          style={{
            backgroundColor: "#4acf52",
            backgroundImage: "url(/images/header-pattern.png)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100vw auto",
            backgroundPosition: "50% -7vw",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Mobile Header */}
          <div className="lg:hidden h-full relative">
            {/* Hamburger Button - left 34px */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Toggle navigation menu"
              className="absolute left-[34px] top-[calc((5rem-16px)/2)] text-white w-6 h-6 flex items-center justify-center"
            >
              <Menu size={16} className="inline-block" />
            </button>

            {/* Mobile Logo - centered */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 top-[calc((5rem-100px)/2)]"
            >
              <Image
                src="/images/logos/kcvv-logo.png"
                alt="KCVV ELEWIJT"
                width={100}
                height={100}
                priority
                className="w-[100px] h-auto"
              />
            </Link>

            {/* Search Button - right side */}
            <Link
              href="/search"
              aria-label="Search"
              className="absolute right-[34px] top-[calc((5rem-16px)/2)] text-white w-6 h-6 flex items-center justify-center"
            >
              <Search size={16} className="inline-block" />
            </Link>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex h-full max-w-[1440px] mx-auto px-4 xl:px-8 justify-between items-center gap-12">
            {/* Desktop Logo */}
            <Link href="/" className="flex items-center mr-2">
              <Image
                src="/images/logos/kcvv-logo.png"
                alt="KCVV ELEWIJT"
                width={112}
                height={112}
                priority
                className="h-28 w-auto transition-all duration-300"
              />
            </Link>

            {/* Desktop Navigation - Suspense boundary for useSearchParams */}
            <Suspense fallback={<div className="flex-grow" />}>
              <Navigation youthTeams={youthTeams} seniorTeams={seniorTeams} />
            </Suspense>
          </div>
        </nav>

        {/* Spacer to prevent content from hiding under fixed header */}
        <div className="h-20 lg:h-[7.5rem]" aria-hidden="true" />
      </header>

      {/* Mobile Menu Overlay - Suspense boundary for useSearchParams */}
      <Suspense fallback={null}>
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={handleClose}
          youthTeams={youthTeams}
          seniorTeams={seniorTeams}
        />
      </Suspense>
    </>
  );
};
