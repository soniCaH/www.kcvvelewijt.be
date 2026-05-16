import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubshopBanner } from "./ClubshopBanner";
import { EXTERNAL_LINKS } from "@/lib/constants";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";

describe("ClubshopBanner", () => {
  it("renders the 'Onze clubkledij.' editorial heading", () => {
    render(<ClubshopBanner />);
    // EditorialHeading splits emphasis into separate spans; collapse
    // whitespace before asserting on the level-2 heading text.
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent?.replace(/\s+/g, "")).toBe("Onzeclubkledij.");
  });

  it("renders the Brandsfit-led subheading", () => {
    render(<ClubshopBanner />);
    expect(
      screen.getByText(/beschikbaar via brandsfit, onze kledingpartner/i),
    ).toBeInTheDocument();
  });

  it("drops the legacy 'Webshop · onze partner' eyebrow (R6.C lock)", () => {
    render(<ClubshopBanner />);
    expect(
      screen.queryByText(/webshop · onze partner/i),
    ).not.toBeInTheDocument();
  });

  it("renders the Brandsfit CTA opening in a new tab", () => {
    render(<ClubshopBanner />);
    const cta = screen.getByRole("link", {
      name: /naar de brandsfit clubshop/i,
    });
    expect(cta).toHaveAttribute("href", EXTERNAL_LINKS.brandsfit);
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("emits clubshop_banner_impression on mount", () => {
    vi.clearAllMocks();
    render(<ClubshopBanner />);
    expect(trackEvent).toHaveBeenCalledWith("clubshop_banner_impression", {
      destination: EXTERNAL_LINKS.brandsfit,
    });
  });

  it("renders on a jersey-deep-dark surface (no inner TapedCard) per R6.C", () => {
    const { container } = render(<ClubshopBanner />);
    const section = container.querySelector("section");
    expect(section?.className).toContain("bg-jersey-deep-dark");
    // Legacy implementation wrapped the body in a TapedCard. R6.C
    // promotes the section itself to the full-bleed dark surface;
    // the inner TapedCard is retired.
    expect(container.querySelector('[data-bg="jersey-deep"]')).toBeNull();
  });

  it("ships mirrored StripedSeams (top default, bottom flipped)", () => {
    const { container } = render(<ClubshopBanner />);
    const seams = container.querySelectorAll("svg[data-color-pair]");
    expect(seams).toHaveLength(2);
    expect(seams[0]).toHaveAttribute("data-flip", "false");
    expect(seams[1]).toHaveAttribute("data-flip", "true");
    seams.forEach((seam) => {
      expect(seam).toHaveAttribute("data-color-pair", "jersey-tonal");
    });
  });

  it("includes the corner-anchored JerseyShirt illustration, aria-hidden", () => {
    const { container } = render(<ClubshopBanner />);
    // JerseyShirt renders a <figure>; multiple elements on this
    // surface carry `aria-hidden` (the two SVG seams), so query by
    // the figure tag itself and assert it lives inside an aria-hidden
    // wrapper.
    const figure = container.querySelector("figure");
    expect(figure).not.toBeNull();
    expect(figure!.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
