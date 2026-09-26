/**
 * Fixed opening copy for `/jeugd`, shared between `page.tsx` and
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
 * in the browser (#3188 — this broke `Pages/Jeugd/JeugdLandingSkeleton`'s
 * axe check the first time anything ever visited it under
 * `test-storybook`). A copy-only module has nothing for `loading.tsx` to
 * drag in.
 */

/** Committed youth asset — also the homepage `<YouthSection>` backdrop. */
export const YOUTH_PHOTO = "/images/youth-trainers.jpg";

export const JEUGD_KICKER = "De jeugdopleiding · U6 tot U21";
export const JEUGD_HEADLINE = "Beter worden begint met plezier";
export const JEUGD_LEAD =
  "Een doordachte opleiding van Onderbouw tot Bovenbouw, met gediplomeerde trainers en plezier als motor. Want wie graag speelt, groeit vanzelf — op en naast het veld.";
