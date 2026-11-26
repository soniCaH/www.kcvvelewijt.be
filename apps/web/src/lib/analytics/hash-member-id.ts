/**
 * djb2 hash for internal ids before they're sent to analytics. Non-
 * reversible over meaningful input spaces (Sanity `_id`, staff ids, etc)
 * because the djb2 32-bit output doesn't round-trip, but cheap + sync +
 * deterministic so the same id produces the same hashed bucket across
 * every `trackEvent` call.
 */
export const hashMemberId = (id: string): string => {
  const hash = Array.from({ length: id.length }, (_, i) =>
    id.charCodeAt(i),
  ).reduce((acc, code) => ((acc << 5) + acc + code) | 0, 5381);
  return (hash >>> 0).toString(16);
};
