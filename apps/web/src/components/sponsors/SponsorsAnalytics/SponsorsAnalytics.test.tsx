import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const trackSponsorView = vi.fn();
const trackSponsorClick = vi.fn();
const trackSponsorFeaturedClick = vi.fn();
const trackSponsorCtaClick = vi.fn();

vi.mock("@/hooks/useSponsorAnalytics", () => ({
  useSponsorAnalytics: () => ({
    trackSponsorView,
    trackSponsorClick,
    trackSponsorFeaturedClick,
    trackSponsorCtaClick,
  }),
}));

import { SponsorsAnalytics } from "./SponsorsAnalytics";

describe("SponsorsAnalytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fires sponsor_view once on mount", () => {
    render(
      <SponsorsAnalytics>
        <div>body</div>
      </SponsorsAnalytics>,
    );
    expect(trackSponsorView).toHaveBeenCalledTimes(1);
  });

  it("tracks a tile click with id + tier (delegated from a child element)", () => {
    render(
      <SponsorsAnalytics>
        <a data-sponsor-id="w1" data-sponsor-tier="sponsor" href="#">
          <span>logo</span>
        </a>
      </SponsorsAnalytics>,
    );
    fireEvent.click(screen.getByText("logo"));
    expect(trackSponsorClick).toHaveBeenCalledWith({
      sponsorId: "w1",
      tier: "sponsor",
    });
    expect(trackSponsorFeaturedClick).not.toHaveBeenCalled();
  });

  it("tracks a featured marquee click", () => {
    render(
      <SponsorsAnalytics>
        <a
          data-sponsor-id="f1"
          data-sponsor-tier="hoofdsponsor"
          data-sponsor-featured="true"
          href="#"
        >
          Featured
        </a>
      </SponsorsAnalytics>,
    );
    fireEvent.click(screen.getByText("Featured"));
    expect(trackSponsorFeaturedClick).toHaveBeenCalledWith({
      sponsorId: "f1",
      tier: "hoofdsponsor",
    });
    expect(trackSponsorClick).not.toHaveBeenCalled();
  });

  it("tracks the CTA button click", () => {
    render(
      <SponsorsAnalytics>
        <a data-sponsor-cta="true" href="#">
          Word sponsor
        </a>
      </SponsorsAnalytics>,
    );
    fireEvent.click(screen.getByText("Word sponsor"));
    expect(trackSponsorCtaClick).toHaveBeenCalledTimes(1);
  });

  it("omits tier when the attribute is absent", () => {
    render(
      <SponsorsAnalytics>
        <a data-sponsor-id="u1" href="#">
          Untiered
        </a>
      </SponsorsAnalytics>,
    );
    fireEvent.click(screen.getByText("Untiered"));
    expect(trackSponsorClick).toHaveBeenCalledWith({
      sponsorId: "u1",
      tier: undefined,
    });
  });

  it("ignores clicks outside any sponsor element", () => {
    render(
      <SponsorsAnalytics>
        <div>plain</div>
      </SponsorsAnalytics>,
    );
    fireEvent.click(screen.getByText("plain"));
    expect(trackSponsorClick).not.toHaveBeenCalled();
    expect(trackSponsorFeaturedClick).not.toHaveBeenCalled();
    expect(trackSponsorCtaClick).not.toHaveBeenCalled();
  });
});
