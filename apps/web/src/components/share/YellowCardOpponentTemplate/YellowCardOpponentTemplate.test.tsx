import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YellowCardOpponentTemplate } from "./YellowCardOpponentTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt - FC Opponent",
  minute: "38",
};

describe("YellowCardOpponentTemplate", () => {
  it("renders a yellow card label", () => {
    render(<YellowCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText(/yellow.?card|gele kaart/i)).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<YellowCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt - FC Opponent")).toBeInTheDocument();
  });

  it("renders minute", () => {
    render(<YellowCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText(/38/)).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(
      <YellowCardOpponentTemplate {...defaultProps} />,
    );
    const template = container.firstChild as HTMLElement;
    expect(template).toHaveStyle({ width: "1080px", height: "1920px" });
  });
});
