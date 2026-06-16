import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SquarePreGameTemplate } from "./SquarePreGameTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt — Eppegem",
  competition: "2e Provinciale",
  dateTime: "Zaterdag · 20:00",
};

describe("SquarePreGameTemplate", () => {
  it("renders both clubs", () => {
    render(<SquarePreGameTemplate {...defaultProps} />);
    expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
    expect(screen.getByText("Eppegem")).toBeInTheDocument();
  });

  it("renders the Vandaag · competition kicker", () => {
    render(<SquarePreGameTemplate {...defaultProps} />);
    expect(screen.getByText("Vandaag · 2e Provinciale")).toBeInTheDocument();
  });

  it("renders the kickoff time", () => {
    render(<SquarePreGameTemplate {...defaultProps} />);
    expect(screen.getByText("Zaterdag · 20:00")).toBeInTheDocument();
  });

  it("renders as a 1080x1080 square", () => {
    const { container } = render(<SquarePreGameTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1080px",
    });
  });

  it("renders a fullscreen newsprint photo when supplied", () => {
    render(<SquarePreGameTemplate {...defaultProps} imageUrl="blob:sq" />);
    const img = document.querySelector('img[src="blob:sq"]');
    expect(img).toHaveAttribute("crossorigin", "anonymous");
  });
});
