import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RedCardKcvvTemplate } from "./RedCardKcvvTemplate";

const defaultProps = {
  playerName: "Kevin Van Ransbeeck",
  shirtNumber: 10,
  matchName: "KCVV Elewijt - FC Opponent",
  minute: "67",
};

describe("RedCardKcvvTemplate", () => {
  it("renders a red card label", () => {
    render(<RedCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText(/red.?card|rode kaart/i)).toBeInTheDocument();
  });

  it("renders player name", () => {
    render(<RedCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("Kevin Van Ransbeeck")).toBeInTheDocument();
  });

  it("renders shirt number", () => {
    render(<RedCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<RedCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt - FC Opponent")).toBeInTheDocument();
  });

  it("renders minute", () => {
    render(<RedCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText(/67/)).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<RedCardKcvvTemplate {...defaultProps} />);
    const template = container.firstChild as HTMLElement;
    expect(template).toHaveStyle({ width: "1080px", height: "1920px" });
  });
});
