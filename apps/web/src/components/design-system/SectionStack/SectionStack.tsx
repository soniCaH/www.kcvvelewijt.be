import { Fragment } from "react";
import { cn } from "@/lib/utils/cn";
import {
  BG_CLASS,
  DIAGONAL_HEIGHT,
  SectionTransition,
} from "@/components/design-system/SectionTransition/SectionTransition";
import type {
  SectionBg,
  SectionTransitionConfig,
} from "@/components/design-system/SectionTransition/SectionTransition";

export type { SectionBg, SectionTransitionConfig };

export interface SectionConfig {
  bg: SectionBg;
  content: React.ReactNode;
  /**
   * Optional backdrop layer painted full-bleed behind the section content
   * AND into the top/bottom halves of any adjacent diagonal transitions.
   * Rendered absolutely positioned at z-0; section content sits at z-10.
   *
   * When set, SectionStack automatically sets revealFrom/revealTo on the
   * adjacent transitions so their triangles on this section's side stay
   * transparent and the backdrop shows through. See
   * `docs/prd/section-backdrop-pattern.md` §5.
   */
  backdrop?: React.ReactNode;
  paddingTop?: string;
  paddingBottom?: string;
  transition?: SectionTransitionConfig;
  key?: string;
}

export interface SectionStackProps {
  sections: (SectionConfig | null | false | undefined)[];
  className?: string;
  /**
   * When true (default), the last section's outer wrapper reserves a
   * footer-diagonal-sized safe area on its bottom so the section's bg
   * extends through the `PageFooter`'s `overlap="full"` diagonal. Set
   * to `false` when the stack is not the final element before the
   * footer (e.g. a nested stack with content below). See #1360.
   */
  reserveFooterSafeArea?: boolean;
}

export function SectionStack({
  sections,
  className,
  reserveFooterSafeArea = true,
}: SectionStackProps) {
  const filtered = sections.filter(Boolean) as SectionConfig[];

  return (
    <div className={cn("w-full", className)}>
      {filtered.map((section, i) => {
        const prev = filtered[i - 1];
        const next = filtered[i + 1];
        const hasOverlap =
          section.transition &&
          section.transition.overlap &&
          section.transition.overlap !== "none";
        const showTransition =
          next !== undefined &&
          section.transition !== undefined &&
          section.bg !== next.bg;
        // A transition rendered ABOVE this section means the previous section
        // fired a transition because its bg differs from ours. This matters
        // for backdrop extension (§5.6): without a neighbor transition the
        // backdrop's top/bottom stays at 0 instead of overflowing.
        const hasPrevTransition =
          prev !== undefined &&
          prev.transition !== undefined &&
          prev.bg !== section.bg;
        const isLast = i === filtered.length - 1;
        const hasBackdrop = section.backdrop !== undefined;

        return (
          // Fragment keeps the key while allowing the transition to sit
          // between section divs — not inside the current section's div.
          // This makes SectionTransition's marginBottom: "-1px" correctly
          // affect when the NEXT section div starts, eliminating sub-pixel
          // seam gaps between sections.
          <Fragment key={section.key ?? i}>
            <div
              className={cn(
                "relative w-full",
                BG_CLASS[section.bg],
                isLast &&
                  reserveFooterSafeArea &&
                  "pb-[var(--footer-diagonal)]",
              )}
            >
              {/* Backdrop layer (§5.1 — z-0 within the section wrapper,
                  extends into adjacent transition strips via negative top /
                  bottom when a neighbor transition exists). Auto-propagation
                  of revealFrom / revealTo on those transitions is handled
                  below so the triangle on this section's side is transparent
                  and the backdrop paints through. */}
              {hasBackdrop &&
                (() => {
                  const top = hasPrevTransition
                    ? `calc(-1 * ${DIAGONAL_HEIGHT})`
                    : "0";
                  const bottom = showTransition
                    ? `calc(-1 * ${DIAGONAL_HEIGHT})`
                    : "0";
                  return (
                    <div
                      aria-hidden="true"
                      data-testid="section-backdrop"
                      data-top={top}
                      data-bottom={bottom}
                      className="pointer-events-none absolute inset-x-0 z-0"
                      style={{ top, bottom }}
                    >
                      {section.backdrop}
                    </div>
                  );
                })()}

              {/* Section content wrapper — bg is owned by the outer
                  wrapper so the last-section footer-safe-area padding
                  sits inside the same colored surface. z-10 places
                  content above the backdrop layer (§5.1). */}
              <div
                className={cn(
                  "w-full",
                  section.paddingTop ?? "pt-20",
                  section.paddingBottom ?? "pb-20",
                  (hasBackdrop || hasOverlap) && "relative",
                  hasBackdrop ? "z-10" : hasOverlap && "z-0",
                )}
              >
                {section.content}
              </div>
            </div>

            {/* Transition rendered as sibling between sections — NOT inside the
                current section div. marginBottom: "-1px" on SectionTransition
                now pulls the next section up by 1px, covering sub-pixel gaps.
                Reveal flags are derived from neighbor `backdrop` presence:
                consumers never set them manually (PRD §3.2, §8). */}
            {showTransition && (
              <SectionTransition
                from={section.bg}
                to={next.bg}
                type={section.transition!.type}
                direction={section.transition!.direction}
                via={
                  "via" in section.transition!
                    ? section.transition!.via
                    : undefined
                }
                overlap={section.transition!.overlap}
                revealFrom={hasBackdrop || undefined}
                revealTo={next.backdrop !== undefined || undefined}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
