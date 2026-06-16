import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoalOpponentTemplate } from "./GoalOpponentTemplate";

const defaultProps = {
  score: "2 - 1",
  matchName: "KCVV Elewijt — Eppegem",
  minute: "78",
  competition: "2e Provinciale",
};

describe("GoalOpponentTemplate", () => {
  it("renders the sober Goal headline", () => {
    render(<GoalOpponentTemplate {...defaultProps} />);
    const heading = screen.getByRole("heading", { name: /goal/i });
    expect(heading.textContent).toBe("Goal.");
  });

  it("labels the kicker and names the opponent on its own line", () => {
    render(<GoalOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("Tegendoelpunt")).toBeInTheDocument();
    expect(screen.getByText("Eppegem")).toBeInTheDocument();
  });

  it("renders the score with a tight en-dash", () => {
    render(<GoalOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("2–1")).toBeInTheDocument();
  });

  it("renders the minute and competition on the meta line", () => {
    render(<GoalOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("78' · 2e Provinciale")).toBeInTheDocument();
  });

  it("shows the teams in the footer", () => {
    render(<GoalOpponentTemplate {...defaultProps} />);
    const foot = screen.getByText("KCVVELEWIJT.BE").parentElement!;
    expect(screen.getByText("KCVV Elewijt — Eppegem")).toBeInTheDocument();
    expect(foot).toContainElement(screen.getByText("KCVV Elewijt — Eppegem"));
  });

  it("shows the opponent crest when supplied", () => {
    render(<GoalOpponentTemplate {...defaultProps} awayLogo="/opp.png" />);
    expect(screen.getByAltText("Eppegem")).toHaveAttribute("src", "/opp.png");
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<GoalOpponentTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });
});
