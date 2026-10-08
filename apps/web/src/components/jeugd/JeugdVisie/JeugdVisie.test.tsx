import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JeugdVisie } from "./JeugdVisie";

describe("JeugdVisie", () => {
  it("renders a section carrying the #visie anchor", () => {
    const { container } = render(<JeugdVisie />);
    const section = container.querySelector("section#visie");
    expect(section).toBeInTheDocument();
  });

  it("renders the section kicker and the visie statement", () => {
    render(<JeugdVisie />);
    expect(screen.getByText("Onze jeugdvisie")).toBeInTheDocument();
    // The youth mission line from club feedback v2 (#3427).
    expect(
      screen.getByText(
        /Met onze club willen we dat lokale kinderen met “goesting” naar de training en wedstrijd komen en met “tegengoesting” terug naar huis gaan\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Bij KCVV Elewijt staat plezier op één/i),
    ).not.toBeInTheDocument();
  });

  it("renders the mono tag row", () => {
    render(<JeugdVisie />);
    for (const tag of ["de jeugdvisie", "plezier", "techniek", "teamspirit"]) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
  });
});
