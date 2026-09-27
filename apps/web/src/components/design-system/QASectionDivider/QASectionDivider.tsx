import type { PortableTextBlock } from "@portabletext/react";

/**
 * <QASectionDivider> — interview act-divider primitive.
 *
 * Two variants:
 *
 *   - `variant="title"` (default) — major section break with title + rules +
 *     `✦` glyphs (Phase 3-b lock). Composition:
 *
 *     [1px ink rule]  ✦  {italic display title}  ✦  [1px ink rule]
 *                            AKTE 02 · DE OVERSTAP   (optional kicker)
 *
 *   - `variant="dotted"` (5.A.2 / 5.B.int) — thin dotted rule used as a
 *     between-row separator inside `<QASection>`. No title, no glyph, no
 *     kicker; just a centered ink-muted dotted line. Renders the same
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
 *   - aria-label on the wrapper is a plain string, NOT the raw blocks (AT
 *     would otherwise read structural noise instead of the title).
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

function flattenTitle(blocks: PortableTextBlock[]): string {
  const block = blocks[0];
  const children = (block as { children?: TitleSpan[] } | undefined)?.children;
  if (!Array.isArray(children)) return "";
  return children
    .map((c) => c.text ?? "")
    .join("")
    .trim();
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
  const plain = flattenTitle(title);

  return (
    // See the dotted variant above for why this is a `<div>`, not `<aside>`.
    <div
      role="separator"
      aria-label={plain}
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
        <span
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
        </span>
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
