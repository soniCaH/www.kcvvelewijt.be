/**
 * Fixed opening copy for `/nieuws`, shared between `page.tsx` and
 * `loading.tsx` (#2432 §2 — `loading.tsx` reuses the real, unshimmered
 * opening rather than a second hand-typed copy that can silently drift).
 *
 * Lives in its own module rather than being exported from `page.tsx`
 * (which is how this used to work): `loading.tsx` importing straight from
 * `page.tsx` pulls that route's entire server-only import graph (Effect
 * runtime, repositories, Next's own server APIs) into the loading
 * skeleton's bundle too. Next's webpack build tree-shakes that away, but
 * Storybook's Vite build evaluates the whole module eagerly, and one of
 * those transitive imports throws `ReferenceError: process is not defined`
 * in the browser (#3188 — this broke `Pages/NewsListing`'s axe check the
 * first time anything ever visited it under `test-storybook`). A copy-only
 * module has nothing for `loading.tsx` to drag in.
 */
export const NEWS_KICKER = "KCVV Elewijt · Nieuws";
export const NEWS_HEADLINE = "Nieuwsarchief";
