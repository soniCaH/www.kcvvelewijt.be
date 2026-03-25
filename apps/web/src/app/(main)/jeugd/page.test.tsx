import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer so the async server component can render
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/repositories/team.repository", () => ({
  TeamRepository: {},
}));

vi.mock("@/lib/repositories/article.repository", () => ({
  ArticleRepository: {},
}));

describe("/jeugd page — canonical section flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders quote section with diagonal-right transition", async () => {
    const JeugdPage = (await import("./page")).default;
    const jsx = await JeugdPage();
    const { container } = render(jsx);

    // The quote section (kcvv-green-dark) should have a transition to the next section
    // SectionTransition renders between sections when transition is defined and colors differ
    const transitions = container.querySelectorAll(
      '[data-testid="section-transition"]',
    );

    // Canonical flow: hero→editorial, editorial→teams, teams→quote, quote→cta = 4 transitions
    // (hero has overlap transition, editorial has diagonal-left, teams has diagonal-right, quote has diagonal-right)
    expect(transitions.length).toBeGreaterThanOrEqual(4);
  });

  it("renders CTA section with gray-100 background", async () => {
    const JeugdPage = (await import("./page")).default;
    const jsx = await JeugdPage();
    render(jsx);

    const ctaButton = screen.getByRole("link", { name: /word ook lid/i });
    // Walk up to find the section wrapper with bg class
    const sectionWrapper = ctaButton.closest(".bg-gray-100");
    expect(sectionWrapper).not.toBeNull();
  });

  it("does NOT render CTA section with white background", async () => {
    const JeugdPage = (await import("./page")).default;
    const jsx = await JeugdPage();
    render(jsx);

    const ctaButton = screen.getByRole("link", { name: /word ook lid/i });
    const whiteBgAncestor = ctaButton.closest(".bg-white");
    expect(whiteBgAncestor).toBeNull();
  });
});
