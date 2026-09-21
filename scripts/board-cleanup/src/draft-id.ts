/**
 * Strips a `drafts.` prefix so a live-fetched `_id` compares as the same
 * logical document regardless of which id shape a query returned it under.
 *
 * Belt-and-braces for #2839: used to de-duplicate a draft-aware query's
 * results by logical document rather than by raw `_id`.
 */
export function stripDraftPrefix(id: string): string {
  const prefix = "drafts.";
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}
