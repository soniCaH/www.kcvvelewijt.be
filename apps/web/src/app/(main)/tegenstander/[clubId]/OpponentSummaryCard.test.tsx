import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpponentSummaryCard } from "./OpponentSummaryCard";

const SUMMARY = {
  wins: 3,
  draws: 2,
  losses: 1,
  goalsFor: 13,
  goalsAgainst: 7,
};

describe("OpponentSummaryCard", () => {
  it("renders all five tallies", () => {
    render(<OpponentSummaryCard summary={SUMMARY} />);
    const card = screen.getByTestId("opponent-summary");
    expect(card.textContent).toContain("3");
    expect(card.textContent).toContain("2");
    expect(card.textContent).toContain("1");
    expect(card.textContent).toContain("13");
    expect(card.textContent).toContain("7");
  });

  it("labels each cell (W · G · V · DV · DT)", () => {
    render(<OpponentSummaryCard summary={SUMMARY} />);
    for (const label of ["W", "G", "V", "DV", "DT"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("exposes the full Dutch term to assistive tech", () => {
    render(<OpponentSummaryCard summary={SUMMARY} />);
    expect(screen.getByText("winst")).toBeInTheDocument();
    expect(screen.getByText("doelpunten tegen")).toBeInTheDocument();
  });

  it("tones the win cell jersey-deep and the loss cell alert", () => {
    const { container } = render(<OpponentSummaryCard summary={SUMMARY} />);
    expect(container.querySelector("dd.text-jersey-deep")).toHaveTextContent(
      "3",
    );
    expect(container.querySelector("dd.text-alert")).toHaveTextContent("1");
  });

  it("still renders zero tallies", () => {
    render(
      <OpponentSummaryCard
        summary={{ wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }}
      />,
    );
    expect(screen.getAllByText("0")).toHaveLength(5);
  });
});
