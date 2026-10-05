"use client";

import { useRef, type ReactNode } from "react";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import { useSponsorAnalytics } from "@/hooks/useSponsorAnalytics";
import { readSponsorAttrs } from "@/lib/analytics/sponsor-attrs";
import { trackEvent } from "@/lib/analytics/track-event";

export interface HomepageAnalyticsProps {
  children: ReactNode;
}

/**
 * Page-scoped click analytics for the homepage's paid surfaces (#2400): the
 * `<SponsorsBlock>` tiles and the three `<BannerSlot>`s, neither of which
 * emitted anything while `/sponsors` and `<ClubshopBanner>` both did. Also the
 * two `<IdentityBand>` buttons (#3417), marked `data-identity-cta`.
 *
 * One native listener on the spine reads the inert markers the (server-
 * rendered) components already emit — `data-sponsor-id` / `data-sponsor-tier`
 * on a tile link, `data-banner-slot` on a banner link — so nothing below has to
 * become a Client Component or grow an `onClick`.
 *
 * Impressions are *not* handled here: they need per-surface visibility, which
 * `<TrackInView>` already provides at each call site.
 *
 * No PII — the Sanity sponsor id is hashed by `useSponsorAnalytics`, and a
 * banner's `href` is a club-authored campaign URL.
 */
export function HomepageAnalytics({ children }: HomepageAnalyticsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { trackSponsorClick } = useSponsorAnalytics();

  useDelegatedClick(ref, {
    selector: "[data-sponsor-id], [data-banner-slot], [data-identity-cta]",
    onMatch: (el) => {
      const identityCta = el.getAttribute("data-identity-cta");
      if (identityCta) {
        trackEvent("identity_band_click", { cta: identityCta });
        return;
      }

      const slot = el.getAttribute("data-banner-slot");
      if (slot) {
        trackEvent("banner_click", {
          position: slot,
          destination: el.getAttribute("href") ?? "",
        });
        return;
      }

      const sponsor = readSponsorAttrs(el);
      if (!sponsor) return;
      trackSponsorClick({ ...sponsor, source: "homepage" });
    },
  });

  return <div ref={ref}>{children}</div>;
}
