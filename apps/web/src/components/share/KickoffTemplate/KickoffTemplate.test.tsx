import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KickoffTemplate } from "./KickoffTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt — Eppegem",
  competition: "2e Provinciale",
  dateTime: "Zaterdag · 20:00 · Terrein A",
};

describe("KickoffTemplate", () => {
  it("renders both club names", () => {
    render(<KickoffTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
    expect(screen.getByText("Eppegem")).toBeInTheDocument();
  });

  it("always shows the KCVV crest tile, even without supplied logos", () => {
    render(<KickoffTemplate {...defaultProps} />);
    // brand crest in the top bar + the matchup crest tile = two KCVV crests
    expect(
      screen.getAllByAltText("KCVV Elewijt").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("shows the opponent crest when its logo is supplied", () => {
    render(<KickoffTemplate {...defaultProps} awayLogo="/opp.png" />);
    const oppCrest = screen.getByAltText("Eppegem");
    expect(oppCrest).toHaveAttribute("src", "/opp.png");
  });

  it("renders the competition in the kicker", () => {
    render(<KickoffTemplate {...defaultProps} />);
    expect(screen.getByText("Aftrap · 2e Provinciale")).toBeInTheDocument();
  });

  it("falls back to a plain Aftrap kicker without a competition", () => {
    render(<KickoffTemplate matchName="KCVV Elewijt — Eppegem" />);
    expect(screen.getByText("Aftrap")).toBeInTheDocument();
  });

  it("renders the kickoff date/time", () => {
    render(<KickoffTemplate {...defaultProps} />);
    expect(
      screen.getByText("Zaterdag · 20:00 · Terrein A"),
    ).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<KickoffTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });

  it("renders a fullscreen newsprint photo when an image is supplied", () => {
    render(<KickoffTemplate {...defaultProps} imageUrl="blob:kickoff" />);
    const img = document.querySelector('img[src="blob:kickoff"]');
    expect(img).toHaveAttribute("crossorigin", "anonymous");
  });
});
