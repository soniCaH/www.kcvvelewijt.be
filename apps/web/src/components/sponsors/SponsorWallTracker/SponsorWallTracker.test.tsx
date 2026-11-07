import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const trackSponsorClick = vi.fn();
const trackSponsorFeaturedClick = vi.fn();

vi.mock("@/hooks/useSponsorAnalytics", () => ({
  useSponsorAnalytics: () => ({ trackSponsorClick, trackSponsorFeaturedClick }),
}));

import { SponsorWallTracker } from "./SponsorWallTracker";

describe("SponsorWallTracker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tracks a tile click with id + tier (delegated from a child element)", () => {
    render(
      <SponsorWallTracker>
        <a data-sponsor-id="w1" data-sponsor-tier="sponsor" href="#">
          <span>logo</span>
        </a>
      </SponsorWallTracker>,
    );
    fireEvent.click(screen.getByText("logo"));
    expect(trackSponsorClick).toHaveBeenCalledTimes(1);
    expect(trackSponsorClick).toHaveBeenCalledWith({
      sponsorId: "w1",
      tier: "sponsor",
      source: undefined,
    });
    expect(trackSponsorFeaturedClick).not.toHaveBeenCalled();
  });

  it("passes the surface through as the click source", () => {
    render(
      <SponsorWallTracker source="homepage">
        <a data-sponsor-id="w1" href="#">
          Tile
        </a>
      </SponsorWallTracker>,
    );
    fireEvent.click(screen.getByText("Tile"));
    expect(trackSponsorClick).toHaveBeenCalledWith({
      sponsorId: "w1",
      tier: undefined,
      source: "homepage",
    });
  });

  it("tracks a featured marquee click, and not as a tile click", () => {
    render(
      <SponsorWallTracker>
        <a
          data-sponsor-id="f1"
          data-sponsor-tier="hoofdsponsor"
          data-sponsor-featured="true"
          href="#"
        >
          Featured
        </a>
      </SponsorWallTracker>,
    );
    fireEvent.click(screen.getByText("Featured"));
    expect(trackSponsorFeaturedClick).toHaveBeenCalledTimes(1);
    expect(trackSponsorFeaturedClick).toHaveBeenCalledWith({
      sponsorId: "f1",
      tier: "hoofdsponsor",
    });
    expect(trackSponsorClick).not.toHaveBeenCalled();
  });

  it("ignores clicks outside any sponsor element", () => {
    render(
      <SponsorWallTracker>
        <div>plain</div>
      </SponsorWallTracker>,
    );
    fireEvent.click(screen.getByText("plain"));
    expect(trackSponsorClick).not.toHaveBeenCalled();
    expect(trackSponsorFeaturedClick).not.toHaveBeenCalled();
  });

  it("adds no layout box (display: contents)", () => {
    const { container } = render(
      <SponsorWallTracker>
        <span>wall</span>
      </SponsorWallTracker>,
    );
    expect(container.firstElementChild).toHaveClass("contents");
  });
});
