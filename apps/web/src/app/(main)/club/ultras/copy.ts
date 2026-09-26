/**
 * Fixed join-link URL for `/club/ultras`, shared between `page.tsx` and
 * `loading.tsx` (#2432 §2 — `loading.tsx` reuses the real, unshimmered
 * `<UltrasHero>` rather than a second hand-typed copy that can silently
 * drift).
 *
 * Lives in its own module rather than being exported from `page.tsx`
 * (which is how this used to work): `loading.tsx` importing straight from
 * `page.tsx` pulls that route's entire server-only import graph into the
 * loading skeleton's bundle too. Next's webpack build tree-shakes that
 * away, but Storybook's Vite build evaluates the whole module eagerly,
 * throwing `ReferenceError: process is not defined` in the browser the
 * moment anything visits it under `test-storybook` (#3188 — the same
 * defect `nieuws`/`jeugd`/`ploegen` had, fixed the same way; this route's
 * own `Pages/Ultras` story doesn't happen to import `loading.tsx`, but the
 * next story that does would hit it). A copy-only module has nothing for
 * `loading.tsx` to drag in.
 */
export const FACEBOOK_URL = "https://www.facebook.com/KCVV.ULTRAS.55/";
