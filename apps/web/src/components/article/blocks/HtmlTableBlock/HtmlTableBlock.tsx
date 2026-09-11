"use client";

import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/utils/cn";
import { ScrollOverlay } from "@/components/design-system/ScrollHint/ScrollOverlay";

const TABLE_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "colgroup",
    "col",
    "strong",
  ],
  allowedAttributes: {
    "*": ["colspan", "rowspan", "scope"],
  },
};

export interface HtmlTableBlockProps {
  /** Raw HTML — sanitized through `TABLE_SANITIZE_OPTIONS` before render. */
  html: string;
  className?: string;
}

/**
 * <HtmlTableBlock> — the quiet skin (#2582, reversing the
 * fileattachment-htmltable-locked §5.2 card that #2476 sanctioned undoing).
 *
 * Extracted from `<SanityArticleBody>` so the new `<ArticleBody>` PT
 * serializer (Part C / #1850) can consume the same component. It shares
 * `<StandingsTable>`'s register rather than keeping one of its own — "one
 * table skin, the quiet one" (#2476 rule 1), named in full as **The One
 * Table Skin Rule** in `apps/web/DESIGN.md` § Components → Tables (review
 * M5): no 2px ink border, no `--shadow-paper-md`, no jersey-deep header
 * band, no zebra, no dotted dividers, no italic-serif first column. The
 * two call sites repeat the recipe as a literal class string each, per the
 * Manila Rule's own precedent for legitimate repetition — this is
 * arbitrary-variant CSS over injected HTML on one side and JSX on the
 * other, so there is no shared class string to extract into a component.
 *
 * **No anchoring.** #2476 rule 3: what varies between an authored table and
 * a *typed* one is not the skin but the anchoring, and anchoring has to
 * know what a column means — an authored table's columns are arbitrary
 * editor content, so this component declares none. The old sticky first
 * column (positional, not declared) is gone with it; `<StandingsTable>` is
 * the one that anchors now.
 *
 * **Column-agnostic styling only.** No selector here reaches into a
 * cell's *content* (no `:first-child` font override, no per-position
 * assumption) — only `th`/`td`/row structure, reached by descendant
 * selectors (`[&_th]`, `[&_tbody_tr]`, …) rather than an enumerated
 * `>thead>tr>th` chain, so every row container `TABLE_SANITIZE_OPTIONS`
 * allows — `thead`, `tbody`, `tfoot` — is covered by construction, not by
 * remembering to list it (review M6: a `<tfoot>` row rendered half-skinned
 * under the old chained selectors). `<strong>` is in `TABLE_SANITIZE_OPTIONS.allowedTags`
 * (#2481) and needs no selector here to render bold — Preflight's
 * `strong { font-weight: bolder }` already resolves to a real 700 face in
 * this table's `font-mono` (IBM Plex Mono loads 400/600/700). An authored
 * `<a>` still does **not** render — restoring it (allowlist entry plus the
 * `.prose-link` recipe and `rel` handling) is #2482's job, deliberately
 * blocked by this one.
 *
 * A `<caption>` (three published tables ship one) renders in the kicker
 * register per #2476 rule 8 — `font-mono`, `text-label`, uppercase,
 * `ink-muted`, left-aligned — rather than the browser-default centred text
 * it gets today.
 *
 * **Scroll arrow — `<ScrollOverlay>`'s "content scrolled past" idiom
 * (#2444, as amended by #2476/#2577).** A table is content you scroll
 * *past*, not a row of tap targets — it never reserves a gutter; the right
 * arrow simply overlays the edge and mounts only on real overflow, with a
 * fade capped at `min(24px, remaining)`. **Right edge only**: with no
 * anchor there is nothing pinning the left edge, but an authored table's
 * natural reading order still starts there, so only the trailing edge
 * needs a cue — see `<ScrollOverlay>`'s own docblock for the shared
 * contract with `<StandingsTable>` and `<VolledigOrganigram>`'s chart.
 * `dangerouslySetInnerHTML` is passed straight through to `<ScrollOverlay>`
 * rather than as `children`, so the sanitized HTML lands on the same
 * element that carries the scroll ref — the pattern `<ScrollOverlay>`
 * exists specifically to support.
 */
export function HtmlTableBlock({ html, className }: HtmlTableBlockProps) {
  const trimmed = typeof html === "string" ? html.trim() : "";
  if (trimmed.length === 0) return null;

  return (
    <div data-html-table="true" className={cn("my-6", className)}>
      <ScrollOverlay
        role="region"
        ariaLabel="Scrollable table"
        direction="right"
        trackClassName={cn(
          "focus:outline-jersey-deep focus:outline-2 focus:outline-offset-2",
          // Table — StandingsTable's quiet register. Direct child of the
          // track (`[&>table]`), not a descendant: a nested table (an
          // editor's own, inside a cell) keeps its own plain markup rather
          // than inheriting the block-level skin a second time.
          "[&>table]:w-full [&>table]:border-collapse [&>table]:font-mono [&>table]:text-xs",
          // th/td — descendant selectors, so every row container the
          // sanitizer allows (`thead`, `tbody`, `tfoot`) is styled by
          // construction rather than by enumerating each one (review M6).
          "[&_th]:text-ink-muted [&_th]:px-2 [&_th]:py-2 [&_th]:text-left [&_th]:font-normal [&_th]:uppercase",
          "[&_td]:text-ink [&_td]:px-2 [&_td]:py-2 [&_td]:align-top",
          // Header row — heavier rule + letter-spacing, thead only.
          "[&_thead_tr]:border-ink [&_thead_tr]:border-b-2",
          "[&_thead_th]:tracking-wider",
          // Body/footer rows — the quiet paper-edge divider.
          "[&_tbody_tr]:border-b [&_tbody_tr]:border-[color:var(--color-paper-edge)]",
          "[&_tfoot_tr]:border-b [&_tfoot_tr]:border-[color:var(--color-paper-edge)]",
          // Caption — kicker register (#2476 rule 8), above and left, not
          // the browser-default centred text. Same recipe as
          // <MonoLabel tone="muted"> — StandingsTable's own caption — down
          // to `pb-2` (not `mb-2`): the same "Poule A" label should not
          // read differently depending on which table it landed in
          // (review M5).
          "[&>table>caption]:text-label [&>table>caption]:text-ink-muted",
          "[&>table>caption]:font-medium [&>table>caption]:leading-none",
          "[&>table>caption]:pb-2 [&>table>caption]:text-left [&>table>caption]:uppercase",
        )}
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(trimmed, TABLE_SANITIZE_OPTIONS),
        }}
      />
    </div>
  );
}

export { TABLE_SANITIZE_OPTIONS };
