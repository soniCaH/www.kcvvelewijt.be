import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KickoffTemplate } from "./KickoffTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt - FC Opponent",
};

describe("KickoffTemplate", () => {
  it("renders a kick-off label", () => {
    render(<KickoffTemplate {...defaultProps} />);
    expect(screen.getByText(/kick.?off|aftrap/i)).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<KickoffTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt - FC Opponent")).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<KickoffTemplate {...defaultProps} />);
    const template = container.firstChild as HTMLElement;
    expect(template).toHaveStyle({ width: "1080px", height: "1920px" });
  });
});
