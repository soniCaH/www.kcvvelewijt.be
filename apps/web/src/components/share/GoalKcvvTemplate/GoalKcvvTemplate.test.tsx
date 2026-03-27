import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoalKcvvTemplate } from "./GoalKcvvTemplate";

const defaultProps = {
  playerName: "Kevin Van Ransbeeck",
  shirtNumber: 10,
  score: "1 - 0",
  matchName: "KCVV Elewijt - FC Opponent",
  minute: "45",
};

describe("GoalKcvvTemplate", () => {
  it("renders the GOAL label", () => {
    render(<GoalKcvvTemplate {...defaultProps} />);
    expect(screen.getByText(/goal/i)).toBeInTheDocument();
  });

  it("renders player name", () => {
    render(<GoalKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("Kevin Van Ransbeeck")).toBeInTheDocument();
  });

  it("renders shirt number", () => {
    render(<GoalKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders score", () => {
    render(<GoalKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("1 - 0")).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<GoalKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt - FC Opponent")).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<GoalKcvvTemplate {...defaultProps} />);
    const template = container.firstChild as HTMLElement;
    expect(template).toHaveStyle({ width: "1080px", height: "1920px" });
  });
});
