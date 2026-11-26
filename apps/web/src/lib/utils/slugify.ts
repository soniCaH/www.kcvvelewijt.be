/**
 * Slugify a single string: lowercased, diacritics stripped, `&` → " en ",
 * non-alphanumerics collapsed to single hyphens. Mirrors the studio's
 * `slugifyTitle` so behaviour is consistent across the codebase (studio's
 * version is not importable — `packages/sanity-studio` is not a dependency
 * of `@kcvv/web`).
 *
 * Deliberately dependency-free (no Effect, no Sanity, no anything) so it is
 * safe to import from a client component's hot path without pulling in
 * unrelated module-scope side effects. `lib/seo/legacy-redirect.ts`'s
 * `nameToSlug` builds on this; so does the analytics facet slugging in
 * `components/analytics/EmptyStateUndoTracker.tsx` (#2691/#2719) — that
 * second caller is *why* this lives here rather than in `legacy-redirect.ts`
 * itself: `legacy-redirect.ts` imports `fetchGroq` (`lib/sanity/fetch-groq`
 * → `lib/sanity/client`), which constructs a Sanity client at module scope.
 * Storybook/CI has no `NEXT_PUBLIC_SANITY_PROJECT_ID`, so any component that
 * pulled `slugify` in from `legacy-redirect.ts` crashed every story that
 * rendered it with "Configuration must contain `projectId`" — a JS
 * exception, not a pixel diff, but VR-fatal all the same (#2691 review).
 */
export const slugify = (value: string): string => {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/&/g, " en ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
