import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TeamLandingItem } from "@/lib/utils/group-teams";

// Mock the data layer — runPromise resolves the teams array the page maps.
//
// Every `displayName` here is deliberately NOT the label this page used to
// hardcode ("A-ploeg" / "B-ploeg") nor the slug-derived fallback ("U13"). A
// fixture that agrees with the old constant cannot tell you which one the page
// rendered, so these are editorial overrides an editor could plausibly type
// (#2630).
const teams: TeamLandingItem[] = [
  {
    _id: "a",
    name: "Eerste Elftallen A",
    displayName: "A-kern",
    slug: "eerste-elftallen-a",
    psdId: null,
    age: "A",
    division: "3NA",
    divisionFull: "Eerste Elftal A – 3e Nat. A",
    tagline: null,
    teamImageUrl: null,
    staff: null,
  },
  {
    _id: "b",
    name: "Eerste Elftallen B",
    displayName: "B-kern",
    slug: "eerste-elftallen-b",
    psdId: null,
    age: "A",
    division: "4P",
    divisionFull: "Eerste Elftal B – 4e Prov.",
    tagline: null,
    teamImageUrl: null,
    staff: null,
  },
  {
    _id: "u13",
    name: "KCVV Elewijt U13",
    displayName: "U13 Groen",
    slug: "kcvv-elewijt-u13",
    psdId: null,
    age: "U13",
    division: null,
    divisionFull: null,
    tagline: null,
    teamImageUrl: null,
    staff: null,
  },
];

vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn().mockResolvedValue(teams),
}));

vi.mock("@/lib/repositories/team.repository", () => ({
  TeamRepository: {},
}));

// Imported at module scope, but dynamically: a static import would hoist above
// `teams` (line 6) and the `vi.mock` factory closing over it would hit TDZ.
// See CLAUDE.md "Import the module under test at module scope".
const { default: TeamsPage } = await import("./page");

describe("/ploegen listing — Phase 6.C composition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the editorial page header", async () => {
    render(await TeamsPage());
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toContain("Onze ploegen");
  });

  it("renders A and B flagships", async () => {
    render(await TeamsPage());
    const flagships = screen.getAllByTestId("team-flagship");
    expect(flagships).toHaveLength(2);
    expect(flagships[0]?.getAttribute("data-variant")).toBe("a");
    expect(flagships[1]?.getAttribute("data-variant")).toBe("b");
  });

  it("names each flagship from the team's display name, not a constant", async () => {
    // The slot used to be labelled `category="A-ploeg"` inline, which meant an
    // editor could rename the team and this page would keep the old word.
    render(await TeamsPage());
    const flagships = screen.getAllByTestId("team-flagship");
    expect(flagships[0]?.textContent).toContain("A-kern");
    expect(flagships[1]?.textContent).toContain("B-kern");
  });

  it("does not head the directory as the youth section", async () => {
    // The same component fills `/jeugd`, where `Jeugdwerking` is true. Here it
    // holds every team the two flagships above it leave out — Reserven among
    // them, a senior side with its own roster (#2641).
    render(await TeamsPage());

    const directory = screen.getByTestId("youth-directory");
    expect(directory).toHaveAttribute("aria-label", "Andere");
    expect(directory.textContent).not.toContain("Jeugdwerking");
  });

  it("captions the youth card with the team's display name", async () => {
    render(await TeamsPage());
    expect(screen.getByTestId("youth-directory")).toBeInTheDocument();
    const youthCards = screen.getAllByTestId("youth-team-card");
    // "U13 Groen", not the bare age code — the caption used to come off `age`,
    // which two teams can share (#2630).
    expect(youthCards.some((c) => c.textContent?.includes("U13 Groen"))).toBe(
      true,
    );
  });

  it("degrades to an empty team list when runPromise rejects, instead of throwing (#2864)", async () => {
    // A rejection here stands in for either a Sanity read failure OR an
    // `AppLayer` construction failure (e.g. a missing `KCVV_API_URL`) — both
    // surface identically as a rejected `runPromise`, which is exactly what
    // `fetchTeams`'s outer try/catch must survive. `degradeSection`'s
    // in-effect `catchAllCause` alone cannot see the latter.
    const { runPromise } = await import("@/lib/effect/runtime");
    vi.mocked(runPromise).mockRejectedValueOnce(
      new Error("KCVV_API_URL is not set"),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const element = await TeamsPage();
    render(element);

    expect(screen.queryAllByTestId("team-flagship")).toHaveLength(0);
    expect(consoleError).toHaveBeenCalledWith(
      "[ploegen] failed to fetch teams:",
      expect.any(Error),
    );
    consoleError.mockRestore();
  });
});
