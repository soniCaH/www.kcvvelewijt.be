"use client";

/**
 * <OrganigramSectionNav> — the hub's sticky in-page section nav (lock 7o2 /
 * 7o7, refined by #2478). Two doors ("Hulp" → `#hulp`, "Structuur" →
 * `#structuur`), each `<SectionNavChip>` — the light chip, filled by the
 * shared `useSectionNav` hook's scroll-spy, the same hook and the same chip
 * `<TeamSectionNav>` uses — plus the unified `<HubSearch>` repeated
 * compactly.
 *
 * Sits below the global header, pinned at `--sticky-header-h`. The shared
 * hook also derives `scroll-padding-top` from this bar's own measured
 * height; no section carries a hand-written `scroll-mt-*`. The hero-reveal
 * observer below reuses the hook's own `topInset` (header + bar) for its
 * unrelated offset need, rather than re-deriving it.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  PageContainer,
  SectionNavChip,
  SECTION_NAV_BAR_CLASSES,
} from "@/components/design-system";
import { HubSearch } from "../HubSearch";
import { useHubSearchTopInsetPublisher } from "../HubSearch/HubSearchQueryProvider";
import { useSectionNav } from "@/hooks/useSectionNav";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

const SECTIONS = [
  { id: "hulp", label: "Hulp" },
  { id: "structuur", label: "Structuur" },
] as const;

const SECTION_IDS = SECTIONS.map((s) => s.id);

export interface OrganigramSectionNavProps {
  members: OrgChartNode[];
  responsibilityPaths: ResponsibilityPath[];
  className?: string;
}

export function OrganigramSectionNav({
  members,
  responsibilityPaths,
  className,
}: OrganigramSectionNavProps) {
  const { navRef, activeId, topInset } = useSectionNav(SECTION_IDS);

  // The repeated search stays hidden until the hero (which carries its own
  // search) scrolls out of view — so the page never shows two search fields at
  // once. Hidden by default; only the observer callback toggles it (no flash,
  // no set-state-in-effect).
  const [heroOutOfView, setHeroOutOfView] = useState(false);

  // This bar is the only thing on the page that measures its own height, so
  // it publishes the pinned strip (header + bar) for the hub's searches: the
  // hero copy needs it to know when its box has tucked behind the chrome
  // rather than merely left the viewport (#3043). Republished on resize, so
  // that observer is never left holding the `0`-seeded first measurement.
  const publishTopInset = useHubSearchTopInsetPublisher();
  useEffect(() => {
    publishTopInset(topInset);
  }, [topInset, publishTopInset]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    // No hero to track → leave the search hidden (it reveals relative to the
    // hero, which is always present on the hub).
    const hero = document.getElementById("hub-hero");
    if (!hero) return;

    // Top inset clears the header + this bar so the search reveals exactly
    // as the hero (and its own search) tucks behind them.
    const observer = new IntersectionObserver(
      ([entry]) => setHeroOutOfView(!entry.isIntersecting),
      { rootMargin: `-${topInset}px 0px 0px 0px` },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [topInset]);

  return (
    <nav
      ref={navRef}
      aria-label="Secties van de hub"
      className={cn(SECTION_NAV_BAR_CLASSES, className)}
    >
      {/* No `flex-wrap`: the trailing search carries `min-w-0`, so with no
          wrap it squeezes (~177px on a 375px viewport, against ~154px of
          chips) instead of dropping to a second line and taking the bar
          from 52px to 106px mid-scroll. #2821 — the narrow-viewport half
          of the same defect the slot's height fixes at wide widths. */}
      <PageContainer width="index" className="flex items-center gap-3 py-2">
        <ul className="flex items-center gap-2">
          {SECTIONS.map((section) => (
            <SectionNavChip
              key={section.id}
              id={section.id}
              label={section.label}
              isActive={activeId === section.id}
            />
          ))}
        </ul>

        {heroOutOfView && (
          <HubSearch
            members={members}
            responsibilityPaths={responsibilityPaths}
            variant="nav"
            placeholder="Zoek…"
            className="ml-auto w-full max-w-[240px] min-w-0"
          />
        )}
      </PageContainer>
    </nav>
  );
}
