import { Fragment } from "react";
import { cn } from "@/lib/utils/cn";
import {
  BG_CLASS,
  DIAGONAL_HEIGHT,
  SectionTransition,
  getTransitionBleed,
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
}

export function SectionStack({ sections, className }: SectionStackProps) {
  const filtered = sections.filter(Boolean) as SectionConfig[];

  return (
    <div className={cn("w-full", className)}>
      {filtered.map((section, i) => {
        const prev = filtered[i - 1];
        const next = filtered[i + 1];
        const hasOverlap =
          section.transition !== undefined &&
          "overlap" in section.transition &&
          section.transition.overlap !== undefined &&
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
        // React's null-marker semantics: `false`, `null`, and `undefined`
        // all render as nothing. Treat them uniformly as "no backdrop" so
        // common patterns like `backdrop={cond && <Layer />}` (which yields
        // `false` when `cond` is false) don't propagate reveal flags onto
        // adjacent transitions and leave their triangles transparent with
        // nothing behind them.
        const hasBackdrop =
          section.backdrop !== false && section.backdrop != null;
        const hasNextBackdrop =
          next?.backdrop !== false && next?.backdrop != null;
        // For non-overlap transitions (the common case), the seam-guard
        // `marginBottom: -1px` on `SectionTransition` pulls the next section
        // up by 1px. Without compensation, a backdrop with
        // `top: calc(-1 * var(--footer-diagonal))` would overflow exactly
        // 1px ABOVE the transition top into the previous section, painting
        // the gradient over the previous section's bg and creating a visible
        // hairline. The `+ 1px` aligns the backdrop edge with the transition
        // edge. Overlap transitions don't need this — their geometry already
        // lands the backdrop's edge at the transition top.
        const prevTransitionIsNonOverlap =
          prev?.transition !== undefined &&
          ("overlap" in prev.transition
            ? prev.transition.overlap === undefined ||
              prev.transition.overlap === "none"
            : true);
        const transitionIsNonOverlap =
          section.transition !== undefined &&
          ("overlap" in section.transition
            ? section.transition.overlap === undefined ||
              section.transition.overlap === "none"
            : true);

        return (
          // Fragment keeps the key while allowing the transition to sit
          // between section divs — not inside the current section's div.
          // This makes SectionTransition's marginBottom: "-1px" correctly
          // affect when the NEXT section div starts, eliminating sub-pixel
          // seam gaps between sections.
          <Fragment key={section.key ?? i}>
            <div className={cn("relative w-full", BG_CLASS[section.bg])}>
              {/* Backdrop layer (§5.1 — z-0 within the section wrapper,
                  extends into adjacent transition strips via negative top /
                  bottom when a neighbor transition exists). Auto-propagation
                  of revealFrom / revealTo on those transitions is handled
                  below so the triangle on this section's side is transparent
                  and the backdrop paints through. */}
              {hasBackdrop &&
                (() => {
                  // Per-transition bleed compensation — diagonal /
                  // double-diagonal use `--footer-diagonal`, striped-seam
                  // uses its own px height. `getTransitionBleed` picks
                  // the right value per variant so the backdrop edge
                  // lines up with the transition top regardless of type.
                  const prevBleed = prev?.transition
                    ? getTransitionBleed(prev.transition)
                    : DIAGONAL_HEIGHT;
                  const nextBleed = section.transition
                    ? getTransitionBleed(section.transition)
                    : DIAGONAL_HEIGHT;
                  const top = hasPrevTransition
                    ? prevTransitionIsNonOverlap
                      ? `calc(-1 * ${prevBleed} + 1px)`
                      : `calc(-1 * ${prevBleed})`
                    : "0";
                  const bottom = showTransition
                    ? transitionIsNonOverlap
                      ? `calc(-1 * ${nextBleed} + 1px)`
                      : `calc(-1 * ${nextBleed})`
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
                  wrapper so the section's padding sits inside the same
                  colored surface. z-10 places content above the backdrop
                  layer (§5.1). */}
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
                {...section.transition!}
                from={section.bg}
                to={next.bg}
                revealFrom={hasBackdrop || undefined}
                revealTo={hasNextBackdrop || undefined}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
