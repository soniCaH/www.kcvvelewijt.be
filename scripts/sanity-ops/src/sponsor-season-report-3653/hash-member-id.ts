/**
 * Copy of `hashMemberId` in `apps/web/src/lib/analytics/hash-member-id.ts` (djb2).
 * A workspace cannot import across the monorepo, so the copy is pinned by
 * `hash-member-id.test.ts`: known pairs taken from the web function.
 */
export const hashMemberId = (id: string): string =>
  (
    Array.from({ length: id.length }, (_, i) => id.charCodeAt(i)).reduce(
      (hash, code) => ((hash << 5) + hash + code) | 0,
      5381,
    ) >>> 0
  ).toString(16);
