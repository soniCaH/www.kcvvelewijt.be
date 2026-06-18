import { Fragment } from "react";
import { cn } from "@/lib/utils/cn";
import {
  BG_CLASS,
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
   * AND into the adjacent striped-seam transition strips. Rendered absolutely
   * positioned at z-0; section content sits at z-10. The backdrop's top/bottom
   * overflow into a neighbour seam by that seam's bleed height (see
   * `docs/prd/section-backdrop-pattern.md` §5).
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
        // A seam renders below this section when the next section differs in bg.
        const showTransition =
          next !== undefined &&
          section.transition !== undefined &&
          section.bg !== next.bg;
        // A seam renders ABOVE this section when the previous section fired one
        // (its bg differs from ours). Drives the backdrop's top overflow.
        const hasPrevTransition =
          prev !== undefined &&
          prev.transition !== undefined &&
          prev.bg !== section.bg;
        // React's null-marker semantics: `false`, `null`, and `undefined` all
        // render as nothing. Treat them uniformly as "no backdrop" so patterns
        // like `backdrop={cond && <Layer />}` don't render an empty layer.
        const hasBackdrop =
          section.backdrop !== false && section.backdrop != null;

        return (
          // Fragment keeps the key while letting the seam sit between section
          // divs (not inside the current one), so its `-mb-px` correctly pulls
          // the NEXT section up and swallows sub-pixel seam gaps.
          <Fragment key={section.key ?? i}>
            <div className={cn("relative w-full", BG_CLASS[section.bg])}>
              {/* Backdrop layer (z-0 within the section wrapper) — overflows
                  into adjacent seam strips by each seam's bleed height. The
                  `+ 1px` aligns the backdrop edge with the seam's `-1px`
                  seam-guard pull so no hairline shows. No neighbour seam → 0. */}
              {hasBackdrop &&
                (() => {
                  const top =
                    hasPrevTransition && prev?.transition
                      ? `calc(-1 * ${getTransitionBleed(prev.transition)} + 1px)`
                      : "0";
                  const bottom =
                    showTransition && section.transition
                      ? `calc(-1 * ${getTransitionBleed(section.transition)} + 1px)`
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

              {/* Section content — bg owned by the outer wrapper so padding sits
                  inside the same surface. z-10 places content above the
                  backdrop layer. */}
              <div
                className={cn(
                  "w-full",
                  section.paddingTop ?? "pt-20",
                  section.paddingBottom ?? "pb-20",
                  hasBackdrop && "relative z-10",
                )}
              >
                {section.content}
              </div>
            </div>

            {/* Seam rendered as a sibling between sections. */}
            {showTransition && <SectionTransition {...section.transition!} />}
          </Fragment>
        );
      })}
    </div>
  );
}
