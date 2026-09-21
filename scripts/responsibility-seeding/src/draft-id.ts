/**
 * Strips a `drafts.` prefix so a live-fetched `_id` compares correctly against
 * a canonical published id, regardless of the client's `perspective` setting.
 *
 * Belt-and-braces for #2839: `sanity-client.ts` now pins `perspective:
 * "published"`, but a guard that only works because of that client option is
 * a guard that breaks silently the next time someone edits the client. This
 * makes the comparison correct on its own terms.
 */
export function stripDraftPrefix(id: string): string {
  const prefix = "drafts.";
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}
