import { Fragment } from "react";
import { cn } from "@/lib/utils/cn";
import {
  BG_CLASS,
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
        const next = filtered[i + 1];
        const hasOverlap =
          section.transition &&
          section.transition.overlap &&
          section.transition.overlap !== "none";
        const showTransition =
          next !== undefined &&
          section.transition !== undefined &&
          section.bg !== next.bg;
        const isLast = i === filtered.length - 1;

        return (
          // Fragment keeps the key while allowing the transition to sit
          // between section divs — not inside the current section's div.
          // This makes SectionTransition's marginBottom: "-1px" correctly
          // affect when the NEXT section div starts, eliminating sub-pixel
          // seam gaps between sections.
          <Fragment key={section.key ?? i}>
            <div
              className={cn(
                "w-full",
                BG_CLASS[section.bg],
                isLast &&
                  reserveFooterSafeArea &&
                  "pb-[var(--footer-diagonal)]",
              )}
            >
              {/* Section content wrapper — bg is owned by the outer
                  wrapper so the last-section footer-safe-area padding
                  sits inside the same colored surface. */}
              <div
                className={cn(
                  "w-full",
                  section.paddingTop ?? "pt-20",
                  section.paddingBottom ?? "pb-20",
                  hasOverlap && "relative z-0",
                )}
              >
                {section.content}
              </div>
            </div>

            {/* Transition rendered as sibling between sections — NOT inside the
                current section div. marginBottom: "-1px" on SectionTransition
                now pulls the next section up by 1px, covering sub-pixel gaps. */}
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
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
