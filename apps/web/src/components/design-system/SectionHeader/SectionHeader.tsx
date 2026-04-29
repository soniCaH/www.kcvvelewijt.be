import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  EditorialHeading,
  type EditorialHeadingEmphasis,
  type EditorialHeadingSize,
} from "../EditorialHeading";
import { MonoLabelRow, type MonoLabelRowItem } from "../MonoLabelRow";

// Mask-image shape for the CTA hover highlighter underline. Same conceptual
// geometry as <HighlighterStroke>'s STROKE_PATH (4-point clean slab) but
// emitted as a mask with no fill colour so the consuming element can fill
// with `background-color` (here: bg-jersey/65) without rendering the
// hard-coded jersey green that the primitive carries.
//
// TODO(phase-4): consolidate with <HighlighterStroke> once it gains a
// `currentColor` / mask-mode option per PRD §11.7 / issue #1488 §b. At that
// point this inline shape can drop in favour of `<HighlighterStroke
// color="currentColor" />` (or similar) and SectionHeader can delete the
// duplicated SVG path string below.
const HIGHLIGHTER_MASK_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 14' preserveAspectRatio='none'><path d='M 1 5.4 L 99 5.0 L 99 10.4 L 1 10.6 Z' fill='black'/></svg>`,
)}`;

export interface SectionHeaderProps {
  title: string;
  /** Optional uppercase mono kicker rendered above the heading via <MonoLabelRow> */
  kicker?: MonoLabelRowItem[];
  /** Optional italic emphasis pass-through to the underlying <EditorialHeading> */
  emphasis?: EditorialHeadingEmphasis;
  /** Size of the underlying <EditorialHeading>. Default: 'display-lg' */
  size?: EditorialHeadingSize;
  /** Optional CTA link label */
  linkText?: string;
  /** Required when linkText is set */
  linkHref?: string;
  /** "light" = ink on cream (default); "dark" = cream on ink */
  variant?: "light" | "dark";
  /** Override the rendered heading level. Default: h2 */
  as?: "h1" | "h2" | "h3";
  className?: string;
}

const headingLevelFor = (as: SectionHeaderProps["as"]): 1 | 2 | 3 =>
  as === "h1" ? 1 : as === "h3" ? 3 : 2;

/**
 * Section header reworked in Phase 1 to compose <EditorialHeading> +
 * <MonoLabelRow>. Drops the legacy `font-body!` / `font-black!` / `mb-0!` /
 * green-left-border treatment in favour of the redesign editorial vocabulary.
 *
 * All existing call sites continue to work — `kicker` and `emphasis` are
 * additive opt-in props.
 */
export const SectionHeader = ({
  title,
  kicker,
  emphasis,
  size = "display-lg",
  linkText,
  linkHref,
  variant = "light",
  as = "h2",
  className,
}: SectionHeaderProps) => {
  const isDark = variant === "dark";

  return (
    <header className={cn("mb-10 flex flex-col gap-3", className)}>
      {kicker && kicker.length > 0 && <MonoLabelRow items={kicker} />}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <EditorialHeading
          level={headingLevelFor(as)}
          size={size}
          emphasis={emphasis}
          tone={isDark ? "cream" : "ink"}
        >
          {title}
        </EditorialHeading>
        {linkText && linkHref && (
          <Link
            href={linkHref}
            className={cn(
              "group inline-flex items-center gap-2 font-mono text-[length:var(--text-label)] leading-none font-medium tracking-[var(--text-label--tracking)] uppercase",
              // Static text colour — no hover colour swap. Highlighter underline
              // (animated below) carries the hover affordance instead.
              isDark ? "text-cream/85" : "text-jersey-deep",
            )}
          >
            <span className="relative inline-block">
              {linkText}
              {/* Highlighter underline accent — jersey bright at moderate
                  opacity to read as a deliberate brand accent (not the link
                  text colour). Animates left-to-right on hover via scale-x. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute right-0 -bottom-1 left-0 h-[0.45em] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none",
                  // Brand accent — jersey green at ~65% so the underline reads
                  // as a marker pass against the link's text colour rather
                  // than a flat solid stripe.
                  "bg-jersey/65",
                )}
                style={{
                  WebkitMaskImage: `url("${HIGHLIGHTER_MASK_DATA_URL}")`,
                  maskImage: `url("${HIGHLIGHTER_MASK_DATA_URL}")`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                }}
              />
            </span>
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </Link>
        )}
      </div>
    </header>
  );
};
