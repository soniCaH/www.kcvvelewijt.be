import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics/hash-member-id", () => ({
  hashMemberId: (id: string) => `hash:${id}`,
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { MatchdaySponsor } from "./MatchdaySponsor";

const sponsor = {
  id: "sponsor-1",
  name: "Alupoort",
  url: "https://www.alupoort.be",
  logoUrl: "https://cdn.sanity.io/images/p/d/logo.png",
};

describe("MatchdaySponsor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("links the whole card to the Sponsor with the label, name and logo", () => {
    render(<MatchdaySponsor sponsor={sponsor} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://www.alupoort.be");
    expect(link).toHaveAttribute("data-sponsor-id", "sponsor-1");
    expect(link).toHaveTextContent("Matchbal aangeboden door");
    expect(link).toHaveTextContent("Alupoort");
    expect(screen.getByRole("img")).toHaveAttribute(
      "alt",
      "Alupoort — sponsor KCVV Elewijt",
    );
  });

  it("sends sponsor_click with source match", async () => {
    render(<MatchdaySponsor sponsor={sponsor} />);
    await userEvent.click(screen.getByText("Alupoort"));
    expect(trackEvent).toHaveBeenCalledWith("sponsor_click", {
      sponsor_id: "hash:sponsor-1",
      source: "match",
    });
  });

  it("is no link without a url, and shows the name alone without a logo", () => {
    render(
      <MatchdaySponsor sponsor={{ ...sponsor, url: null, logoUrl: null }} />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Alupoort")).toBeInTheDocument();
  });
});
