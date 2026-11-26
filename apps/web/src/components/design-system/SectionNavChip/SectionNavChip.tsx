"use client";

import { cn } from "@/lib/utils/cn";
import {
  SECTION_NAV_CHIP_BASE_CLASSES,
  SECTION_NAV_CHIP_SHADOW_CLASS,
} from "../section-nav";

export interface SectionNavChipProps {
  /** Anchor target id (matches the section's own `id`). */
  id: string;
  /** Display label. */
  label: string;
  /** Scroll-spy driven — the fill means "the section being read", never
   *  "the one last clicked" (#2478 rule 3). */
  isActive: boolean;
}

/**
 * The light chip (#2478 rule 1) — 1px border, 1px shadow at rest, no
 * press-down. One recipe shared by every sticky in-page section nav
 * (`<TeamSectionNav>`, `<OrganigramSectionNav>`); previously hand-copied
 * into both, where the two had already drifted (`whitespace-nowrap`
 * present on one, missing on the other) inside the very diff whose premise
 * was one register on every route.
 *
 * Renders the `<li>` and `<a>` together — every consumer wraps its items in
 * a list, and this is the whole list-item unit, not just the inner tag.
 * Pass `key` on the element itself when mapping, as usual.
 *
 * Clicking moves keyboard focus into the target section — the hash anchor
 * alone leaves focus on `<body>` (#2478 rule 8); hash navigation performs
 * the scroll itself.
 */
export const SectionNavChip = ({
  id,
  label,
  isActive,
}: SectionNavChipProps) => {
  return (
    <li>
      <a
        href={`#${id}`}
        aria-current={isActive ? "location" : undefined}
        onClick={() => {
          document.getElementById(id)?.focus({ preventScroll: true });
        }}
        className={cn(
          SECTION_NAV_CHIP_BASE_CLASSES,
          "font-mono text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase transition-colors duration-150",
          isActive
            ? "bg-jersey-deep text-cream"
            : cn(
                "bg-cream text-ink hover:bg-cream-soft",
                SECTION_NAV_CHIP_SHADOW_CLASS,
              ),
        )}
      >
        {label}
      </a>
    </li>
  );
};
