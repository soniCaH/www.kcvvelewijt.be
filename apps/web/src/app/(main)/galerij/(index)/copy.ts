/**
 * Fixed opening copy for `/galerij`, shared between `page.tsx` and
 * `loading.tsx`. See eslint.config.mjs's `no-restricted-imports` rule
 * (`loading.tsx`/`*.stories.tsx` may not import `./page`) for why this
 * lives in its own module.
 */
export const GALERIJ_KICKER = "KCVV Elewijt · Beelden";
export const GALERIJ_HEADLINE = "Fotogalerij";
