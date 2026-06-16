import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FullTimeTemplate } from "./FullTimeTemplate";

const defaultProps = {
  matchName: "KCVV Elewijt — Eppegem",
  score: "3 - 1",
  mood: "win" as const,
  competition: "2e Provinciale",
};

describe("FullTimeTemplate", () => {
  it("renders the Eindstand kicker", () => {
    render(<FullTimeTemplate {...defaultProps} />);
    expect(screen.getByText("Eindstand")).toBeInTheDocument();
  });

  it("renders the score with a tight en-dash", () => {
    render(<FullTimeTemplate {...defaultProps} />);
    expect(screen.getByText("3–1")).toBeInTheDocument();
  });

  it("renders the win headline with a warm bang", () => {
    render(<FullTimeTemplate {...defaultProps} mood="win" />);
    const heading = screen.getByRole("heading", { name: /gewonnen/i });
    expect(heading.textContent).toBe("Gewonnen!");
  });

  it("renders the draw headline with a sober period", () => {
    render(<FullTimeTemplate {...defaultProps} mood="draw" score="2 - 2" />);
    const heading = screen.getByRole("heading", { name: /gelijkspel/i });
    expect(heading.textContent).toBe("Gelijkspel.");
  });

  it("renders the loss headline with a sober period", () => {
    render(<FullTimeTemplate {...defaultProps} mood="loss" score="1 - 3" />);
    const heading = screen.getByRole("heading", { name: /verloren/i });
    expect(heading.textContent).toBe("Verloren.");
  });

  it("shows the competition and the teams in the footer", () => {
    render(<FullTimeTemplate {...defaultProps} />);
    expect(screen.getByText("2e Provinciale")).toBeInTheDocument();
    expect(screen.getByText("KCVV Elewijt — Eppegem")).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<FullTimeTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });

  it("renders a fullscreen newsprint photo when an image is supplied", () => {
    render(<FullTimeTemplate {...defaultProps} imageUrl="blob:ft" />);
    const img = document.querySelector('img[src="blob:ft"]');
    expect(img).toHaveAttribute("crossorigin", "anonymous");
  });
});
