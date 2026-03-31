import { Fragment } from "react";
import { cn } from "@/lib/utils/cn";
import { SectionTransition } from "@/components/design-system/SectionTransition/SectionTransition";
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
}

const BG_CLASS: Record<SectionBg, string> = {
  white: "bg-white",
  "gray-100": "bg-gray-100",
  "kcvv-black": "bg-kcvv-black",
  "kcvv-green-dark": "bg-kcvv-green-dark",
  transparent: "bg-transparent",
};

export function SectionStack({ sections, className }: SectionStackProps) {
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

        return (
          // Fragment keeps the key while allowing the transition to sit
          // between section divs — not inside the current section's div.
          // This makes SectionTransition's marginBottom: "-1px" correctly
          // affect when the NEXT section div starts, eliminating sub-pixel
          // seam gaps between sections.
          <Fragment key={section.key ?? i}>
            <div className={cn("w-full", BG_CLASS[section.bg])}>
              {/* Section content wrapper */}
              <div
                className={cn(
                  "w-full",
                  BG_CLASS[section.bg],
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
