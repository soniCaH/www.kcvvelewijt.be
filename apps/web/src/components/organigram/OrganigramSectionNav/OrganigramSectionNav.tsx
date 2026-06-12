"use client";

/**
 * <OrganigramSectionNav> — the hub's sticky in-page section nav (lock 7o2 /
 * 7o7). Two doors ("Hulp" → `#hulp`, "Structuur" → `#structuur`) with a
 * scroll-driven active state, plus the unified `<HubSearch>` repeated compactly.
 *
 * Sits below the global header (`sticky top-16`, a notch under the header's
 * `top-0 z-50`). Sections carry `scroll-mt-32` so hash jumps clear both bars.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { HubSearch } from "../HubSearch";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

const SECTIONS = [
  { id: "hulp", label: "Hulp" },
  { id: "structuur", label: "Structuur" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

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
  const [active, setActive] = useState<SectionId>("hulp");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        // The topmost intersecting section wins.
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        );
        setActive(topmost.target.id as SectionId);
      },
      // Top inset clears the header (64px) + this nav (~48px); the bottom inset
      // flips "active" near the top third of the viewport, not the very bottom.
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.25, 0.6] },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // The repeated search stays hidden until the hero (which carries its own
  // search) scrolls out of view — so the page never shows two search fields at
  // once. Hidden by default; only the observer callback toggles it (no flash,
  // no set-state-in-effect).
  const [heroOutOfView, setHeroOutOfView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    // No hero to track → leave the search hidden (it reveals relative to the
    // hero, which is always present on the hub).
    const hero = document.getElementById("hub-hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeroOutOfView(!entry.isIntersecting),
      // Top inset clears the header (64px) + this nav (~48px) so the search
      // reveals exactly as the hero (and its search) tucks behind the bars.
      { rootMargin: "-112px 0px 0px 0px" },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Secties van de hub"
      className={cn(
        "bg-cream-deep border-ink sticky top-16 z-30 border-b-2",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[80rem] items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <ul className="flex items-center gap-2">
          {SECTIONS.map((section) => {
            const isActive = active === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => {
                    setActive(section.id);
                    // Move keyboard focus into the target section (it's
                    // tabIndex=-1) so a keyboard/SR user actually lands there —
                    // the hash anchor alone leaves focus on the door (B3). The
                    // hash navigation handles the scroll (preventScroll here).
                    document
                      .getElementById(section.id)
                      ?.focus({ preventScroll: true });
                  }}
                  className={cn(
                    "border-ink inline-block border px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase transition-all duration-200",
                    isActive
                      ? "bg-jersey-deep text-cream"
                      : "bg-cream text-ink hover:bg-cream-soft shadow-[1px_1px_0_0_var(--color-ink)]",
                  )}
                >
                  {section.label}
                </a>
              </li>
            );
          })}
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
      </div>
    </nav>
  );
}
