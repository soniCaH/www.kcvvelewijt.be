/**
 * Fixed join-link URL for `/club/ultras`, shared between `page.tsx` and
 * `loading.tsx`. See eslint.config.mjs's `no-restricted-imports` rule
 * (`loading.tsx`/`*.stories.tsx` may not import `./page`) for why this
 * lives in its own module.
 */
export const FACEBOOK_URL = "https://www.facebook.com/KCVV.ULTRAS.55/";
