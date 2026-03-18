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
        // Pull up 1px to eliminate the sub-pixel seam between the preceding
        // SectionTransition element and this section's wrapper div.
        const prevHadTransition =
          prev !== undefined &&
          prev.transition !== undefined &&
          prev.bg !== section.bg;

        return (
          // The key wrapper carries the section's background so any sub-pixel
          // gap between the section content div and the SectionTransition shows
          // the section color rather than the page/canvas background.
          // -mt-px: overlap 1px into the preceding SectionTransition so the
          // TO section's background covers any fractional-pixel rendering gap
          // at the key-wrapper boundary regardless of zoom or device pixel ratio.
          <div
            key={section.key ?? i}
            className={cn(
              "w-full",
              BG_CLASS[section.bg],
              prevHadTransition && "-mt-px",
            )}
          >
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

            {/* Transition between this section and the next */}
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
          </div>
        );
      })}
    </div>
  );
}
