import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { GoalKcvvTemplate } from "./GoalKcvvTemplate";

const defaultProps = {
  playerName: "Kevin Van Ransbeeck",
  shirtNumber: 10,
  score: "1 - 0",
  matchName: "KCVV Elewijt — Eppegem",
  minute: "67",
};

describe("GoalKcvvTemplate", () => {
  it("renders the Goal headline", () => {
    render(<GoalKcvvTemplate {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /goal/i })).toBeInTheDocument();
  });

  it("renders the player name", () => {
    render(<GoalKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("Kevin Van Ransbeeck")).toBeInTheDocument();
  });

  it("renders the current stand with a tight en-dash", () => {
    render(<GoalKcvvTemplate {...defaultProps} imageUrl="blob:goal" />);
    expect(screen.getByText("Stand 1–0")).toBeInTheDocument();
  });

  it("renders the shirt number in the disc on the image variant", () => {
    render(<GoalKcvvTemplate {...defaultProps} imageUrl="blob:goal" />);
    // image variant has no ghost numeral, so the disc is the only "10"
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders the minute on the filled (no-photo) variant", () => {
    render(<GoalKcvvTemplate {...defaultProps} />);
    expect(screen.getByText(/67' · Stand 1–0/)).toBeInTheDocument();
  });

  it("shows the crest matchup on the filled (no-photo) variant", () => {
    render(<GoalKcvvTemplate {...defaultProps} awayLogo="/opp.png" />);
    expect(screen.getByAltText("Eppegem")).toHaveAttribute("src", "/opp.png");
  });

  it("omits the number badge and ghost numeral when the player has no number", () => {
    const { shirtNumber: _omit, ...noNumber } = defaultProps;
    render(<GoalKcvvTemplate {...noNumber} />);
    // no "—" fallback dash anywhere (the giant ghost dash was the band bug)
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    // name + meta still render
    expect(screen.getByText("Kevin Van Ransbeeck")).toBeInTheDocument();
    expect(screen.getByText(/67' · Stand 1–0/)).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<GoalKcvvTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });

  it("sets crossOrigin on the fullscreen photo for canvas export", () => {
    render(<GoalKcvvTemplate {...defaultProps} imageUrl="https://cdn/x.png" />);
    const img = document.querySelector('img[src="https://cdn/x.png"]');
    expect(img).toHaveAttribute("crossorigin", "anonymous");
  });

  it("shows the match name in the footer", () => {
    render(<GoalKcvvTemplate {...defaultProps} />);
    const foot = screen.getByText("KCVVELEWIJT.BE").parentElement!;
    expect(
      within(foot).getByText("KCVV Elewijt — Eppegem"),
    ).toBeInTheDocument();
  });
});
