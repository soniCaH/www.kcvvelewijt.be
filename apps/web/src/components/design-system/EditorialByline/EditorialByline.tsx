/**
 * <EditorialByline> — single-line author row prefixed with a ★ glyph.
 *
 * Renders `★ Door {author}` (Dutch — KCVV convention). When `author` is
 * omitted the byline falls back to "Door redactie" per the Phase 3
 * design contract.
 *
 * Spec: PRD redesign-phase-3 §5.B.1. Decoupled from any specific Sanity
 * field — the calling page resolves the author string upstream.
 */

import { MonoStar } from "../MonoStar/MonoStar";

const DEFAULT_AUTHOR = "redactie";

export interface EditorialBylineProps {
  /** Author display name (e.g. "Tom Janssens"). Falls back to "redactie". */
  author?: string;
}

export function EditorialByline({
  author = DEFAULT_AUTHOR,
}: EditorialBylineProps) {
  return (
    <p className="text-ink-muted flex items-center gap-2 font-mono text-[length:var(--text-label)] leading-none tracking-[var(--text-label--tracking)] uppercase">
      <MonoStar />
      <span>Door {author}</span>
    </p>
  );
}
