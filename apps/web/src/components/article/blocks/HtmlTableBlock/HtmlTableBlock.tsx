"use client";

import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/utils/cn";
import { useScrollHint } from "@/components/design-system/ScrollHint/useScrollHint";

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
 * <HtmlTableBlock> — Phase 5 restyle (fileattachment-htmltable-locked §5.2).
 *
 * Extracted from `<SanityArticleBody>` so the new `<ArticleBody>` PT
 * serializer (Part C / #1850) can consume the same component. Visual
 * vocabulary:
 *
 * - Card wrapper: 1px ink border + 4px offset shadow on cream, no tape.
 * - Header band: jersey-deep background with cream mono caps text.
 * - Body cells: monospace 13px; first column overrides to italic Freight.
 * - Dotted ink-muted dividers between rows and columns.
 * - Even rows: 2.5% ink-tint zebra.
 * - Horizontal scroll + sticky first column + scroll-hint affordance
 *   preserved verbatim from the legacy renderer.
 */
export function HtmlTableBlock({ html, className }: HtmlTableBlockProps) {
  const { scrollRef, canScrollRight } = useScrollHint<HTMLDivElement>();
  const trimmed = typeof html === "string" ? html.trim() : "";
  if (trimmed.length === 0) return null;

  return (
    <div
      data-html-table="true"
      className={cn(
        "border-ink bg-cream shadow-paper-md relative my-6 border-2",
        className,
      )}
    >
      <div
        ref={scrollRef}
        role="region"
        aria-label="Scrollable table"
        tabIndex={0}
        className={cn(
          "overflow-x-auto",
          "focus:outline-jersey-deep focus:outline-2 focus:outline-offset-2",
          // Table & cells — base typography + jersey-deep header band.
          "[&>table]:w-full [&>table]:border-collapse [&>table]:text-sm",
          "[&>table>thead]:bg-jersey-deep",
          "[&>table>thead>tr>th]:text-cream",
          "[&>table>thead>tr>th]:font-mono [&>table>thead>tr>th]:text-[10px]",
          "[&>table>thead>tr>th]:font-semibold [&>table>thead>tr>th]:tracking-[0.18em]",
          "[&>table>thead>tr>th]:text-left [&>table>thead>tr>th]:uppercase",
          "[&>table>thead>tr>th]:px-3 [&>table>thead>tr>th]:py-2.5",
          // Header column dividers — dotted cream at 25% opacity per lock.
          "[&>table>thead>tr>th:not(:first-child)]:border-l [&>table>thead>tr>th:not(:first-child)]:border-dotted",
          "[&>table>thead>tr>th:not(:first-child)]:border-cream/30",
          // Body cells — monospace 13px with dotted ink-muted borders.
          "[&>table>tbody>tr>td]:font-mono [&>table>tbody>tr>td]:text-[13px]",
          "[&>table>tbody>tr>td]:px-3 [&>table>tbody>tr>td]:py-2 [&>table>tbody>tr>td]:align-top",
          "[&>table>tbody>tr>td]:text-ink",
          "[&>table>tbody>tr>td]:border-ink-muted [&>table>tbody>tr>td]:border-t [&>table>tbody>tr>td]:border-dotted",
          "[&>table>tbody>tr>td:not(:first-child)]:border-ink-muted [&>table>tbody>tr>td:not(:first-child)]:border-l [&>table>tbody>tr>td:not(:first-child)]:border-dotted",
          // First column — italic Freight Display, breaks the mono rhythm.
          "[&>table>tbody>tr>td:first-child]:font-serif [&>table>tbody>tr>td:first-child]:text-[15px]",
          "[&>table>tbody>tr>td:first-child]:font-semibold [&>table>tbody>tr>td:first-child]:italic",
          // Body th (rare — used when an editor uses th as a row header).
          "[&>table>tbody>tr>th]:font-mono [&>table>tbody>tr>th]:text-[10px]",
          "[&>table>tbody>tr>th]:tracking-[0.16em] [&>table>tbody>tr>th]:uppercase",
          "[&>table>tbody>tr>th]:px-3 [&>table>tbody>tr>th]:py-2 [&>table>tbody>tr>th]:text-left",
          // Subtle zebra — 2.5% ink tint on even rows.
          "[&>table>tbody>tr:nth-child(even)>td]:bg-[rgba(0,0,0,0.025)]",
          // Sticky first column on horizontal scroll.
          canScrollRight && [
            "[&>table>tbody>tr>td:first-child]:sticky [&>table>tbody>tr>td:first-child]:left-0 [&>table>tbody>tr>td:first-child]:z-10",
            "[&>table>tbody>tr:nth-child(odd)>td:first-child]:bg-cream",
            "[&>table>tbody>tr:nth-child(even)>td:first-child]:bg-[rgba(232,224,200,0.7)]",
            "[&>table>thead>tr>th:first-child]:sticky [&>table>thead>tr>th:first-child]:left-0 [&>table>thead>tr>th:first-child]:z-20",
            "[&>table>thead>tr>th:first-child]:bg-jersey-deep",
            "[&>table>tbody>tr>td:first-child]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.12)]",
            "[&>table>thead>tr>th:first-child]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.12)]",
          ],
        )}
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(trimmed, TABLE_SANITIZE_OPTIONS),
        }}
      />
      {canScrollRight && (
        <div
          aria-hidden="true"
          className="from-cream pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l to-transparent"
        />
      )}
    </div>
  );
}

export { TABLE_SANITIZE_OPTIONS };
