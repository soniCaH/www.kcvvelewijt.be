/**
 * djb2 hash for internal ids before they're sent to analytics. Non-
 * reversible over meaningful input spaces (Sanity `_id`, staff ids, etc)
 * because the djb2 32-bit output doesn't round-trip, but cheap + sync +
 * deterministic so the same id produces the same hashed bucket across
 * every `trackEvent` call.
 */
export function hashMemberId(id: string): string {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}
