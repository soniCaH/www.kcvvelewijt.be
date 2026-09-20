import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/spelers/jan-janssens",
}));

import { PageHeroSkeleton } from "./PageHeroSkeleton";

/**
 * Regression coverage for the #2799 review-round-3 accessibility fix.
 *
 * `<UpLinkSlot>` renders a genuine, focusable `<a href>` when `upLink` is
 * passed — the same "real, unshimmered" up-link the loading state's real
 * `<PageHero kicker=…>` copy already gets. `aria-hidden="true"` is
 * documented to never contain focusable content: a keyboard user could tab
 * to it, and a screen reader would announce nothing. Every register must
 * keep that real link outside any `aria-hidden="true"` ancestor, while the
 * shimmer bars stay hidden.
 */
describe("PageHeroSkeleton — up-link accessibility (#2799 review round 3)", () => {
  const upLink = { href: "/ploegen", label: "Ploegen" };

  it("minimal: the real up-link is not a descendant of an aria-hidden ancestor", () => {
    render(<PageHeroSkeleton register="minimal" upLink={upLink} />);
    const link = screen.getByRole("link", { name: "Ploegen" });
    expect(link.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("band · cream: the real up-link is not a descendant of an aria-hidden ancestor", () => {
    render(<PageHeroSkeleton register="band" tone="cream" upLink={upLink} />);
    const link = screen.getByRole("link", { name: "Ploegen" });
    expect(link.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("band · dark: the real up-link is not a descendant of an aria-hidden ancestor", () => {
    render(<PageHeroSkeleton register="band" tone="dark" upLink={upLink} />);
    const link = screen.getByRole("link", { name: "Ploegen" });
    expect(link.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("the shimmer up-link placeholder carries no accessible role (self-hidden, like every other bar)", () => {
    render(<PageHeroSkeleton register="minimal" upLinkShimmer />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("band · cream still hides the shimmer bars and card chrome from assistive tech", () => {
    const { container } = render(
      <PageHeroSkeleton register="band" tone="cream" upLink={upLink} />,
    );
    expect(
      container.querySelector('[data-testid="page-hero-skeleton"]'),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("band · dark still hides the shimmer grid from assistive tech", () => {
    const { container } = render(
      <PageHeroSkeleton register="band" tone="dark" upLink={upLink} image />,
    );
    const hidden = container.querySelector('[aria-hidden="true"]');
    expect(hidden).not.toBeNull();
    // The dark header itself is no longer aria-hidden — only the shimmer
    // grid inside it is — so the up-link stays reachable.
    expect(container.querySelector("header")).not.toHaveAttribute(
      "aria-hidden",
    );
  });

  it("renders no up-link at all when neither upLink nor upLinkShimmer is passed", () => {
    render(<PageHeroSkeleton register="minimal" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

/**
 * Regression coverage for #2877: the shimmer up-link placeholder
 * (`/ploegen/[slug]/wedstrijden`, the one route whose label is data) must
 * carry the same top air as the real `<UpLink>` it stands in for, or the
 * chip jumps 48px (64px at `lg`) the moment the real chip replaces it —
 * exactly the shift AC4 exists to prevent.
 */
describe("PageHeroSkeleton — shimmer up-link top air (#2877)", () => {
  it("carries the ink chip's own top air when the shimmer stands in for it", () => {
    const { container } = render(
      <PageHeroSkeleton register="minimal" upLinkShimmer />,
    );
    expect(container.firstElementChild?.className).toContain("mt-12");
    expect(container.firstElementChild?.className).toContain("lg:mt-16");
  });

  it("gains no top air on the cream (dark-band) shimmer", () => {
    const { container } = render(
      <PageHeroSkeleton register="minimal" tone="dark" upLinkShimmer />,
    );
    const className = container.firstElementChild?.className ?? "";
    expect(className).not.toContain("mt-12");
    expect(className).not.toContain("lg:mt-16");
  });
});
