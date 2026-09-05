import { cn } from "@/lib/utils/cn";
import {
  EditorialHeading,
  type EditorialHeadingEmphasis,
  type EditorialHeadingSize,
} from "../EditorialHeading";
import { EditorialLink } from "../EditorialLink";
import { MonoLabelRow, type MonoLabelRowItem } from "../MonoLabelRow";

type SectionHeaderCta = { linkText: string; linkHref: string };

/**
 * The full `ruled` constraint (AC2, D10/S2 — decision-sheet.md §8: "a
 * length rule or a single-line constraint") is two cooperating parts,
 * documented here once as the single source of truth — `ruled`'s own doc
 * comment, the dev warning, and the Storybook boundary story all just
 * point back here rather than restating it:
 *
 * 1. A character ceiling on `title` — this constant. Sized with headroom
 *    over the D10 evidence heading ("Negentien ploegen, van U6 tot U21",
 *    33 chars) in
 *    docs/design/mockups/research-d-series/d10-section-openers.html. Past
 *    this length, at ANY viewport, `ruled` is ignored outright (see
 *    `isRuled` below) — a heading this long scans worse centred between
 *    rules than it does ranged left.
 * 2. The hairlines + centring only render from Tailwind's `lg` breakpoint
 *    (1024px) up — the `lg:` classes below. `--text-display-lg`
 *    (`clamp(2rem, 1.25rem + 3vw, 3rem)`) only reaches its 48px ceiling
 *    above a ~933px viewport, and a 40-char title at 48px (~735px measured)
 *    only has comfortable room to spare inside a real page's ~960px
 *    content column from `lg` onward. At `md` (768px, ~43px font) the same
 *    title leaves under 10px of rule per side, and below `md` it wraps
 *    outright — which, uncentred, would put a hairline through the gutter
 *    between the two wrapped lines. Below `lg`, `ruled` renders the exact
 *    default (ranged-left, unruled) treatment instead: the chaptering
 *    device is for a wide index page, not a phone screen.
 *
 * Together the two guarantee the title is genuinely one line wherever the
 * ruled visual actually renders.
 */
const RULED_TITLE_MAX_LENGTH = 40;

export type SectionHeaderBase = {
  title: string;
  /** Optional uppercase mono kicker rendered above the heading via <MonoLabelRow> */
  kicker?: MonoLabelRowItem[];
  /** Optional italic emphasis pass-through to the underlying <EditorialHeading> */
  emphasis?: EditorialHeadingEmphasis;
  /**
   * Size of the underlying <EditorialHeading>. Default: 'display-lg'.
   * Fixed at the default whenever `ruled` is true — see
   * `SectionHeaderRuled` below.
   */
  size?: EditorialHeadingSize;
  /** "light" = ink on cream (default); "dark" = cream on ink */
  variant?: "light" | "dark";
  /**
   * Ruled treatment (D10/S2): hairlines run out from a centred title,
   * chapter furniture for a long index page. Orthogonal to `variant` —
   * `variant` is the ground colour, `ruled` is this heading-row layout, so
   * either combines with either.
   *
   * The length/viewport constraint this variant carries is documented
   * once, on `RULED_TITLE_MAX_LENGTH` — in short, past that character
   * count or below the `lg` breakpoint this renders the default treatment
   * instead. Default: false.
   */
  ruled?: boolean;
  /** Override the rendered heading level. Default: h2 */
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/**
 * `ruled` is only evidenced at the default `display-lg` size — the D10
 * mockup shows no other size paired with the ruled treatment, and the
 * character/viewport math in `RULED_TITLE_MAX_LENGTH` is calibrated for it
 * alone — so `size` is disallowed at the type level whenever `ruled` is
 * `true`, rather than left to silently mis-render at an unevidenced size.
 */
type SectionHeaderRuled = { ruled?: false } | { ruled: true; size?: never };

export type SectionHeaderProps = SectionHeaderBase &
  ({ linkText?: never; linkHref?: never } | SectionHeaderCta) &
  SectionHeaderRuled;

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
 * All existing call sites continue to work — `kicker`, `emphasis` and
 * `ruled` are additive opt-in props.
 */
export const SectionHeader = ({
  title,
  kicker,
  emphasis,
  size = "display-lg",
  linkText,
  linkHref,
  variant = "light",
  ruled = false,
  as = "h2",
  className,
}: SectionHeaderProps) => {
  const isDark = variant === "dark";
  const isRuled = ruled && title.trim().length <= RULED_TITLE_MAX_LENGTH;

  if (ruled && !isRuled && process.env.NODE_ENV === "development") {
    console.warn(
      `[SectionHeader] ruled treatment ignored for title "${title}" — see RULED_TITLE_MAX_LENGTH's doc comment in SectionHeader.tsx for the constraint.`,
    );
  }

  // The flanking hairlines: a full-opacity 1px-tall bg-ink/bg-cream span —
  // the documented hairline weight (DESIGN.md) — drawn the same way
  // <QASectionDivider>'s title variant draws its own rules. Unlike that
  // primitive this doesn't force `line-height: 1` onto the heading text:
  // EditorialHeading's custom font-size tokens and an explicit `leading-*`
  // share a tailwind-merge conflict group where the size token loses
  // (cn.ts, #2769), so forcing it here would silently drop the heading's
  // font size. The rule ends up on the line-box centre rather than the
  // cap-height centre — a couple of px off at 48px — which isn't worth
  // that risk given `ruled` is restricted to one size.
  const hairlineClass = isDark ? "bg-cream" : "bg-ink";

  const headingEl = (
    <EditorialHeading
      level={headingLevelFor(as)}
      size={size}
      emphasis={emphasis}
      tone={isDark ? "cream" : "ink"}
    >
      {title}
    </EditorialHeading>
  );

  const ctaEl =
    linkText && linkHref ? (
      <EditorialLink href={linkHref} tone={isDark ? "dark" : "light"}>
        {linkText}
      </EditorialLink>
    ) : null;

  // Reused as two sibling children below (not array-rendered, so no `key`
  // is needed) rather than writing the same span out twice. `hidden
  // lg:block` is the responsive half of the constraint documented on
  // RULED_TITLE_MAX_LENGTH: below `lg` the rule is `display: none`, so it
  // takes no part in layout and the row falls back to the default
  // heading-and-CTA treatment.
  const hairline = (
    <span
      aria-hidden="true"
      className={cn("hidden h-px flex-1 self-center lg:block", hairlineClass)}
    />
  );

  // One row, one DOM position for the CTA, in both treatments — a second
  // copy behind a responsive `hidden` would put the same link in the tab
  // order twice. The ruled treatment reflows that single row at `lg`
  // instead: `lg:basis-full` pushes the CTA onto its own centred line under
  // the ruled row, while below `lg` the wrapper is inert and the CTA sits
  // beside the heading exactly as the default treatment does.
  const row = (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-2",
        isRuled && "w-full lg:items-center lg:gap-4",
      )}
    >
      {isRuled && hairline}
      {headingEl}
      {isRuled && hairline}
      {ctaEl && isRuled ? (
        <span className="lg:basis-full lg:text-center">{ctaEl}</span>
      ) : (
        ctaEl
      )}
    </div>
  );

  return (
    <header
      className={cn(
        "mb-10 flex flex-col gap-3",
        isRuled && "lg:items-center lg:text-center",
        className,
      )}
      data-ruled={isRuled || undefined}
    >
      {kicker && kicker.length > 0 && <MonoLabelRow items={kicker} />}
      {row}
    </header>
  );
};
