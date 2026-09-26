/**
 * Fixed opening copy for `/evenementen`, shared between `page.tsx` and
 * `loading.tsx`. See eslint.config.mjs's `no-restricted-imports` rule
 * (`loading.tsx`/`*.stories.tsx` may not import `./page`) for why this
 * lives in its own module.
 */
export const EVENEMENTEN_KICKER = "KCVV Elewijt · Agenda";
export const EVENEMENTEN_HEADLINE = "Evenementen";
