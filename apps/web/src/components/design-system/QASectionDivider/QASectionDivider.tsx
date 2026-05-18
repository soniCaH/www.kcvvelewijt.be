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
 *     `<aside role="separator">` shell so AT picks it up as a structural
 *     break, with an `aria-label` falling back to the literal "Volgende
 *     vraag" Dutch convention so screen readers don't read a nameless
 *     separator.
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
      <aside
        role="separator"
        aria-label="Volgende vraag"
        data-divider-variant="dotted"
        className="mx-auto my-6 w-full max-w-[580px]"
      >
        <hr
          aria-hidden="true"
          className="border-ink-muted m-0 border-0 border-t border-dotted"
        />
      </aside>
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
    <aside
      role="separator"
      aria-label={plain}
      data-divider-variant="title"
      className="mx-auto my-10 w-full max-w-[580px]"
    >
      <div className="flex items-center leading-none">
        <span
          data-divider="rule"
          aria-hidden="true"
          className="bg-ink h-px flex-1 self-center"
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
          className="font-display px-1.5 text-[22px] leading-none font-semibold whitespace-nowrap italic"
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
          className="bg-ink h-px flex-1 self-center"
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
    </aside>
  );
}
