import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClubLoading from "./loading";

describe("ClubLoading", () => {
  it("renders SectionTransition SVGs between sections", () => {
    render(<ClubLoading />);
    const transitions = screen.getAllByTestId("section-transition");
    // editorial→mission, mission→contact (2 transitions). The Phase 10 cream
    // PageHero hero section no longer carries a diagonal seam.
    // editorial→mission: different bg (gray-100 → kcvv-green-dark) ✓
    // mission→contact: kcvv-green-dark → gray-100, different ✓
    expect(transitions).toHaveLength(2);
  });

  it("renders the getClubSections backgrounds via SectionStack", () => {
    const { container } = render(<ClubLoading />);
    // getClubSections defines: hero (transparent section, cream PageHero
    // field), editorial (gray-100), mission (kcvv-green-dark), contact
    // (gray-100). If a hand-rolled layout replaced SectionStack, at least one
    // of these bg classes would be missing.
    expect(container.querySelector(".bg-cream")).not.toBeNull();
    expect(container.querySelector(".bg-kcvv-green-dark")).not.toBeNull();
    expect(
      container.querySelectorAll(".bg-gray-100").length,
    ).toBeGreaterThanOrEqual(2);
  });
});
