import type { PortableTextBlock } from "@portabletext/react";

/**
 * <QASectionDivider> — interview act-divider primitive.
 *
 * Two variants:
 *
 *   - `variant="title"` (default) — major section break with title + rules +
 *     `✦` glyphs (Phase 3-b lock). The title is a real `<h2>` (#2523): a
 *     heading already marks a section start, so the wrapper is a plain
 *     `<div>` with no `role`/`aria-label`, and the heading's own text is its
 *     accessible name. Composition:
 *
 *     [1px ink rule]  ✦  {italic display title}  ✦  [1px ink rule]
 *                            AKTE 02 · DE OVERSTAP   (optional kicker)
 *
 *   - `variant="dotted"` (5.A.2 / 5.B.int) — thin dotted rule used as a
 *     between-row separator inside `<QASection>`. No title, no glyph, no
 *     kicker; just a centered ink-muted dotted line. Renders a
 *     `<div role="separator">` shell (a plain `<div>`, not `<aside>` — see
 *     #3188: `separator` is not an allowed role for `<aside>`'s implicit
 *     landmark role) so AT picks it up as a structural break, with an
 *     `aria-label` falling back to the literal "Volgende vraag" Dutch
 *     convention so screen readers don't read a nameless separator.
 *
 * Three-centerline alignment contract for the `title` variant — must hold to
 * within 1px:
 *   1. centerline of the 1px ink rules
 *   2. optical centre of the ✦ glyphs
 *   3. cap-height midpoint of the italic Freight Display title
 *
 * Implementation rules — see
 * `docs/design/mockups/phase-3-a-tier-c-figures/qasectiondivider-locked.md`:
 *   - Flexbox row with `align-items: center` + `line-height: 1` so the flex
 *     centerline IS the optical centerline.
 *   - ✦ glyphs render as separate flex children, NEVER pseudo-elements on the
 *     title (same architectural reason as <EndMark>).
 *   - The glyph silhouette is reserved for this primitive; <EndMark> uses ★.
 *   - Why the title is not a `role="separator"`: `separator` has presentational
 *     children, so an `<h2>` inside it drops out of the accessibility tree,
 *     and `role="separator"` on the `<h2>` itself replaces the heading role
 *     (and is not allowed on `<h2>` — axe `aria-allowed-role`).
 */

interface TitleSpan {
  _type?: "span";
  _key?: string;
  text?: string;
  marks?: string[];
}

export type QASectionDividerVariant = "title" | "dotted";

export interface QASectionDividerProps {
  variant?: QASectionDividerVariant;
  /**
   * Title rendered as Portable Text. Single-block constrained PT — text
   * spans may carry the `accent` decorator. Spans without `accent` render
   * plain ink italic; spans with `accent` render jersey-deep + weight 900.
   * Required when `variant` defaults to or is `"title"`. Ignored on
   * `variant="dotted"`.
   */
  title?: PortableTextBlock[];
  /**
   * Optional mono caps act label rendered under the rule. Omit to drop the
   * second row entirely. Ignored on `variant="dotted"`.
   */
  kicker?: string;
}

export function QASectionDivider({
  variant = "title",
  title,
  kicker,
}: QASectionDividerProps) {
  if (variant === "dotted") {
    return (
      // A plain `<div>`, not `<aside>` (#3188): `role="separator"` is not an
      // allowed role for `<aside>`'s implicit `complementary` landmark role
      // per the ARIA-in-HTML spec — axe's `aria-allowed-role` flags it. A
      // `<div>` carries no implicit role, so the explicit `separator` role
      // is valid there. Same classes, same box model (both default to
      // `display: block`) — no visual change.
      <div
        role="separator"
        aria-label="Volgende vraag"
        data-divider-variant="dotted"
        className="mx-auto my-6 w-full max-w-[580px]"
      >
        <hr
          aria-hidden="true"
          className="border-ink-muted m-0 border-0 border-t border-dotted"
        />
      </div>
    );
  }

  if (!title) {
    // Title variant requires PT — defensive return-null rather than crash
    // when an upstream caller forgets the prop. The Studio's qaSectionDivider
    // PT block validator ensures `title` is non-empty in production data.
    return null;
  }

  const block = title[0] as { children?: TitleSpan[] } | undefined;
  const spans = Array.isArray(block?.children) ? block.children : [];

  return (
    // A plain `<div>` with no role: the `<h2>` below names the section (#2523).
    <div
      data-divider-variant="title"
      className="mx-auto my-10 w-full max-w-[580px]"
    >
      <div className="flex items-center leading-none">
        <span
          data-divider="rule"
          aria-hidden="true"
          className="bg-ink h-px min-w-4 flex-1 self-center"
        />
        <span
          data-divider="glyph"
          aria-hidden="true"
          className="text-jersey-deep mx-2 inline-flex items-center text-[14px] leading-none"
        >
          ✦
        </span>
        {/* A literal `<h2>`, one level above PT `h3` / `TOP_HEADING_LEVEL`
            (`@/components/article/ArticleBody`) — design-system/ never imports
            from article/, so the level is restated here, not shared. If that
            constant changes, change this tag with it. */}
        <h2
          data-divider="title"
          // Wraps rather than runs off (#2526): display type is never cut
          // (#2549 rule 2). A long h2 such as "Doorstroming + jong talent
          // vanuit de U21" is 351px on one line; `text-balance` splits it
          // evenly between the glyphs, and `leading-none` holds on two lines.
          // An h2 is editor free text, so DESIGN.md's Hyphenation Rule applies:
          // `hyphens-auto` + `break-words` keep one long compound
          // ("Seizoensvoorbereiding") off the glyphs. #2269's "break-words
          // suppresses the hyphen" did not reproduce (#2586).
          className="font-display min-w-0 px-1.5 text-center text-[22px] leading-none font-semibold text-balance break-words hyphens-auto italic"
        >
          {spans.map((span, i) => {
            const isAccent = (span.marks ?? []).includes("accent");
            const text = span.text ?? "";
            if (isAccent) {
              return (
                <em
                  key={span._key ?? i}
                  data-divider="accent"
                  className="text-jersey-deep font-black italic"
                >
                  {text}
                </em>
              );
            }
            return <span key={span._key ?? i}>{text}</span>;
          })}
        </h2>
        <span
          data-divider="glyph"
          aria-hidden="true"
          className="text-jersey-deep mx-2 inline-flex items-center text-[14px] leading-none"
        >
          ✦
        </span>
        <span
          data-divider="rule"
          aria-hidden="true"
          className="bg-ink h-px min-w-4 flex-1 self-center"
        />
      </div>
      {kicker ? (
        <p
          data-divider="kicker"
          className="text-ink-muted mt-2 text-center font-mono text-[10px] leading-none tracking-[0.18em] uppercase"
        >
          {kicker}
        </p>
      ) : null}
    </div>
  );
}
