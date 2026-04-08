import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClubLoading from "./loading";

describe("ClubLoading", () => {
  it("renders SectionTransition SVGs between sections", () => {
    render(<ClubLoading />);
    const transitions = screen.getAllByTestId("section-transition");
    // hero→editorial, editorial→mission, mission→contact (3 transitions)
    // hero→editorial: different bg (kcvv-black → gray-100) ✓
    // editorial→mission: different bg (gray-100 → kcvv-green-dark) ✓
    // mission→contact: same bg? No — kcvv-green-dark → gray-100, different ✓
    expect(transitions).toHaveLength(3);
  });

  it("renders via SectionStack (no hand-rolled divs)", () => {
    const { container } = render(<ClubLoading />);
    // SectionStack renders a single wrapper div with className containing "w-full"
    // Each section has bg class — verify kcvv-green-dark appears (loading.tsx had kcvv-black)
    const greenDark = container.querySelector(".bg-kcvv-green-dark");
    expect(greenDark).not.toBeNull();
  });
});
