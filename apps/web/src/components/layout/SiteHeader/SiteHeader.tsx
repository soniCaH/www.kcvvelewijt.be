"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { LinkPendingDots } from "@/components/design-system/LinkPendingDots";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button, getButtonClasses } from "@/components/design-system/Button";
import { List, MagnifyingGlass } from "@/lib/icons.redesign";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import {
  useNavigationAnalytics,
  type NavSource,
} from "@/hooks/useNavigationAnalytics";
import {
  buildMenuItems,
  buildSeniorMenuItem,
  isMenuItemActive,
} from "../menuItems";
import { NavTakeover, NavTakeoverItem } from "../NavTakeover";
import type { TeamNavVM } from "@/lib/repositories/team.repository";

export interface SiteHeaderProps {
  seniorTeams?: TeamNavVM[];
  className?: string;
}

/**
 * Bounds a single desktop nav entry so the row cannot be blown out by a long
 * Sanity team name (#2409's one-line-fit constraint at `lg`).
 *
 * `14ch` rather than a character cap on the label itself: it scales with the
 * three mono sizes the row steps through (11 / 13 / 14px), it leaves the full
 * name in the DOM so the link's accessible name stays intact, and it applies
 * only to the desktop row — the mobile drawer has no width constraint. `ch`
 * measures a bare glyph advance, not the tracking `CHROME_NAV_TYPE` adds per
 * character (#2663) — so an exactly-14-character label (the senior team
 * default `KCVV Elewijt A`/`B`) already clips a touch before the cap; that's
 * the ellipsis fallback working as intended, not a bug. `min-w-0` lets the
 * flex item actually shrink; without it `truncate` never engages.
 *
 * Exempt from the reading-measure ban (DESIGN.md "The Reading-Measure
 * Exemption Rule", #2645): a single-line label that truncates, not a
 * reading column.
 */
const NAV_LABEL_TRUNCATE = "block max-w-[14ch] truncate";

/**
 * The desktop row's chrome type: uppercase mono stepping 11 → 13 → 14px at
 * `xl` / `2xl`. Shared verbatim by the nav links and the `Word lid` CTA,
 * which sit in the same row and are bound by the same limit.
 *
 * Exempt from the type ramp (DESIGN.md "The Chrome Fits The Bar Rule",
 * #2664) — sizes only, never tracking, which takes `text-label`'s own
 * token (#2663). Sanctioned here, in one place, so #2418's lint has a
 * single site to suppress.
 */
const CHROME_NAV_TYPE =
  "font-mono text-[11px] font-semibold tracking-(--text-label--letter-spacing) whitespace-nowrap uppercase no-underline transition-colors xl:text-[13px] 2xl:text-[14px]";

const Wordmark = () => (
  <Link
    href="/"
    aria-label="KCVV Elewijt — home"
    // `py-1 -my-1` — hit area only, no layout shift (#2394). The 20/24/28px
    // ramp is exempt under DESIGN.md "The Chrome Fits The Bar Rule" (#2664):
    // a fit constraint, not a ramp step. Rendered in three places; normally
    // only the desktop row reaches the xl/2xl steps — a takeover opened
    // below `lg` now closes itself before the viewport can ever reach `xl`
    // (#2850), so it can no longer render them too.
    className="font-display relative -my-1 inline-block py-1 text-[20px] leading-none font-black whitespace-nowrap italic no-underline xl:text-[24px] 2xl:text-[28px]"
  >
    <span className="text-ink">
      KCVV <span className="text-jersey-deep">Elewijt</span>
    </span>
    <LinkPendingDots placement="corner" className="top-0 -right-7" />
  </Link>
);

