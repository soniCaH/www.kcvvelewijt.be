import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchStripView } from "./MatchStripView";
import { KCVV_FIRST_TEAM_CLUB_ID } from "@/lib/constants";
import type { UpcomingMatch } from "@/components/match/types";

const baseMatch: UpcomingMatch = {
  id: 42,
  date: new Date("2026-05-10T19:30:00Z"),
  time: "19:30",
  venue: "De Schalk",
  competition: "Tweede Provinciale A",
  status: "scheduled",
  homeTeam: { id: KCVV_FIRST_TEAM_CLUB_ID, name: "KCVV" },
  awayTeam: { id: 9999, name: "RC Mechelen", logo: "https://psd/rc.png" },
};

describe("MatchStripView", () => {
  it("renders KCVV first when KCVV is the home side", () => {
    render(<MatchStripView match={baseMatch} />);
    const teamNames = screen.getAllByText(/KCVV|RC Mechelen/);
    // Order should be KCVV (left) → vs → RC Mechelen (right)
    expect(teamNames[0]).toHaveTextContent("KCVV");
    expect(teamNames[1]).toHaveTextContent("RC Mechelen");
    expect(screen.getByText("vs.")).toBeInTheDocument();
  });

  it("renders the opponent first when KCVV is the away side", () => {
    render(
      <MatchStripView
        match={{
          ...baseMatch,
          homeTeam: {
            id: 9999,
            name: "RC Mechelen",
            logo: "https://psd/rc.png",
          },
          awayTeam: { id: KCVV_FIRST_TEAM_CLUB_ID, name: "KCVV" },
        }}
      />,
    );
    const teamNames = screen.getAllByText(/KCVV|RC Mechelen/);
    expect(teamNames[0]).toHaveTextContent("RC Mechelen");
    expect(teamNames[1]).toHaveTextContent("KCVV");
    expect(screen.queryByText("@")).toBeNull();
  });

  it("renders real PSD logos when provided", () => {
    const { container } = render(<MatchStripView match={baseMatch} />);
    const imgs = container.querySelectorAll("img");
    const srcs = Array.from(imgs).map((i) => i.getAttribute("src"));
    expect(srcs).toContain("/images/logos/kcvv-logo.png");
    expect(srcs).toContain("https://psd/rc.png");
  });

  it("falls back to an initial badge when an opponent has no logo", () => {
    render(
      <MatchStripView
        match={{
          ...baseMatch,
          awayTeam: { id: 9999, name: "VK De Volharding" },
        }}
      />,
    );
    const fallback = screen.getByRole("img", { name: "VK De Volharding" });
    expect(fallback).toHaveTextContent("V");
  });

  it("links the CTA to the match-detail route", () => {
    render(<MatchStripView match={baseMatch} />);
    const cta = screen.getByRole("link", { name: /Wedstrijddetails/i });
    expect(cta).toHaveAttribute("href", "/wedstrijd/42");
  });

  it("renders all three meta cells when competition + venue are present", () => {
    render(<MatchStripView match={baseMatch} />);
    expect(screen.getByText("Competitie")).toBeInTheDocument();
    expect(screen.getByText("Aftrap")).toBeInTheDocument();
    expect(screen.getByText("Terrein")).toBeInTheDocument();
    expect(screen.getByText("De Schalk")).toBeInTheDocument();
  });

  it("hides Competitie + Terrein cells when those fields are absent", () => {
    render(
      <MatchStripView
        match={{ ...baseMatch, competition: undefined, venue: undefined }}
      />,
    );
    expect(screen.queryByText("Competitie")).toBeNull();
    expect(screen.queryByText("Terrein")).toBeNull();
    expect(screen.getByText("Aftrap")).toBeInTheDocument();
  });
});
