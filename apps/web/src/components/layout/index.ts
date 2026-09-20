/**
 * Layout Components Barrel Export
 * Central export point for all layout components
 *
 * Every value exported here is re-exported wholesale by
 * `.design-sync/entry.ts` (`export * from "@/components/layout"`) onto
 * `window.KcvvDS.<Name>` for the design-sync converter —
 * `.design-sync/config.json`'s `overrides` names several of these directly
 * (`AccentStrip`, `CookieConsentBanner`, `NavTakeover`, `SiteFooter`,
 * `SiteHeader`). knip.jsonc declares that file (and dts-entry.d.ts) as a
 * real entry point so this barrel is checked against that consumer too,
 * not just in-app imports (#2934).
 */

// SiteHeader
export { SiteHeader } from "./SiteHeader";
export type { SiteHeaderProps } from "./SiteHeader";

// NavTakeover
export { NavTakeover, NavTakeoverItem } from "./NavTakeover";
export type { NavTakeoverProps, NavTakeoverItemProps } from "./NavTakeover";

// SiteFooter
export { SiteFooter } from "./SiteFooter";
export type { SiteFooterProps } from "./SiteFooter";

// CookieConsentBanner
export { CookieConsentBanner } from "./CookieConsentBanner";

// AccentStrip
export { AccentStrip } from "./AccentStrip";

// PageHero
export { PageHero } from "./PageHero";
export type { PageHeroProps, PageHeroSize } from "./PageHero";
