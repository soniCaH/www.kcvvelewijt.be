/**
 * <EditorialByline> — single-line author row prefixed with a ★ glyph.
 *
 * Renders `★ Door {author}` (Dutch — KCVV convention). When `author` is
 * omitted or empty the byline falls back to "Door redactie" per the
 * Phase 3 design contract.
 *
 * Phase 5 (5.d-col lock, #1796): when a real `author` is supplied, the
 * row gains an inline-prefix `<SubjectAvatar scale="byline">` monogram
 * chip — a 24px disc with the first letter of the author, jersey-deep
 * background, cream initial in italic Freight Display 900. The chip
 * does NOT render on the "redactie" fallback (no monogram for a
 * generic editorial signature).
 *
 * Spec: PRD redesign-phase-3 §5.B.1 + Phase 5 announcement-locked.md.
 * Decoupled from any specific Sanity field — the calling page resolves
 * the author string upstream.
 */

import { MonoStar } from "../MonoStar/MonoStar";
import { SubjectAvatar } from "../SubjectAvatar";

const DEFAULT_AUTHOR = "redactie";

export interface EditorialBylineProps {
  /** Author display name (e.g. "Tom Janssens"). Falls back to "redactie". */
  author?: string;
}

export function EditorialByline({ author }: EditorialBylineProps) {
  const trimmed = author?.trim();
  const hasRealAuthor = typeof trimmed === "string" && trimmed.length > 0;
  const displayName = hasRealAuthor ? trimmed : DEFAULT_AUTHOR;
  return (
    <p
      data-editorial-byline="true"
      className="text-ink-muted flex items-center gap-2 font-mono text-[length:var(--text-label)] leading-none tracking-[var(--text-label--tracking)] uppercase"
    >
      <MonoStar />
      {hasRealAuthor ? (
        // Wrap in aria-hidden so AT only reads the byline text below —
        // otherwise SubjectAvatar's `role="img"` + `aria-label` would
        // announce the author name twice (chip + "Door {author}").
        <span aria-hidden="true" className="inline-flex">
          <SubjectAvatar
            firstName={trimmed}
            fullName={trimmed}
            scale="byline"
          />
        </span>
      ) : null}
      <span>Door {displayName}</span>
    </p>
  );
}
