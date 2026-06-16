import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HalftimeTemplate } from "./HalftimeTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt — Eppegem",
  score: "2 - 0",
  competition: "2e Provinciale",
};

describe("HalftimeTemplate", () => {
  it("renders the Rust kicker", () => {
    render(<HalftimeTemplate {...defaultProps} />);
    expect(screen.getByText("Rust")).toBeInTheDocument();
  });

  it("renders the score with a tight en-dash", () => {
    render(<HalftimeTemplate {...defaultProps} />);
    expect(screen.getByText("2–0")).toBeInTheDocument();
  });

  it("renders the home club and the opponent · competition meta", () => {
    render(<HalftimeTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
    expect(screen.getByText("Eppegem · 2e Provinciale")).toBeInTheDocument();
  });

  it("shows the crest matchup and the opponent crest when supplied", () => {
    render(<HalftimeTemplate {...defaultProps} awayLogo="/opp.png" />);
    expect(screen.getByAltText("Eppegem")).toHaveAttribute("src", "/opp.png");
    // KCVV crest appears in both the top bar and the matchup row
    expect(
      screen.getAllByAltText("KCVV Elewijt").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<HalftimeTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });

  it("renders the full match name on the image variant", () => {
    render(<HalftimeTemplate {...defaultProps} imageUrl="blob:rust" />);
    expect(screen.getByText("KCVV Elewijt — Eppegem")).toBeInTheDocument();
    const img = document.querySelector('img[src="blob:rust"]');
    expect(img).toHaveAttribute("crossorigin", "anonymous");
  });
});
