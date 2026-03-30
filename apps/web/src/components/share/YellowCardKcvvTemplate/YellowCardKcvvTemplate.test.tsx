import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YellowCardKcvvTemplate } from "./YellowCardKcvvTemplate";

const defaultProps = {
  playerName: "Kevin Van Ransbeeck",
  shirtNumber: 10,
  matchName: "KCVV Elewijt - FC Opponent",
  minute: "55",
};

describe("YellowCardKcvvTemplate", () => {
  it("renders a yellow card label", () => {
    render(<YellowCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText(/yellow.?card|gele kaart/i)).toBeInTheDocument();
  });

  it("renders player name", () => {
    render(<YellowCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("Kevin Van Ransbeeck")).toBeInTheDocument();
  });

  it("renders shirt number", () => {
    render(<YellowCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<YellowCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt - FC Opponent")).toBeInTheDocument();
  });

  it("renders minute", () => {
    render(<YellowCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText(/55/)).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<YellowCardKcvvTemplate {...defaultProps} />);
    const template = container.firstChild as HTMLElement;
    expect(template).toHaveStyle({ width: "1080px", height: "1920px" });
  });
});
