/**
 * Strips a `drafts.` prefix so a live-fetched `_id` compares as the same
 * logical document regardless of which id shape a query returned it under,
 * and regardless of the client's `perspective` setting.
 *
 * Belt-and-braces for #2839: `sanity-client.ts` pins `perspective:
 * "published"`, but a guard that only works because of that client option is
 * a guard that breaks silently the next time someone edits the client. This
 * makes the comparison correct on its own terms. Also used to de-duplicate a
 * draft-aware query's results by logical document rather than by raw `_id`.
 */
export function stripDraftPrefix(id: string): string {
  const prefix = "drafts.";
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

/**
 * Reduces a list of ids that may mix a document's published and draft shape
 * into one base (published-shape) id per logical document — order-independent,
 * so it does not matter whether the draft or the published row sorts first.
 *
 * deleteDoc()-style helpers that delete both id shapes only work when handed
 * the base id; a drafts.* id here would delete the draft twice
 * (drafts.<id> and drafts.drafts.<id>, the latter a harmless 404) and leave
 * the published document behind (#2839).
 */
export function uniqueBaseIds(ids: string[]): string[] {
  return [...new Set(ids.map(stripDraftPrefix))];
}
