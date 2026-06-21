import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

const trackEvent = vi.fn();
vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: (name: string, params?: Record<string, unknown>) =>
    trackEvent(name, params),
}));

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

  it("renders the JeugdHero heading on cream (no SectionStack transitions)", async () => {
    const JeugdPage = (await import("./page")).default;
    const { container } = render(await JeugdPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /beter worden begint met plezier/i,
      }),
    ).toBeInTheDocument();
    // The legacy dark SectionStack + diagonal transitions are gone.
    expect(
      container.querySelectorAll('[data-testid="section-transition"]'),
    ).toHaveLength(0);
  });

  it("renders the filosofie/visie block with the #visie anchor", async () => {
    const JeugdPage = (await import("./page")).default;
    const { container } = render(await JeugdPage());

    const visie = container.querySelector("section#visie");
    expect(visie).toBeInTheDocument();
    // Scope to the section — "Onze jeugdvisie" is also a nav-hub card title.
    expect(
      within(visie as HTMLElement).getByText("Onze jeugdvisie"),
    ).toBeInTheDocument();
  });

  it("no longer renders the legacy 'Word ook lid' CTA", async () => {
    const JeugdPage = (await import("./page")).default;
    render(await JeugdPage());

    expect(
      screen.queryByRole("link", { name: /word ook lid/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the closing JeugdCtaBand linking to /club/word-lid", async () => {
    const JeugdPage = (await import("./page")).default;
    render(await JeugdPage());

    const cta = screen.getByRole("region", { name: "Schrijf je in" });
    expect(
      within(cta).getByRole("heading", {
        level: 2,
        name: /interesse in onze jeugd/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(cta).getByRole("link", { name: /schrijf je in/i }),
    ).toHaveAttribute("href", "/club/word-lid");
  });

  it("fires jeugd_view on page view", async () => {
    const JeugdPage = (await import("./page")).default;
    render(await JeugdPage());

    expect(trackEvent).toHaveBeenCalledWith("jeugd_view", undefined);
  });

  it("fires jeugd_card_click when a nav-hub card is clicked", async () => {
    const JeugdPage = (await import("./page")).default;
    render(await JeugdPage());

    screen.getByText("Word lid van KCVV").click();

    expect(trackEvent).toHaveBeenCalledWith(
      "jeugd_card_click",
      expect.objectContaining({ card_type: "nav" }),
    );
  });

  it("empty data: drops the divisions section, keeps a nav-only hub + the CTA", async () => {
    const JeugdPage = (await import("./page")).default;
    const { container } = render(await JeugdPage());

    // 0 youth teams → <YouthDirectory> returns null (section dropped).
    expect(
      container.querySelector('[data-testid="youth-directory"]'),
    ).not.toBeInTheDocument();
    // 0 Jeugd articles → nav-only hub (the pinned nav cards remain).
    expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
    // The CTA band still renders.
    expect(
      screen.getByRole("region", { name: "Schrijf je in" }),
    ).toBeInTheDocument();
  });
});
