import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { youthTeam } from "@/components/team/YouthDirectory/youth-directory.fixtures";
import { runPromise } from "@/lib/effect/runtime";

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

// Imported at module scope — see CLAUDE.md "Import the module under test at
// module scope".
const { default: JeugdPage } = await import("./page");

describe("/jeugd page — cream tracer composition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the JeugdHero heading on cream (no SectionStack transitions)", async () => {
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
    const { container } = render(await JeugdPage());

    const visie = container.querySelector("section#visie");
    expect(visie).toBeInTheDocument();
    // Scope to the section — "Onze jeugdvisie" is also a nav-hub card title.
    expect(
      within(visie as HTMLElement).getByText("Onze jeugdvisie"),
    ).toBeInTheDocument();
  });

  it("no longer renders the legacy 'Word ook lid' CTA", async () => {
    render(await JeugdPage());

    expect(
      screen.queryByRole("link", { name: /word ook lid/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the closing JeugdCtaBand linking to /club/word-lid", async () => {
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
    render(await JeugdPage());

    expect(trackEvent).toHaveBeenCalledWith("jeugd_view", undefined);
  });

  it("fires jeugd_card_click when a nav-hub card is clicked", async () => {
    render(await JeugdPage());

    screen.getByText("Word lid van KCVV").click();

    expect(trackEvent).toHaveBeenCalledWith(
      "jeugd_card_click",
      expect.objectContaining({ card_type: "nav" }),
    );
  });

  it("keeps the youth heading on the directory it shares with /ploegen", async () => {
    // The three reads resolve in `Promise.all` order — teams, articles,
    // editorial config — so one `…Once` fills the directory and the rest fall
    // through to the empty default.
    vi.mocked(runPromise).mockResolvedValueOnce([youthTeam("U13")]);

    render(await JeugdPage());

    // `/ploegen` renders this same component over a wider set of teams and
    // passes a different heading (#2641); this route stays the youth section.
    expect(screen.getByTestId("youth-directory")).toHaveAttribute(
      "aria-label",
      "Jeugdwerking",
    );
    expect(
      screen.getByRole("heading", { level: 2, name: /jeugdwerking/i }),
    ).toBeInTheDocument();
  });

  it("empty data: drops the divisions section, keeps a nav-only hub + the CTA", async () => {
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

  // #2864: a rejection here stands in for either a Sanity read failure OR an
  // `AppLayer` construction failure (e.g. a missing `KCVV_API_URL`) — both
  // surface identically as a rejected `runPromise`, which is exactly what
  // each fetcher's outer try/catch must survive. `degradeSection`'s
  // in-effect `catchAllCause` alone cannot see the latter.
  describe("runPromise rejecting mid-fetch degrades instead of throwing", () => {
    it("teams read: falls back to an empty list", async () => {
      vi.mocked(runPromise).mockRejectedValueOnce(
        new Error("KCVV_API_URL is not set"),
      );
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { container } = render(await JeugdPage());

      expect(
        container.querySelector('[data-testid="youth-directory"]'),
      ).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(
        "[jeugd] failed to fetch youth teams:",
        expect.any(Error),
      );
      consoleError.mockRestore();
    });

    it("Jeugd-articles read: falls back to an empty list", async () => {
      vi.mocked(runPromise)
        .mockResolvedValueOnce([]) // teams
        .mockRejectedValueOnce(new Error("KCVV_API_URL is not set")); // articles
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(await JeugdPage());

      expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(
        "[jeugd] failed to fetch jeugd articles:",
        expect.any(Error),
      );
      consoleError.mockRestore();
    });

    it("editorial-config read: falls back to null (pinned nav cards)", async () => {
      vi.mocked(runPromise)
        .mockResolvedValueOnce([]) // teams
        .mockResolvedValueOnce([]) // articles
        .mockRejectedValueOnce(new Error("KCVV_API_URL is not set")); // editorial config
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(await JeugdPage());

      expect(screen.getByText("Word lid van KCVV")).toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(
        "[jeugd] editorial-cards lookup failed:",
        expect.any(Error),
      );
      consoleError.mockRestore();
    });
  });
});
