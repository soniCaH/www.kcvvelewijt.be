/**
 * Fixed opening copy for `/nieuws`, shared between `page.tsx` and
 * `loading.tsx`. See eslint.config.mjs's `no-restricted-imports` rule
 * (`loading.tsx`/`*.stories.tsx` may not import `./page`) for why this
 * lives in its own module.
 */
export const NEWS_KICKER = "KCVV Elewijt · Nieuws";
export const NEWS_HEADLINE = "Nieuwsarchief";
