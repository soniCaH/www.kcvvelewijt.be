import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer so the async server component can render.
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/repositories/team.repository", () => ({
  TeamRepository: {},
}));

vi.mock("@/lib/repositories/article.repository", () => ({
  ArticleRepository: {},
}));

vi.mock(
  "@/lib/repositories/jeugd-landing-page.repository",
  async (importOriginal) => {
    const { Layer, Effect } = await import("effect");
    const mod =
      await importOriginal<
        typeof import("@/lib/repositories/jeugd-landing-page.repository")
      >();
    return {
      ...mod,
      JeugdLandingPageRepositoryLive: Layer.succeed(
        mod.JeugdLandingPageRepository,
        { getEditorialCards: () => Effect.succeed(null) },
      ),
    };
  },
);

describe("/jeugd page — cream tracer composition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page heading on cream (no SectionStack transitions)", async () => {
    const JeugdPage = (await import("./page")).default;
    const { container } = render(await JeugdPage());

    expect(
      screen.getByRole("heading", { level: 1, name: /jeugdopleiding/i }),
    ).toBeInTheDocument();
    // The legacy dark SectionStack + diagonal transitions are gone.
    expect(
      container.querySelectorAll('[data-testid="section-transition"]'),
    ).toHaveLength(0);
  });

  it("no longer renders the legacy 'Word ook lid' CTA", async () => {
    const JeugdPage = (await import("./page")).default;
    render(await JeugdPage());

    expect(
      screen.queryByRole("link", { name: /word ook lid/i }),
    ).not.toBeInTheDocument();
  });
});
