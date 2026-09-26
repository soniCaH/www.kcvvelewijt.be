/**
 * Fixed opening copy for `/evenementen`, shared between `page.tsx` and
 * `loading.tsx` (#2432 §2 — `loading.tsx` reuses the real, unshimmered
 * opening rather than a second hand-typed copy that can silently drift).
 *
 * Lives in its own module rather than being exported from `page.tsx`
 * (which is how this used to work): `loading.tsx` importing straight from
 * `page.tsx` pulls that route's entire server-only import graph (Effect
 * runtime, repositories, Next's own server APIs) into the loading
 * skeleton's bundle too. Next's webpack build tree-shakes that away, but
 * Storybook's Vite build evaluates the whole module eagerly, throwing
 * `ReferenceError: process is not defined` in the browser the moment
 * anything visits it under `test-storybook` (#3188 — the same defect
 * `nieuws`/`jeugd`/`ploegen` had, fixed the same way; this route has no
 * `Pages/*` story yet, but the next one added would hit it). A copy-only
 * module has nothing for `loading.tsx` to drag in.
 */
export const EVENEMENTEN_KICKER = "KCVV Elewijt · Agenda";
export const EVENEMENTEN_HEADLINE = "Evenementen";
