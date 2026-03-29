import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RedCardOpponentTemplate } from "./RedCardOpponentTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt - FC Opponent",
  minute: "82",
};

describe("RedCardOpponentTemplate", () => {
  it("renders a red card label", () => {
    render(<RedCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText(/red.?card|rode kaart/i)).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<RedCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt - FC Opponent")).toBeInTheDocument();
  });

  it("renders minute", () => {
    render(<RedCardOpponentTemplate {...defaultProps} />);
    expect(screen.getByText(/82/)).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<RedCardOpponentTemplate {...defaultProps} />);
    const template = container.firstChild as HTMLElement;
    expect(template).toHaveStyle({ width: "1080px", height: "1920px" });
  });
});
