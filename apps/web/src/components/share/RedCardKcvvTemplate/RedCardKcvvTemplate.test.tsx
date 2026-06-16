import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RedCardKcvvTemplate } from "./RedCardKcvvTemplate";

const defaultProps = {
  playerName: "Peeters",
  shirtNumber: 6,
  matchName: "KCVV Elewijt — Eppegem",
  minute: "70",
};

describe("RedCardKcvvTemplate", () => {
  it("renders the rode kaart · KCVV kicker", () => {
    render(<RedCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("Rode kaart · KCVV")).toBeInTheDocument();
  });

  it("renders the player name", () => {
    render(<RedCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("Peeters")).toBeInTheDocument();
  });

  it("renders the shirt number and minute on the meta line", () => {
    render(<RedCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("Nr. 6 · 70'")).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<RedCardKcvvTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });
});
