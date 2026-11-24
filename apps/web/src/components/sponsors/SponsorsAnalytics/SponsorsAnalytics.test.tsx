import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const trackSponsorView = vi.fn();
const trackSponsorCtaClick = vi.fn();
const trackSponsorContactClick = vi.fn();

vi.mock("@/hooks/useSponsorAnalytics", () => ({
  useSponsorAnalytics: () => ({
    trackSponsorView,
    trackSponsorCtaClick,
    trackSponsorContactClick,
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

  it("tracks the contact link click, not as a CTA click", () => {
    render(
      <SponsorsAnalytics>
        <a data-sponsor-contact="true" href="#">
          mail
        </a>
      </SponsorsAnalytics>,
    );
    fireEvent.click(screen.getByText("mail"));
    expect(trackSponsorContactClick).toHaveBeenCalledTimes(1);
    expect(trackSponsorCtaClick).not.toHaveBeenCalled();
  });

  it("ignores clicks outside the CTA, tile markers included", () => {
    render(
      <SponsorsAnalytics>
        <a data-sponsor-id="w1" href="#">
          tile
        </a>
      </SponsorsAnalytics>,
    );
    fireEvent.click(screen.getByText("tile"));
    expect(trackSponsorCtaClick).not.toHaveBeenCalled();
    expect(trackSponsorContactClick).not.toHaveBeenCalled();
  });
});
