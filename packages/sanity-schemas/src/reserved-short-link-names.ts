/**
 * Top-level path names a `shortLink` may never take (#3573): a real page always
 * wins over a short link, so the Studio refuses any name the site already
 * serves at its first path segment.
 *
 * Hard-coded on purpose, because the schema package cannot read the web app.
 * `apps/web/src/lib/short-links/top-level-names.test.ts` derives the real list
 * from the app router folders, the `source`s in `next.config.ts`
 * `redirects()` / `rewrites()` and the entries in `public/`, and fails (naming
 * the missing ones) when this constant does not cover them. Add a top-level
 * route, redirect or `public/` entry → add its name here in the same change.
 *
 * Sorted, so a diff shows what changed.
 */
export const RESERVED_SHORT_LINK_NAMES: readonly string[] = [
  'api',
  'calendar',
  'club',
  'darts',
  'downloads',
  'evenementen',
  'events',
  'fonts',
  'galerij',
  'game',
  'hulp',
  'images',
  'inhoud',
  'jeugd',
  'kalender',
  'kiosk',
  'news',
  'nieuws',
  'ongeval',
  'opengraph-image',
  'player',
  'player-fixtures',
  'players',
  'ploegen',
  'privacy',
  'scheurkalender',
  'search',
  'share',
  'spelers',
  'sponsors',
  'staf',
  'staff',
  'static',
  'team',
  'teams',
  'tegenstander',
  'wedstrijd',
  'zoeken',
]
