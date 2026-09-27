/**
 * Fixed opening copy for `/ploegen`, shared between `page.tsx` and
 * `loading.tsx`. See eslint.config.mjs's `no-restricted-imports` rule
 * (`loading.tsx`/`*.stories.tsx` may not import `./page`) for why this
 * lives in its own module.
 */
export const PLOEGEN_TITLE = "Onze ploegen";
export const PLOEGEN_KICKER = "KCVV Elewijt";
export const PLOEGEN_LEAD =
  "Van de eerste ploeg tot de allerkleinsten — één plezante compagnie.";
