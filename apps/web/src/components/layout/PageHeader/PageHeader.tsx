/**
 * PageHeader Component
 * Main site header with logo and navigation
 * Dark background (#1E2024), white text, sticky below the 3px AccentStrip. Offset top-[3px].
 */

"use client";

import { useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Search, Menu } from "@/lib/icons";
import { Navigation } from "../Navigation";
import { MobileMenu } from "../MobileMenu";
import type { TeamNavVM } from "@/lib/repositories/team.repository";

export interface PageHeaderProps {
  youthTeams?: TeamNavVM[];
  seniorTeams?: TeamNavVM[];
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
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setIsMobileMenuOpen((wasOpen) => {
      if (wasOpen) hamburgerRef.current?.focus();
      return false;
    });
  }, []);

  return (
    <>
      <header className={cn("relative z-50", className)}>
        {/* Dark nav background with subtle bottom border */}
        <nav className="bg-kcvv-black fixed top-[3px] right-0 left-0 z-50 h-16 border-b border-white/[0.06] transition-[height] duration-300">
          {/* Mobile Header */}
          <div className="relative h-full lg:hidden">
            {/* Hamburger Button - left 34px */}
            <button
              ref={hamburgerRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Toggle navigation menu"
              className="absolute top-1/2 left-[34px] flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-white"
            >
              <Menu size={20} className="inline-block" />
            </button>

            {/* Mobile Logo - centered */}
            <Link href="/" className="absolute top-3 left-1/2 -translate-x-1/2">
              <Image
                src="/images/logos/kcvv-logo.png"
                alt="KCVV ELEWIJT"
                width={40}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>

            {/* Search Button - right side */}
            <Link
              href="/zoeken"
              aria-label="Search"
              className="absolute top-1/2 right-[34px] flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-white"
            >
              <Search size={20} className="inline-block" />
            </Link>
          </div>

          {/* Desktop Header */}
          <div className="mx-auto hidden h-full max-w-[1440px] items-center justify-between gap-12 px-4 lg:flex xl:px-8">
            {/* Desktop Logo */}
            <Link href="/" className="mr-2 flex items-center">
              <Image
                src="/images/logos/kcvv-logo.png"
                alt="KCVV ELEWIJT"
                width={40}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Navigation - Suspense boundary for useSearchParams */}
            <Suspense fallback={<div className="grow" />}>
              <Navigation youthTeams={youthTeams} seniorTeams={seniorTeams} />
            </Suspense>

            {/* Desktop Utility Group */}
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/zoeken"
                aria-label="Search"
                className="text-white/70 transition-colors hover:text-white"
              >
                <Search size={16} />
              </Link>
              <Link
                href="/club/inschrijven"
                className="border-kcvv-green/60 hover:border-kcvv-green hover:text-kcvv-green rounded-sm border px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-white transition-colors"
              >
                Word lid
              </Link>
            </div>
          </div>
        </nav>

        {/* Spacer — accounts for fixed nav height + 3px accent strip */}
        <div className="h-[calc(4rem+3px)]" aria-hidden="true" />
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
