/**
 * Fixed opening copy for `/jeugd`, shared between `page.tsx` and
 * `loading.tsx`. See eslint.config.mjs's `no-restricted-imports` rule
 * (`loading.tsx`/`*.stories.tsx` may not import `./page`) for why this
 * lives in its own module.
 */

/** Committed youth asset — also the homepage `<YouthSection>` backdrop. */
export const YOUTH_PHOTO = "/images/youth-trainers.jpg";

export const JEUGD_KICKER = "De jeugdopleiding · U6 tot U21";
export const JEUGD_HEADLINE = "Beter worden begint met plezier";
export const JEUGD_LEAD =
  "Een doordachte opleiding van Onderbouw tot Bovenbouw, met gediplomeerde trainers en plezier als motor. Want wie graag speelt, groeit vanzelf — op en naast het veld.";
