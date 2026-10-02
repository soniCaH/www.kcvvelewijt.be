/**
 * <EditorialByline> — single-line author row prefixed with a ★ glyph.
 *
 * Renders `★ Door {author}` (Dutch — KCVV convention). A name only where an
 * editor wrote one (#2531, decided in #3369): when `author` is omitted or
 * empty the component renders nothing — no invented "Door redactie".
 *
 * Phase 5 (5.d-col lock, #1796): the row carries an inline-prefix
 * `<SubjectAvatar scale="byline">` monogram chip — a 24px round avatar
 * (ring 1px ink, jersey-deep glyph on cream-soft, #3332) with the author's
 * initials: first + last token of the full name the byline carries
 * ("Tom Janssens" -> "TJ"), the round avatar family's rule (#3304).
 *
 * Spec: PRD redesign-phase-3 §5.B.1 + Phase 5 announcement-locked.md.
 * Decoupled from any specific Sanity field — the calling page resolves
 * the author string upstream.
 */

import { MonoStar } from "../MonoStar/MonoStar";
import { SubjectAvatar } from "../SubjectAvatar";

export interface EditorialBylineProps {
  /** Author display name (e.g. "Tom Janssens"). Empty = no byline. */
  author?: string;
}

export function EditorialByline({ author }: EditorialBylineProps) {
  const trimmed = author?.trim();
  if (!trimmed) return null;
  return (
    <p
      data-editorial-byline="true"
      className="text-ink-muted text-label flex items-center gap-2 font-mono uppercase"
    >
      <MonoStar />
      {/* This wrapper existed because SubjectAvatar's `role="img"` +
          `aria-label` would announce the author name twice (chip + "Door
          {author}"). The avatar is silent on its own now (#2559 rule 4), so
          the aria-hidden is belt-and-braces — but the wrapper is also a flex
          child of this row, and #2559 must not move a pixel, so it stays. */}
      <span aria-hidden="true" className="inline-flex">
        <SubjectAvatar firstName={trimmed} scale="byline" />
      </span>
      <span>Door {trimmed}</span>
    </p>
  );
}
