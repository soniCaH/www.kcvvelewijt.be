/**
 * Fixed copy for `/club/ultras`, read by `page.tsx` and `UltrasHero.tsx`
 * (which `loading.tsx` and the story render too). See eslint.config.mjs's
 * `no-restricted-imports` rule (`loading.tsx`/`*.stories.tsx` may not import
 * `./page`) for why this lives in its own module.
 */
export const FACEBOOK_URL = "https://www.facebook.com/KCVV.ULTRAS.55/";

/** The opening's words and photo, read by `<UltrasHero>`. */
export const ULTRAS_HERO = {
  kicker: "Supportersclub · Ultra's 55",
  headline: "De luidste hoek",
  accent: "luidste",
  lead: "De sfeergroep van KCVV Elewijt. Thuis zingen we langs de lijn, naar elke uitmatch leggen we een bus in. Ook als we maar met een handvol zijn.",
  image: "/images/ultras.jpg",
} as const;
