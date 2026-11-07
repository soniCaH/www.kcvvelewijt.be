import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { HomepageAnalytics } from "./HomepageAnalytics";

const mockTrackEvent = vi.mocked(trackEvent);

describe("HomepageAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fires banner_click with the slot position and destination", async () => {
    render(
      <HomepageAnalytics>
        <a href="https://campaign.example" data-banner-slot="b">
          Banner
        </a>
      </HomepageAnalytics>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Banner" }));

    expect(mockTrackEvent).toHaveBeenCalledWith("banner_click", {
      position: "b",
      destination: "https://campaign.example",
    });
  });

  it("resolves a click on a child element up to the marked banner link", async () => {
    render(
      <HomepageAnalytics>
        <a href="https://campaign.example" data-banner-slot="c">
          <img alt="Campagne" src="/banner.png" />
        </a>
      </HomepageAnalytics>,
    );

    await userEvent.click(screen.getByAltText("Campagne"));

    expect(mockTrackEvent).toHaveBeenCalledWith("banner_click", {
      position: "c",
      destination: "https://campaign.example",
    });
  });

  it.each(["word_lid", "onze_club"])(
    "fires identity_band_click with cta %s",
    async (cta) => {
      render(
        <HomepageAnalytics>
          <a href="/test-route" data-identity-cta={cta}>
            Knop
          </a>
        </HomepageAnalytics>,
      );

      await userEvent.click(screen.getByRole("link", { name: "Knop" }));

      expect(mockTrackEvent).toHaveBeenCalledWith("identity_band_click", {
        cta,
      });
    },
  );

  it("ignores clicks on unmarked links", async () => {
    render(
      <HomepageAnalytics>
        <a href="/test-route">Nieuws</a>
      </HomepageAnalytics>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Nieuws" }));

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
