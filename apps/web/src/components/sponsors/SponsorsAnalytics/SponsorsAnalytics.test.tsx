import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const trackSponsorView = vi.fn();
const trackSponsorCtaClick = vi.fn();

vi.mock("@/hooks/useSponsorAnalytics", () => ({
  useSponsorAnalytics: () => ({
    trackSponsorView,
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
  });
});
