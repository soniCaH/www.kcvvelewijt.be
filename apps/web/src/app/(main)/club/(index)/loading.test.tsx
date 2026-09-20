import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClubLoading from "./loading";

describe("ClubLoading", () => {
  it("renders no visible heading — the fallback also ships on every /club/* child (#2432)", () => {
    const { container } = render(<ClubLoading />);
    expect(container.querySelectorAll("h1, h2, h3")).toHaveLength(0);
  });

  it("renders the band · cream hero skeleton (bars only, no real PageHero text)", () => {
    render(<ClubLoading />);
    expect(screen.getByTestId("page-hero-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("page-hero")).not.toBeInTheDocument();
  });

  it("announces the loading state without naming a specific child page", () => {
    render(<ClubLoading />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Club laden…");
  });

  it("renders a full-bleed StripedSeam between hero and grid", () => {
    const { container } = render(<ClubLoading />);
    expect(
      container.querySelectorAll("svg[data-direction]").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders a twelve-card skeleton nav grid on the cream field, matching CLUB_HUB_CARDS", () => {
    const { container } = render(<ClubLoading />);
    const skeleton = screen.getByTestId("club-hub-skeleton");
    // Cards are TapedCardGrid slots now (each carries the per-card
    // --taped-card-rotation var), not direct children of the testid wrapper.
    expect(skeleton.querySelectorAll("[data-slot]")).toHaveLength(12);
    expect(container.querySelector(".bg-cream")).not.toBeNull();
  });

  it("composes the real <TapedCardGrid> so cards read the per-slot rotation var on arrival", () => {
    const { container } = render(<ClubLoading />);
    const grid = container.querySelector('[data-columns="3"][data-gap="sm"]');
    expect(grid).not.toBeNull();
    const firstCard = grid!.querySelector("[data-slot] > div");
    expect(firstCard?.className).toContain(
      "rotate-[var(--taped-card-rotation,0deg)]",
    );
  });
});