export function SiteHeader({ seniorTeams, className }: SiteHeaderProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // The drawer stays open on a tap so the tapped row's `LinkPendingDots`
  // (`useLinkStatus`) stay mounted — closing on tap unmounts the link and with
  // it its pending status (#3386, decided at #2499). It closes on arrival
  // instead: when the pathname changes. Adjusting state during render on a
  // prop change is React's documented alternative to an effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setDrawerOpen(false);
  }
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  // Where NavTakeover sends focus when it retires itself because the
  // viewport crossed into `lg` while the drawer was open (#2850) —
  // `hamburgerRef` above is `lg:hidden` at that width, so it can no longer
  // receive focus. The desktop row's first entry is the nearest equivalent
  // "where the nav starts" for a visitor who was just inside the takeover.
  const firstDesktopNavLinkRef = useRef<HTMLAnchorElement>(null);
  const { trackNavClick } = useNavigationAnalytics();

  // One native listener on the (always-mounted) `<header>` reads the inert
  // `data-nav-source` marker off whichever link was hit — #2419's delegation
  // requirement. The destination comes off the anchor's own `href`, so a new
  // nav entry never has to repeat its route in a second attribute. The
  // takeover is handled separately below.
  useDelegatedClick(headerRef, {
    selector: "[data-nav-source]",
    onMatch: (el) => {
      const destination = el.getAttribute("href");
      const source = el.getAttribute("data-nav-source") as NavSource | null;
      if (!destination || !source) return;
      trackNavClick({ destination, source });
    },
  });

  // The takeover is a JSX sibling of `<header>`, so the delegated listener
  // above cannot reach it. It could get its own — but the panel is client-only
  // (delegation elsewhere exists to keep Server Components server-rendered,
  // which buys nothing here) and every row already owns an `onNavigate`
  // callback. Tracking rides that rather than adding a
  // second mechanism and a persistently-mounted wrapper to hang it on.
  const handleTakeoverNavigate = useCallback(
    (destination: string) => {
      trackNavClick({ destination, source: "takeover" });
      // A tap on the page we are already on navigates nowhere, so the
      // pathname never changes and nothing else would close the drawer.
      if (destination === pathname) setDrawerOpen(false);
    },
    [trackNavClick, pathname],
  );

  const seniorMenuItems = (seniorTeams ?? []).map((t) =>
    buildSeniorMenuItem(t, t.displayName),
  );
  const menuItems = buildMenuItems(seniorMenuItems);

  const isActive = (href: string) => isMenuItemActive(href, pathname);

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "bg-cream border-paper-edge sticky top-0 z-50 border-b",
          className,
        )}
      >
        {/* Mobile / Tablet (<1024px) */}
        {/* Height is `--sticky-header-h` (65px, `globals.css`) minus this
            header's own 1px `border-b` — every sticky in-page section nav
            derives its own pinned offset from that token, so the header's
            actual height is the one thing that must never drift from it. */}
        <div className="relative flex h-[calc(var(--sticky-header-h)-1px)] items-center justify-between px-4 lg:hidden">
          <Button
            ref={hamburgerRef}
            variant="ghost"
            size="sm"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls={drawerOpen ? "nav-takeover" : undefined}
            onClick={() => setDrawerOpen(true)}
            className="min-h-11 min-w-11 !px-2 !py-2"
          >
            <List size={20} aria-hidden="true" />
          </Button>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Wordmark />
          </div>

          <Link
            href="/zoeken"
            aria-label="Zoeken"
            data-nav-source="mobile"
            className="text-ink hover:text-jersey-deep relative inline-flex h-11 w-11 items-center justify-center transition-colors"
          >
            <MagnifyingGlass size={20} aria-hidden="true" />
            <LinkPendingDots placement="corner" className="top-0 right-0" />
          </Link>
        </div>

        {/* Desktop (≥1024px) — same derived height as the mobile row above. */}
        <div className="mx-auto hidden h-[calc(var(--sticky-header-h)-1px)] max-w-[1440px] items-center justify-between gap-4 px-4 lg:grid lg:grid-cols-[auto_1fr_auto] xl:gap-8 xl:px-8 2xl:gap-10">
          <Wordmark />

          <nav aria-label="Hoofdnavigatie" className="flex w-full">
            <ul className="m-0 flex w-full list-none items-center justify-between gap-x-4 gap-y-0 py-0 pr-0 pl-6 xl:gap-x-8 xl:pl-10 2xl:gap-x-10 2xl:pl-12">
              {menuItems.map((item, index) => (
                <li key={item.href} className="relative min-w-0">
                  <Link
                    ref={index === 0 ? firstDesktopNavLinkRef : undefined}
                    href={item.href}
                    // The active entry is marked by colour alone otherwise —
                    // the flat nav also lost the `aria-current` the dropdown
                    // rows used to carry.
                    aria-current={isActive(item.href) ? "page" : undefined}
                    data-nav-source="desktop"
                    className={cn(
                      // `py-2 -my-2` — hit area only, no layout shift (#2394):
                      // the same negative-margin trick the wordmark uses, not
                      // the same type recipe — that is 20px font-display, this
                      // is 11px mono. Desktop-only, so it never showed up in
                      // the 390px walk.
                      "relative -my-2 py-2",
                      CHROME_NAV_TYPE,
                      isActive(item.href)
                        ? "text-jersey-deep"
                        : "text-ink hover:text-jersey-deep",
                    )}
                  >
                    {/* On an inner span, not the link: `truncate` is `overflow:
                        hidden`, which would clip the dots drawn below the
                        link's box. */}
                    <span className={NAV_LABEL_TRUNCATE}>{item.label}</span>
                    <LinkPendingDots
                      placement="corner"
                      className="top-full left-1/2 -translate-x-1/2"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Gaps match the grid's column gap exactly, so the run from the
              last nav item through the search icon to the CTA is evenly
              spaced — otherwise the nav→icon step is the grid gap while the
              icon→CTA step is this one, and the two read as uneven. */}
          <div className="flex items-center gap-4 xl:gap-8 2xl:gap-10">
            <Link
              href="/zoeken"
              aria-label="Zoeken"
              data-nav-source="desktop"
              // 44×44 hit area (#2529 — DESIGN.md "The Tap Target Rule"):
              // same `h-11 w-11` pattern as the mobile search link above,
              // icon size unchanged. The row's own fixed
              // `h-[calc(var(--sticky-header-h)-1px)]` already exceeds 44px,
              // so the box centers within it with no row-height change.
              // `-mx-[13px]` cancels the (44 - 18) / 2 = 13px the box adds
              // on each side — hit area only, no layout shift, the same
              // idiom the desktop nav links above use (`-my-2 py-2`) — so
              // the nav→icon and icon→CTA gaps stay at the grid's own gap
              // (review finding on #3071: the un-cancelled box widened both
              // to ~29px and shrank the nav column enough to truncate more
              // 14ch-capped team labels at 1024px).
              className="text-ink hover:text-jersey-deep relative -mx-[13px] inline-flex h-11 w-11 items-center justify-center transition-colors"
            >
              <MagnifyingGlass size={18} aria-hidden="true" />
              <LinkPendingDots placement="corner" className="top-0 right-0" />
            </Link>
            <Link
              href="/club/word-lid"
              data-nav-source="desktop"
              className={cn(
                "border-ink text-ink hover:border-jersey-deep hover:text-jersey-deep relative inline-flex items-center border px-2.5 py-1.5 duration-150 xl:px-3.5 xl:py-2",
                CHROME_NAV_TYPE,
              )}
            >
              Word lid
              <LinkPendingDots placement="corner" className="-top-2 -right-2" />
            </Link>
          </div>
        </div>
      </header>

      <NavTakeover
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        wordmark={<Wordmark />}
        returnFocusRef={hamburgerRef}
        autoCloseFocusRef={firstDesktopNavLinkRef}
      >
        {menuItems.map((item) => (
          <NavTakeoverItem
            key={item.href}
            label={item.label}
            href={item.href}
            active={isActive(item.href)}
            onNavigate={() => handleTakeoverNavigate(item.href)}
          />
        ))}
        <div className="mt-6">
          <Link
            href="/club/word-lid"
            onClick={() => handleTakeoverNavigate("/club/word-lid")}
            className={getButtonClasses({
              variant: "primary",
              size: "md",
              fullWidth: true,
              className: "no-underline",
            })}
          >
            Word lid
            <LinkPendingDots spaced={false} tone="light" />
          </Link>
        </div>
      </NavTakeover>
    </>
  );
}
