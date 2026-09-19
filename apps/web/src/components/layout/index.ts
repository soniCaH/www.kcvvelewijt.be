/**
 * Layout Components Barrel Export
 * Central export point for all layout components
 */

// SiteHeader, NavTakeover(+Item), SiteFooter, CookieConsentBanner and
// AccentStrip are deliberately NOT re-exported here: every consumer
// (app/layout.tsx included) imports each directly from its own subpath,
// e.g. "@/components/layout/SiteHeader" — see the `Alert` barrel
// (../design-system/Alert/index.ts) for the same pattern. Only the types
// stay.
export type { SiteHeaderProps } from "./SiteHeader";
export type { NavTakeoverProps, NavTakeoverItemProps } from "./NavTakeover";
export type { SiteFooterProps } from "./SiteFooter";

// PageHero
export { PageHero } from "./PageHero";
export type { PageHeroProps, PageHeroSize } from "./PageHero";
