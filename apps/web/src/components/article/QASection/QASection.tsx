import type { ReactNode } from "react";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { QASectionDivider } from "@/components/design-system/QASectionDivider";
import { QARow, type QARowProps } from "@/components/article/QARow";
import { cn } from "@/lib/utils/cn";

/**
 * <QASection> — net-new Phase 5 interview primitive (5.B.int).
 *
 * Wraps an interview's Q&A run inside the article body. Composes:
 *
 *   ```text
 *   <MonoLabel>Q&A</MonoLabel>          ← optional heading row
 *   <QARow />                            ← first row
 *   <QASectionDivider variant="dotted">  ← between-row separator
 *   <QARow />                            ← second row
 *   <QASectionDivider variant="dotted">
 *   ...                                  ← repeated for every row
 *   ```
 *
 * Container width is pinned at `--container-prose: 680px` so the Q&A
 * column matches the rest of the article body. The component handles
 * the inter-row dotted-divider insertion deterministically so the page
 * template (or PT serializer wiring) just passes an ordered array of
 * `<QARow>` prop bundles.
 */
export interface QASectionRow extends QARowProps {
  /**
   * Stable key for React reconciliation. Typically the Sanity PT block
   * `_key`, but any unique value works for non-PT call-sites.
   */
  rowKey: string;
}

export interface QASectionProps {
  rows: QASectionRow[];
  /**
   * Optional MonoLabel heading text. Defaults to `"Q&A"` — set to `null`
   * to skip the heading entirely (e.g. when the Q&A run is the only
   * body content and the article hero already signals "interview").
   */
  heading?: string | null;
  /**
   * Slot for extra content rendered after the last row (typically a
   * `<QASectionDivider variant="title">` introducing a major break, or
   * an `<ArticleCredits>` block on the final Q&A in the article).
   */
  trailing?: ReactNode;
  className?: string;
}

const DEFAULT_HEADING = "Q&A";

export function QASection({
  rows,
  heading = DEFAULT_HEADING,
  trailing,
  className,
}: QASectionProps) {
  if (rows.length === 0 && !trailing) return null;

  return (
    <section
      data-qa-section="true"
      aria-label={heading ?? "Q&A"}
      className={cn("mx-auto w-full", className)}
      style={{ maxWidth: "var(--container-prose)" }}
    >
      {heading ? (
        <header className="mb-8 flex justify-center">
          <MonoLabel tone="ink">{heading}</MonoLabel>
        </header>
      ) : null}
      <div className="flex flex-col gap-8">
        {rows.map((row, i) => (
          <div key={row.rowKey} data-qa-section="row-wrapper">
            <QARow {...row} />
            {i < rows.length - 1 ? <QASectionDivider variant="dotted" /> : null}
          </div>
        ))}
      </div>
      {trailing}
    </section>
  );
}
