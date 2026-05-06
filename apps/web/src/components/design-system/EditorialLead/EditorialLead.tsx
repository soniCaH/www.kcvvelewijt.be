/**
 * <EditorialLead> — italic display paragraph capped at 52ch line length.
 *
 * Renders the article's lead paragraph (or a body-derived fallback). The
 * exported `truncateLead` helper enforces the 280-char cap that the
 * Phase 3 design contract puts on body-derived leads.
 *
 * Spec: PRD redesign-phase-3 §5.B.1.
 */

const LEAD_MAX_CHARS = 280;

/**
 * Truncate a lead string to <= 280 chars (the redesign Phase 3 cap),
 * preferring a clean word boundary near the limit. Used by callers that
 * derive the lead from `firstParagraphOf(body)` rather than the
 * editor-supplied `article.lead` field.
 */
export function truncateLead(input: string): string {
  if (input.length <= LEAD_MAX_CHARS) return input;
  const slice = input.slice(0, LEAD_MAX_CHARS - 1);
  const lastSpace = slice.lastIndexOf(" ");
  // Only fall back to a word-boundary cut when one is reasonably close to
  // the limit; otherwise hard-cut keeps the lead from collapsing too far.
  const cut =
    lastSpace > LEAD_MAX_CHARS - 40 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

export interface EditorialLeadProps {
  children: string;
}

export function EditorialLead({ children }: EditorialLeadProps) {
  return (
    <p className="text-ink-soft max-w-[52ch] font-serif text-xl leading-snug italic">
      {children}
    </p>
  );
}
