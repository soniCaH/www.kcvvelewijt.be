/**
 * KCVV Elewijt - Global Constants
 */

// Brand tokens — single source of truth for values used in both CSS and JS/TS contexts
// (CSS custom properties can't be read server-side, so we duplicate the primary here)
export const BRAND = {
  primaryColor: "#4acf52",
  backgroundColor: "#fefefe",
} as const;

// Site Configuration
export const SITE_CONFIG = {
  title: "KCVV Elewijt",
  subTitle: "Er is maar één plezante compagnie",
  description:
    "KCVV Elewijt voetbalclub met stamnummer 55 - Er is maar één plezante compagnie",
  siteUrl: "https://www.kcvvelewijt.be",
  twitterHandle: "kcvve",
  fbAppId: "679332239478086",
  stamnummer: 55,
} as const;

// Revalidation Intervals (in seconds)
export const REVALIDATE = {
  articles: 60, // 1 minute
  teams: 300, // 5 minutes
  players: 3600, // 1 hour
  matches: 60, // 1 minute
  rankings: 300, // 5 minutes
  staticPages: 3600, // 1 hour
} as const;

// Pagination
export const PAGINATION = {
  articlesPerPage: 18,
  playersPerPage: 24,
} as const;

// Default Open Graph image — used as fallback in page metadata to prevent
// Next.js shallow-merge from losing the root openGraph.images.
export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "KCVV Elewijt",
} as const;

// PSD API identifiers
export const KCVV_FIRST_TEAM_CLUB_ID = 1235;

// External Links
export const EXTERNAL_LINKS = {
  webshop: "https://www.brandsfit.com/kcvvelewijt/nl-eu",
} as const;

// Image Aspect Ratios
export const IMAGE_RATIOS = {
  article: 1.5, // 3:2
  player: 1, // 1:1
  hero: 2.5, // 5:2
} as const;
