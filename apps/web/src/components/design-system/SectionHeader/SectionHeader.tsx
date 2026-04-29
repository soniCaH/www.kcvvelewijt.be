import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  EditorialHeading,
  type EditorialHeadingEmphasis,
  type EditorialHeadingSize,
} from "../EditorialHeading";
import { MonoLabelRow, type MonoLabelRowItem } from "../MonoLabelRow";
import { STROKE_PATH } from "../HighlighterStroke/strokes";

// Mask-image for the CTA hover highlighter underline. Uses the shared
// STROKE_PATH from HighlighterStroke/strokes.ts so both components share the
// same geometry. Emitted as a mask (fill='black') so the consuming element
// can fill with `background-color` without rendering a hard-coded colour.
//
// TODO(phase-4): consolidate with <HighlighterStroke> once it gains a
// `currentColor` / mask-mode option per PRD §11.7 / issue #1488 §b.
const HIGHLIGHTER_MASK_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 14' preserveAspectRatio='none'><path d='${STROKE_PATH}' fill='black'/></svg>`,
)}`;

type SectionHeaderCta = { linkText: string; linkHref: string };

export type SectionHeaderBase = {
  title: string;
  /** Optional uppercase mono kicker rendered above the heading via <MonoLabelRow> */
  kicker?: MonoLabelRowItem[];
  /** Optional italic emphasis pass-through to the underlying <EditorialHeading> */
  emphasis?: EditorialHeadingEmphasis;
  /** Size of the underlying <EditorialHeading>. Default: 'display-lg' */
  size?: EditorialHeadingSize;
  /** "light" = ink on cream (default); "dark" = cream on ink */
  variant?: "light" | "dark";
  /** Override the rendered heading level. Default: h2 */
  as?: "h1" | "h2" | "h3";
  className?: string;
};

export type SectionHeaderProps = SectionHeaderBase &
  ({ linkText?: never; linkHref?: never } | SectionHeaderCta);

function headingLevelFor(as: SectionHeaderProps["as"]): 1 | 2 | 3 {
  switch (as) {
    case "h1":
      return 1;
    case "h3":
      return 3;
    case "h2":
    case undefined:
      return 2;
    default: {
      // Exhaustiveness check — TypeScript narrows `as` to `never` here, so
      // adding a new tag variant to SectionHeaderProps['as'] without a case
      // becomes a compile-time error.
      const _exhaustive: never = as;
      throw new Error(`headingLevelFor: unhandled value ${_exhaustive}`);
    }
  }
}

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
                  "absolute right-0 -bottom-1 left-0 h-[0.45em] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none",
                  isDark ? "bg-jersey/65" : "bg-jersey-deep",
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
              className="inline-block transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </Link>
        )}
      </div>
    </header>
  );
};
