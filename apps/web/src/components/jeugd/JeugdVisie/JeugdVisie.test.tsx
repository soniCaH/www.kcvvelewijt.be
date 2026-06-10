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
    expect(
      screen.getByText(/Bij KCVV Elewijt staat plezier op één/i),
    ).toBeInTheDocument();
  });

  it("renders the mono tag row", () => {
    render(<JeugdVisie />);
    for (const tag of ["de jeugdvisie", "plezier", "techniek", "teamspirit"]) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
  });
});
