import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FullTimeTemplate } from "./FullTimeTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt — FC Opponent",
  score: "2 - 1",
  mood: "win" as const,
};

describe("FullTimeTemplate", () => {
  it("renders a full-time label", () => {
    render(<FullTimeTemplate {...defaultProps} />);
    expect(screen.getByText(/full.?time|eindstand/i)).toBeInTheDocument();
  });

  it("renders score", () => {
    render(<FullTimeTemplate {...defaultProps} />);
    expect(screen.getByText("2 - 1")).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<FullTimeTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt — FC Opponent")).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<FullTimeTemplate {...defaultProps} />);
    const template = container.firstChild as HTMLElement;
    expect(template).toHaveStyle({ width: "1080px", height: "1920px" });
  });

  it("renders draw mood headline", () => {
    render(<FullTimeTemplate {...defaultProps} mood="draw" />);
    expect(screen.getByText("GELIJKSPEL")).toBeInTheDocument();
  });

  it("renders loss mood headline", () => {
    render(<FullTimeTemplate {...defaultProps} mood="loss" />);
    expect(screen.getByText("VERLOREN")).toBeInTheDocument();
  });
});
