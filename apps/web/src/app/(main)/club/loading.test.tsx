import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClubLoading from "./loading";

describe("ClubLoading", () => {
  it("renders the compact PageHero", () => {
    render(<ClubLoading />);
    const hero = screen.getByTestId("page-hero");
    expect(hero).toHaveAttribute("data-size", "compact");
    expect(screen.getByText("Onze club")).toBeInTheDocument();
  });

  it("renders a full-bleed StripedSeam between hero and grid", () => {
    const { container } = render(<ClubLoading />);
    expect(
      container.querySelectorAll("svg[data-direction]").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders a six-card skeleton nav grid on the cream field", () => {
    const { container } = render(<ClubLoading />);
    const skeleton = screen.getByTestId("club-hub-skeleton");
    expect(skeleton.children).toHaveLength(6);
    expect(container.querySelector(".bg-cream")).not.toBeNull();
  });
});
