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

// CookiePreferencesButton
export { CookiePreferencesButton } from "./SiteFooter/CookiePreferencesButton";

// MatchStripSlot (@/components/layout/MatchStrip) is deliberately NOT
// re-exported here. It renders `<MatchStrip>`, an async server component
// that reads first-team fixture data via the BFF (see MatchStrip.tsx's own
// docblock) — a render chain that cannot run in a browser bundle. This is
// the named exception from #3025's "a component with a story belongs in
// its barrel" ruling (#3025's own comparison table: story coverage exists
// via composed context, e.g. MatchStripInContext.stories.tsx, but the
// server-only render chain wins). Re-exporting it here would drag that
// chain into the design-sync client bundle (`.design-sync/entry.ts`
// wildcards this barrel onto `window.KcvvDS`). Don't "fix" this by adding
// the export back — #3027 tracks `MatchStripSlot` itself.
