/**
 * Event pins for the sponsor wall clicks (#3649): every wall click must reach
 * GA4 exactly once, with today's name and parameters, whichever page wrapper
 * surrounds the wall. Rendered through the real hook, `hashMemberId` included,
 * so a second handler on the way up would double-count here.
 */
import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { hashMemberId } from "@/lib/analytics/hash-member-id";
import { HomepageAnalytics } from "@/components/home/HomepageAnalytics";
import { SponsorsAnalytics } from "../SponsorsAnalytics";

const mockTrackEvent = vi.mocked(trackEvent);

const homepage = (wall: ReactNode) => (
  <HomepageAnalytics>{wall}</HomepageAnalytics>
);
const sponsorsPage = (wall: ReactNode) => (
  <SponsorsAnalytics>{wall}</SponsorsAnalytics>
);

const tile = (
  <a
    href="https://sponsor.example"
    data-sponsor-id="s-1"
    data-sponsor-tier="sponsor"
  >
    Tile
  </a>
);
const featured = (
  <a
    href="https://sponsor.example"
    data-sponsor-id="f-1"
    data-sponsor-tier="hoofdsponsor"
    data-sponsor-featured="true"
  >
    Featured
  </a>
);

describe("sponsor wall clicks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("homepage tile: one sponsor_click with source homepage", async () => {
    render(homepage(tile));
    await userEvent.click(screen.getByRole("link", { name: "Tile" }));

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith("sponsor_click", {
      sponsor_id: hashMemberId("s-1"),
      tier: "sponsor",
      source: "homepage",
    });
  });

  it("/sponsors tile: one sponsor_click without a source", async () => {
    render(sponsorsPage(tile));
    await userEvent.click(screen.getByRole("link", { name: "Tile" }));

    const clicks = mockTrackEvent.mock.calls.filter(
      ([name]) => name === "sponsor_click",
    );
    expect(clicks).toEqual([
      ["sponsor_click", { sponsor_id: hashMemberId("s-1"), tier: "sponsor" }],
    ]);
  });

  it("/sponsors featured card: one sponsor_featured_click, no sponsor_click", async () => {
    render(sponsorsPage(featured));
    await userEvent.click(screen.getByRole("link", { name: "Featured" }));

    const clicks = mockTrackEvent.mock.calls.filter(
      ([name]) => name !== "sponsor_view",
    );
    expect(clicks).toEqual([
      [
        "sponsor_featured_click",
        { sponsor_id: hashMemberId("f-1"), tier: "hoofdsponsor" },
      ],
    ]);
  });

  it("/sponsors fires sponsor_view once and the CTA once", async () => {
    render(
      sponsorsPage(
        <a href="#" data-sponsor-cta="true">
          Word sponsor
        </a>,
      ),
    );
    await userEvent.click(screen.getByRole("link", { name: "Word sponsor" }));

    expect(
      mockTrackEvent.mock.calls.filter(([name]) => name === "sponsor_view"),
    ).toHaveLength(1);
    expect(
      mockTrackEvent.mock.calls.filter(
        ([name]) => name === "sponsor_cta_click",
      ),
    ).toHaveLength(1);
  });

  it("homepage banner and identity buttons fire once, not as sponsor clicks", async () => {
    render(
      homepage(
        <>
          <a href="https://campaign.example" data-banner-slot="a">
            Banner
          </a>
          <a href="/club" data-identity-cta="onze_club">
            Identity
          </a>
        </>,
      ),
    );
    await userEvent.click(screen.getByRole("link", { name: "Banner" }));
    await userEvent.click(screen.getByRole("link", { name: "Identity" }));

    expect(mockTrackEvent.mock.calls).toEqual([
      [
        "banner_click",
        { position: "a", destination: "https://campaign.example" },
      ],
      ["identity_band_click", { cta: "onze_club" }],
    ]);
  });
});
