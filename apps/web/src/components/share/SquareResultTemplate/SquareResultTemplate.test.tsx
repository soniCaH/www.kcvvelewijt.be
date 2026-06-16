import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SquareResultTemplate } from "./SquareResultTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt — Eppegem",
  score: "3 - 1",
  mood: "win" as const,
  competition: "2e Provinciale",
};

describe("SquareResultTemplate", () => {
  it("renders the Eindstand kicker and score", () => {
    render(<SquareResultTemplate {...defaultProps} />);
    expect(screen.getByText("Eindstand")).toBeInTheDocument();
    expect(screen.getByText("3–1")).toBeInTheDocument();
  });

  it("renders the win headline with a warm bang", () => {
    render(<SquareResultTemplate {...defaultProps} mood="win" />);
    const heading = screen.getByRole("heading", { name: /gewonnen/i });
    expect(heading.textContent).toBe("Gewonnen!");
  });

  it("renders the loss headline with a sober period", () => {
    render(
      <SquareResultTemplate {...defaultProps} mood="loss" score="1 - 3" />,
    );
    const heading = screen.getByRole("heading", { name: /verloren/i });
    expect(heading.textContent).toBe("Verloren.");
  });

  it("shows the competition and the teams in the footer", () => {
    render(<SquareResultTemplate {...defaultProps} />);
    expect(screen.getByText("2e Provinciale")).toBeInTheDocument();
    expect(screen.getByText("KCVV Elewijt — Eppegem")).toBeInTheDocument();
  });

  it("renders as a 1080x1080 square", () => {
    const { container } = render(<SquareResultTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1080px",
    });
  });

  it("renders a fullscreen newsprint photo when supplied", () => {
    render(<SquareResultTemplate {...defaultProps} imageUrl="blob:sqr" />);
    const img = document.querySelector('img[src="blob:sqr"]');
    expect(img).toHaveAttribute("crossorigin", "anonymous");
  });
});
