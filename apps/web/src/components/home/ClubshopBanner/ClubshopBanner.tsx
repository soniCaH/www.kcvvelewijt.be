"use client";

import { useEffect } from "react";
import {
  EditorialHeading,
  JerseyShirt,
  LinkButton,
  StripedSeam,
} from "@/components/design-system";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics/track-event";
import { cn } from "@/lib/utils/cn";

export interface ClubshopBannerProps {
  className?: string;
}

export const ClubshopBanner = ({ className }: ClubshopBannerProps) => {
  useEffect(() => {
    trackEvent("clubshop_banner_impression", {
      destination: EXTERNAL_LINKS.brandsfit,
    });
  }, []);

  const handleCtaClick = () => {
    trackEvent("clubshop_banner_cta_click", {
      destination: EXTERNAL_LINKS.brandsfit,
    });
  };

  return (
    <section
      aria-label="Clubshop"
      data-testid="clubshop-banner"
      className={cn("bg-jersey-deep-dark relative", className)}
    >
      {/* Mirrored stripe frame — R6.C. Top seam at -45°, bottom seam
          flipped to +45° so the diagonals lean toward each other and
          visually "tape" the section as a discrete package. Only
          section on the homepage with both edges framed. */}
      <StripedSeam height="md" colorPair="jersey-tonal-dark" />

      <div className="mx-auto max-w-[var(--container-index)] px-4 py-12 md:px-8 md:py-16">
        <div className="relative">
          {/* Corner-anchored jersey illustration. ~140px (Tailwind v4
              `w-35 h-35` = 35 × 0.25rem = 140px). Centered vertically
              against the text block via `top-1/2 -translate-y-1/2` so
              the shirt's mid-line sits with the subheading rather than
              floating below the CTA. Hidden below 640px so the narrow
              viewport doesn't force the heading to wrap around it. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-0 z-0 hidden -translate-y-1/2 sm:block"
          >
            <JerseyShirt ariaLabel="" className="mx-0 h-35 w-35" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <EditorialHeading
              level={2}
              size="display-lg"
              tone="cream"
              emphasis={{ text: "clubkledij", tone: "warm" }}
              className="mb-4"
            >
              Onze clubkledij
            </EditorialHeading>

            <p className="text-cream/90 mb-6 max-w-2xl text-base leading-relaxed">
              Beschikbaar via Brandsfit, onze kledingpartner.
            </p>

            <LinkButton
              href={EXTERNAL_LINKS.brandsfit}
              variant="inverted"
              onClick={handleCtaClick}
              {...{ target: "_blank", rel: "noopener noreferrer" }}
            >
              Naar de Brandsfit clubshop{" "}
              <span aria-hidden="true" className="text-jersey-deep">
                ↗
              </span>
            </LinkButton>
          </div>
        </div>
      </div>

      <StripedSeam height="md" colorPair="jersey-tonal-dark" flip />
    </section>
  );
};
