/**
 * KCVV Elewijt - Global Constants
 */

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

// API Configuration
export const API_CONFIG = {
  footbalisto: process.env.FOOTBALISTO_API_URL || "https://footbalisto.be",
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

// Image Aspect Ratios
export const IMAGE_RATIOS = {
  article: 1.5, // 3:2
  player: 1, // 1:1
  hero: 2.5, // 5:2
} as const;
