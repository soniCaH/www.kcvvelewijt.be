import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HalftimeTemplate } from "./HalftimeTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt — FC Opponent",
  score: "1 - 0",
};

describe("HalftimeTemplate", () => {
  it("renders a halftime label", () => {
    render(<HalftimeTemplate {...defaultProps} />);
    // "RUST" headline and "Rust-stand" label both match /rust/i; target the headline exactly
    expect(screen.getByText("RUST")).toBeInTheDocument();
  });

  it("renders score", () => {
    render(<HalftimeTemplate {...defaultProps} />);
    expect(screen.getByText("1 - 0")).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<HalftimeTemplate {...defaultProps} />);
    // em-dash fixture splits correctly; full matchName appears only in the footer
    expect(screen.getByText("KCVV Elewijt — FC Opponent")).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<HalftimeTemplate {...defaultProps} />);
    const template = container.firstChild as HTMLElement;
    expect(template).toHaveStyle({ width: "1080px", height: "1920px" });
  });
});
