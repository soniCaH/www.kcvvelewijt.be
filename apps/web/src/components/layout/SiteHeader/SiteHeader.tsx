"use client";

import { useCallback, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/design-system/Button";
import { List } from "@/lib/icons.redesign";
import { Search } from "@/lib/icons";
import {
  buildMenuItems,
  buildSeniorMenuItem,
  seniorNavLabel,
  buildJeugdItem,
  isMenuItemActive,
  type MenuItem,
} from "../menuItems";
import { NavTakeover, NavTakeoverItem } from "../NavTakeover";
import type { TeamNavVM } from "@/lib/repositories/team.repository";

export interface SiteHeaderProps {
  seniorTeams?: TeamNavVM[];
  youthTeams?: TeamNavVM[];
  className?: string;
}

const Wordmark = () => (
  <Link
    href="/"
    aria-label="KCVV Elewijt — home"
    className="font-display inline-block text-[20px] leading-none font-black whitespace-nowrap italic no-underline lg:text-[20px] xl:text-[24px] 2xl:text-[28px]"
  >
    <span className="text-ink">
      KCVV <span className="text-jersey-deep">Elewijt</span>
    </span>
  </Link>
);

function SiteHeaderInner({
  seniorTeams,
  youthTeams,
  className,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => setDrawerOpen(false), []);

  const jeugdItem = buildJeugdItem(youthTeams);
  const seniorMenuItems = (seniorTeams ?? []).map((t) =>
    buildSeniorMenuItem(t, seniorNavLabel(t.name)),
  );
  const menuItems = buildMenuItems(seniorMenuItems, jeugdItem);

  const isActive = (href: string) =>
    isMenuItemActive(href, pathname, searchParams);
  const hasActiveChild = (item: MenuItem) =>
    item.children?.some((child) => isActive(child.href)) ?? false;

  return (
    <>
      <header
        className={cn(
          "bg-cream border-paper-edge sticky top-0 z-50 border-b",
          className,
        )}
      >
        {/* Mobile / Tablet (<1024px) */}
        <div className="relative flex h-16 items-center justify-between px-4 lg:hidden">
          <Button
            ref={hamburgerRef}
            variant="ghost"
            size="sm"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="!px-2 !py-2"
          >
            <List size={20} aria-hidden="true" />
          </Button>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Wordmark />
          </div>

          <Link
            href="/zoeken"
            aria-label="Zoeken"
            className="text-ink hover:text-jersey-deep inline-flex h-11 w-11 items-center justify-center transition-colors"
          >
            <Search size={20} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>

        {/* Desktop (≥1024px) */}
        <div className="mx-auto hidden h-16 max-w-[1440px] items-center justify-between gap-4 px-4 lg:grid lg:grid-cols-[auto_1fr_auto] xl:gap-8 xl:px-8 2xl:gap-10">
          <Wordmark />

          <nav aria-label="Hoofdnavigatie" className="flex w-full">
            <ul className="m-0 flex w-full list-none items-center justify-between gap-x-4 gap-y-0 py-0 pr-0 pl-6 xl:gap-x-8 xl:pl-10 2xl:gap-x-10 2xl:pl-12">
              {menuItems.map((item) => {
                const active = isActive(item.href) || hasActiveChild(item);
                const hasChildren = !!item.children?.length;
                return (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      className={cn(
                        "font-mono text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase no-underline transition-colors xl:text-[13px] 2xl:text-[14px]",
                        active
                          ? "text-jersey-deep"
                          : "text-ink hover:text-jersey-deep",
                      )}
                    >
                      {item.label}
                      {hasChildren && (
                        <span aria-hidden="true" className="ml-1">
                          ▾
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3 xl:gap-5">
            <Link
              href="/zoeken"
              aria-label="Zoeken"
              className="text-ink hover:text-jersey-deep inline-flex items-center transition-colors"
            >
              <Search size={18} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <Link
              href="/club/inschrijven"
              className="border-ink text-ink hover:border-jersey-deep hover:text-jersey-deep inline-flex items-center border px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase no-underline transition-colors duration-200 xl:px-3.5 xl:py-2 xl:text-[13px] 2xl:text-[14px]"
            >
              Word lid
            </Link>
          </div>
        </div>
      </header>

      <NavTakeover
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        wordmark={<Wordmark />}
        returnFocusRef={hamburgerRef}
      >
        {menuItems.map((item) => {
          const active = isActive(item.href) || hasActiveChild(item);
          const hasChildren = !!item.children?.length;
          if (hasChildren) {
            return (
              <NavTakeoverItem
                key={item.href}
                label={item.label}
                hasSubmenu
                active={active}
              >
                {item.children?.map((child) => (
                  <NavTakeoverItem
                    key={child.href}
                    label={child.label}
                    href={child.href}
                    active={isActive(child.href)}
                    onNavigate={handleClose}
                  />
                ))}
              </NavTakeoverItem>
            );
          }
          return (
            <NavTakeoverItem
              key={item.href}
              label={item.label}
              href={item.href}
              active={active}
              onNavigate={handleClose}
            />
          );
        })}
        <div className="mt-6">
          <Link
            href="/club/inschrijven"
            onClick={handleClose}
            className="border-ink bg-ink text-cream shadow-paper-sm flex w-full items-center justify-center border-2 px-6 py-4 font-mono text-[14px] font-semibold tracking-[0.04em] uppercase no-underline transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Word lid
          </Link>
        </div>
      </NavTakeover>
    </>
  );
}

export const SiteHeader = (props: SiteHeaderProps) => (
  <Suspense fallback={<div className="h-16" aria-hidden="true" />}>
    <SiteHeaderInner {...props} />
  </Suspense>
);
