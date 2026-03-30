import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoalOpponentTemplate } from "./GoalOpponentTemplate";

const defaultProps = {
  score: "0 - 1",
  matchName: "KCVV Elewijt - FC Opponent",
  minute: "33",
};

describe("GoalOpponentTemplate", () => {
  it("renders the GOAL label", () => {
    render(<GoalOpponentTemplate {...defaultProps} />);
    expect(screen.getByText(/goal/i)).toBeInTheDocument();
  });

  it("renders score", () => {
    render(<GoalOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("0 - 1")).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<GoalOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt - FC Opponent")).toBeInTheDocument();
  });

  it("renders minute", () => {
    render(<GoalOpponentTemplate {...defaultProps} />);
    expect(screen.getByText(/33/)).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<GoalOpponentTemplate {...defaultProps} />);
    const template = container.firstChild as HTMLElement;
    expect(template).toHaveStyle({ width: "1080px", height: "1920px" });
  });
});
