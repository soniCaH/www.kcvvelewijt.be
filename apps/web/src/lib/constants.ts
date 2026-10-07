/**
 * KCVV Elewijt - Global Constants
 */

// Brand tokens — single source of truth for values used in both CSS and JS/TS contexts
// (CSS custom properties can't be read server-side, so we duplicate them here).
// Mirrors globals.css: `--color-jersey-deep` (#007c46) and `--color-cream` (#f5f1e6).
// The retired bright jersey (#4acf52) is no longer the brand primary.
export const BRAND = {
  primaryColor: "#007c46", // jersey-deep
  backgroundColor: "#f5f1e6", // cream
} as const;

// Site Configuration
export const SITE_CONFIG = {
  title: "KCVV Elewijt",
  description:
    "KCVV Elewijt voetbalclub met stamnummer 55 - Er is maar 1 plezante compagnie",
  siteUrl: "https://www.kcvvelewijt.be",
  fbAppId: "679332239478086",
  stamnummer: 55,
} as const;

// Default Open Graph image — used as fallback in page metadata to prevent
// Next.js shallow-merge from losing the root openGraph.images.
export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "KCVV Elewijt",
} as const;

// PSD API identifiers
/**
 * PSD club id for KCVV Elewijt — shared across all KCVV teams (A / B / youth),
 * since it identifies the club, not a specific team. Used to determine which
 * side of a match is KCVV when the BFF doesn't supply the team-scoped `is_home`
 * flag (e.g. `getMatchDetail`, which has no teamId context). Id-based, never
 * name-based (see `feedback_psd_match_identification`).
 */
export const KCVV_CLUB_ID = 1235;

/**
 * The one listing pagination contract (#2569 / decision #2431). A listing gets
 * a load-more only when its collection has no natural ceiling — `/nieuws` and
 * `/galerij` are the two — and both paint `LISTING_INITIAL_TOTAL` cards, then
 * append `LISTING_BATCH_SIZE` per click. Shared so the site never grows a
 * second pagination idiom.
 */
export const LISTING_INITIAL_TOTAL = 24;
export const LISTING_BATCH_SIZE = 12;

// External Links
export const EXTERNAL_LINKS = {
  /** Brandsfit-hosted club kledij shop. Renamed from `webshop` in
   *  #1753 (R6.C) so the partner brand is surfaced at the call site. */
  brandsfit: "https://www.brandsfit.com/kcvvelewijt/nl-eu",
  psdDashboard: "https://kcvv.prosoccerdata.com/dashboard",
  facebook: "https://facebook.com/KCVVElewijt/",
  instagram: "https://www.instagram.com/kcvve",
} as const;
