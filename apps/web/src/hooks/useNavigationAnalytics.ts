import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

/**
 * Which chrome surface a nav click came from. The split is the point of #2419:
 * the `lg` one-line nav budget that decided #2409 only binds on `desktop`, so a
 * future restructure needs to know how much traffic that row actually carries
 * versus the takeover it collapses into.
 */
export type NavSource = "desktop" | "mobile" | "takeover";

interface NavClickInput {
  /** The link's own `href` — a route literal from `menuItems`, never user input. */
  destination: string;
  source: NavSource;
}

interface FooterClickInput {
  destination: string;
  /** The column heading, so the footer's intent-based grouping can be judged. */
  column: string;
}

/**
 * Analytics for the global chrome — the nav bar, the mobile takeover and the
 * footer directory (#2419). Both events carry only route literals and column
 * headings authored in `menuItems.ts` / `footerLinks.ts`, so there is nothing
 * to hash or sanitize: no id, no user input, no PII.
 *
 * `column` is sent as the existing `category` dataLayer key rather than a new
 * one — the taxonomy already declares more params than GA4's 50 event-scoped
 * custom-dimension cap allows, and `event_name = footer_link_click` segments
 * the column values cleanly from `category`'s other producers.
 */
export const useNavigationAnalytics = () => {
  const trackNavClick = useCallback(
    ({ destination, source }: NavClickInput) => {
      trackEvent("nav_link_click", { destination, source });
    },
    [],
  );

  const trackFooterClick = useCallback(
    ({ destination, column }: FooterClickInput) => {
      trackEvent("footer_link_click", { destination, category: column });
    },
    [],
  );

  return { trackNavClick, trackFooterClick };
};
