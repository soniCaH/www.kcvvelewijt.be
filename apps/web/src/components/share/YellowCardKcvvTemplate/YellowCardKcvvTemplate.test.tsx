import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YellowCardKcvvTemplate } from "./YellowCardKcvvTemplate";

const defaultProps = {
  playerName: "De Smet",
  shirtNumber: 4,
  matchName: "KCVV Elewijt — Eppegem",
  minute: "54",
};

describe("YellowCardKcvvTemplate", () => {
  it("renders the gele kaart · KCVV kicker", () => {
    render(<YellowCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("Gele kaart · KCVV")).toBeInTheDocument();
  });

  it("renders the player name", () => {
    render(<YellowCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("De Smet")).toBeInTheDocument();
  });

  it("renders the shirt number and minute on the meta line", () => {
    render(<YellowCardKcvvTemplate {...defaultProps} />);
    expect(screen.getByText("Nr. 4 · 54'")).toBeInTheDocument();
  });

  it("renders at 1080x1920 pixel dimensions", () => {
    const { container } = render(<YellowCardKcvvTemplate {...defaultProps} />);
    expect(container.firstChild).toHaveStyle({
      width: "1080px",
      height: "1920px",
    });
  });

  it("shows the full matchup in the footer for an away match", () => {
    // Regression: the footer used `${home} — ${opponent}`, which collapsed to
    // "Sporting Hasselt — Sporting Hasselt" when KCVV played away.
    render(
      <YellowCardKcvvTemplate
        {...defaultProps}
        matchName="Sporting Hasselt — KCVV Elewijt"
      />,
    );
    expect(
      screen.getByText("Sporting Hasselt — KCVV Elewijt"),
    ).toBeInTheDocument();
  });
});
