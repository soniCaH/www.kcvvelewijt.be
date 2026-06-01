import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TeamLandingItem } from "@/lib/utils/group-teams";

// Mock the data layer — runPromise resolves the teams array the page maps.
const teams: TeamLandingItem[] = [
  {
    _id: "a",
    name: "Eerste Elftallen A",
    slug: "eerste-elftallen-a",
    age: "A",
    division: "3NA",
    divisionFull: "Eerste Elftal A – 3e Nat. A",
    season: "25/26",
    tagline: null,
    teamImageUrl: null,
    staff: null,
  },
  {
    _id: "b",
    name: "Eerste Elftallen B",
    slug: "eerste-elftallen-b",
    age: "A",
    division: "4P",
    divisionFull: "Eerste Elftal B – 4e Prov.",
    season: "25/26",
    tagline: null,
    teamImageUrl: null,
    staff: null,
  },
  {
    _id: "u13",
    name: "KCVV Elewijt U13",
    slug: "kcvv-elewijt-u13",
    age: "U13",
    division: null,
    divisionFull: null,
    season: "25/26",
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

describe("/ploegen listing — Phase 6.C composition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the editorial page header", async () => {
    const TeamsPage = (await import("./page")).default;
    render(await TeamsPage());
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toContain("Onze ploegen");
  });

  it("renders A and B flagships", async () => {
    const TeamsPage = (await import("./page")).default;
    render(await TeamsPage());
    const flagships = screen.getAllByTestId("team-flagship");
    expect(flagships).toHaveLength(2);
    expect(flagships[0]?.getAttribute("data-variant")).toBe("a");
    expect(flagships[1]?.getAttribute("data-variant")).toBe("b");
  });

  it("renders the youth directory with the U13 card", async () => {
    const TeamsPage = (await import("./page")).default;
    render(await TeamsPage());
    expect(screen.getByTestId("youth-directory")).toBeInTheDocument();
    const youthCards = screen.getAllByTestId("youth-team-card");
    expect(youthCards.some((c) => c.textContent?.includes("U13"))).toBe(true);
  });
});
