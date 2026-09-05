import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils/cn";

export type EditorialLinkTone = "light" | "dark";

export interface EditorialLinkProps extends Omit<
  LinkProps,
  "className" | "href"
> {
  href: string;
  children: React.ReactNode;
  tone?: EditorialLinkTone;
  /** Trailing `→` glyph, visible at rest and sliding 4px right on
   *  hover/focus. Default `true` — see the docblock below. */
  withArrow?: boolean;
  className?: string;
}

const TEXT_TONE: Record<EditorialLinkTone, string> = {
  light: "text-jersey-deep",
  dark: "text-cream/85",
};

// Hit area, not spacing (#2394). The label is set at `leading-none` —
// correct as type, 11px tall as a thumb target. The padding grows it to
// ~27px and the equal negative margin pulls the box back, so the consumer
// does not shift by a pixel. The two halves only work as a pair: `py-2`
// alone would push `<SectionHeader>`'s heading row out of alignment.
const HIT_AREA = "py-2 -my-2";

/**
 * `<EditorialLink>` — the site's one onward-CTA treatment (#2474 rule 3): a
 * link that sends a visitor elsewhere **on the site** renders uppercase
 * mono with a trailing arrow, present at rest — the slide is a pointer-only
 * enhancement, never the cue itself (touch has no hover, #2474's measured
 * finding). It never carries the highlighter marker: the marker is reserved
 * for a link inside a running sentence (`.prose-link`), and #2474 measured
 * that the marker cannot bind to uppercase letterforms at any thickness —
 * matching absolute thickness against a mono cap-height reads as a
 * strikethrough, matching the x-height ratio renders too thin to see.
 *
 * Previously a two-variant component (`cta` / `inline`); `inline` — the
 * variant that overlapped `.prose-link` — had zero production consumers and
 * was deleted by #2565, along with the sweep both variants used to share.
 */
export const EditorialLink = ({
  href,
  children,
  tone = "light",
  withArrow = true,
  className,
  ...rest
}: EditorialLinkProps) => {
  return (
    <Link
      href={href}
      data-tone={tone}
      className={cn(
        "group inline-flex items-center gap-2",
        "text-label font-mono leading-none font-medium uppercase",
        HIT_AREA,
        TEXT_TONE[tone],
        className,
      )}
      {...rest}
    >
      {children}
      {withArrow && (
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
        >
          →
        </span>
      )}
    </Link>
  );
};
