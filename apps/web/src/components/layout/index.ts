/**
 * Layout Components Barrel Export
 * Central export point for all layout components
 */

// PageHeader (legacy — replaced site-wide by <SiteHeader>)
export { PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";

// SiteHeader
export { SiteHeader } from "./SiteHeader";
export type { SiteHeaderProps } from "./SiteHeader";

// NavTakeover
export { NavTakeover, NavTakeoverItem } from "./NavTakeover";
export type { NavTakeoverProps, NavTakeoverItemProps } from "./NavTakeover";

// NavDropdown
export { NavDropdown, NavDropdownProvider } from "./NavDropdown";
export type {
  NavDropdownProps,
  NavDropdownProviderProps,
  NavDropdownItem,
  NavDropdownGroup,
} from "./NavDropdown";

// Navigation
export { Navigation } from "./Navigation";
export type { NavigationProps } from "./Navigation";

// MobileMenu
export { MobileMenu } from "./MobileMenu";
export type { MobileMenuProps } from "./MobileMenu";

// SiteFooter
export { SiteFooter } from "./SiteFooter";
export type { SiteFooterProps } from "./SiteFooter";

// CookieConsentBanner
export { CookieConsentBanner } from "./CookieConsentBanner";

// AccentStrip
export { AccentStrip } from "./AccentStrip";

// InteriorPageHero
export { InteriorPageHero } from "./InteriorPageHero";
export type { HeroGradient, InteriorPageHeroProps } from "./InteriorPageHero";
