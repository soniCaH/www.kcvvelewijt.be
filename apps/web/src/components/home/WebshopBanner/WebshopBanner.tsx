"use client";

import { useEffect } from "react";
import {
  EditorialHeading,
  LinkButton,
  MonoLabel,
  TapedCard,
} from "@/components/design-system";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics/track-event";
import { cn } from "@/lib/utils/cn";

export interface WebshopBannerProps {
  className?: string;
}

export const WebshopBanner = ({ className }: WebshopBannerProps) => {
  useEffect(() => {
    trackEvent("webshop_banner_impression", {
      destination: EXTERNAL_LINKS.webshop,
    });
  }, []);

  const handleCtaClick = () => {
    trackEvent("webshop_banner_cta_click", {
      destination: EXTERNAL_LINKS.webshop,
    });
  };

  return (
    <section
      aria-label="Webshop"
      className={cn("bg-cream-deep py-10 md:py-14", className)}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <TapedCard
          rotation="none"
          bg="jersey-deep"
          shadow="lift"
          padding="lg"
          // Override TapedCard's `bg-jersey-deep` (#008755) with the darker
          // desaturated forest token used in the locked design (#133d28).
          // TapedCardBg doesn't expose `jersey-deep-dark` yet; bypass via
          // `!bg-` arbitrary so Tailwind keeps the cream text from the base
          // `jersey-deep` variant.
          className="!bg-jersey-deep-dark"
        >
          <div className="mb-3">
            <MonoLabel size="md" tone="cream">
              Webshop · onze partner
            </MonoLabel>
          </div>

          <EditorialHeading
            level={2}
            size="display-lg"
            tone="cream"
            emphasis={{ text: "Trainingsgear", tone: "warm" }}
            className="mb-4 max-w-5xl"
          >
            Trainingsgear bestel je rechtstreeks bij onze partner.
          </EditorialHeading>

          <p className="text-cream/90 mb-6 max-w-2xl text-base leading-relaxed">
            Trainingskledij, clubpakketten en personalisatie voor onze jeugd- en
            seniorenspelers.
          </p>

          <LinkButton
            href={EXTERNAL_LINKS.webshop}
            variant="inverted"
            onClick={handleCtaClick}
            {...{ target: "_blank", rel: "noopener noreferrer" }}
          >
            Naar de webshop{" "}
            <span aria-hidden="true" className="text-jersey-deep">
              ↗
            </span>
          </LinkButton>
        </TapedCard>
      </div>
    </section>
  );
};
