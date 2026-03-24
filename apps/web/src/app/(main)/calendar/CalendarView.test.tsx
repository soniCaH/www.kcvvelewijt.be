/**
 * CalendarView Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarView } from "./CalendarView";
import type { CalendarMatch } from "./utils";
import { getScoreDisplay } from "@/lib/utils/match-display";

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const kcvv: CalendarMatch["homeTeam"] = {
  id: 1,
  name: "KCVV Elewijt A",
  logo: "/kcvv-logo.png",
};
const opponent: CalendarMatch["homeTeam"] = { id: 2, name: "Racing Mechelen" };

function makeMatch(
  overrides: Partial<CalendarMatch> & { id: number },
): CalendarMatch {
  const merged = {
    date: "2026-03-15T15:00:00",
    homeTeam: kcvv,
    awayTeam: opponent,
    status: "scheduled" as CalendarMatch["status"],
    team: "A-ploeg",
    ...overrides,
  };
  return {
    ...merged,
    scoreDisplay:
      merged.scoreDisplay ??
      getScoreDisplay({
        home_team: { score: merged.homeScore },
        away_team: { score: merged.awayScore },
        status: merged.status,
      }),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CalendarView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  // ── Rendering ─────────────────────────────────────────────────────────

  describe("rendering", () => {
    it("renders team names in a match row", () => {
      render(<CalendarView matches={[makeMatch({ id: 1 })]} />);
      expect(screen.getByText("KCVV Elewijt A")).toBeInTheDocument();
      expect(screen.getByText("Racing Mechelen")).toBeInTheDocument();
    });

    it("renders VS when no score is present", () => {
      render(<CalendarView matches={[makeMatch({ id: 1 })]} />);
      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("renders score when both home and away score are present", () => {
      render(
        <CalendarView
          matches={[
            makeMatch({
              id: 1,
              homeScore: 2,
              awayScore: 1,
              status: "finished",
            }),
          ]}
        />,
      );
      expect(screen.getByText("2 - 1")).toBeInTheDocument();
      expect(screen.queryByText("VS")).not.toBeInTheDocument();
    });

    it("renders VS when only one score is defined", () => {
      render(<CalendarView matches={[makeMatch({ id: 1, homeScore: 2 })]} />);
      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("renders match time when provided", () => {
      render(<CalendarView matches={[makeMatch({ id: 1, time: "15:00" })]} />);
      expect(screen.getByText("15:00")).toBeInTheDocument();
    });

    it("renders competition label when provided", () => {
      render(
        <CalendarView
          matches={[makeMatch({ id: 1, competition: "Nationale 1" })]}
        />,
      );
      expect(screen.getByText("Nationale 1")).toBeInTheDocument();
    });

    it("renders home team logo when provided", () => {
      render(<CalendarView matches={[makeMatch({ id: 1 })]} />);
      expect(screen.getByAltText("KCVV Elewijt A logo")).toBeInTheDocument();
    });

    it("renders initial letter placeholder when home team has no logo", () => {
      render(
        <CalendarView
          matches={[
            makeMatch({ id: 1, homeTeam: { id: 99, name: "Phantom FC" } }),
          ]}
        />,
      );
      expect(screen.getByText("P")).toBeInTheDocument();
    });

    it("renders away team logo when provided", () => {
      render(
        <CalendarView
          matches={[
            makeMatch({
              id: 1,
              awayTeam: { id: 2, name: "Racing Mechelen", logo: "/racing.png" },
            }),
          ]}
        />,
      );
      expect(screen.getByAltText("Racing Mechelen logo")).toBeInTheDocument();
    });

    it("renders initial letter placeholder when away team has no logo", () => {
      render(<CalendarView matches={[makeMatch({ id: 1 })]} />);
      expect(screen.getByText("R")).toBeInTheDocument();
    });

    it("renders a link to the match detail page", () => {
      render(<CalendarView matches={[makeMatch({ id: 42 })]} />);
      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute("href", "/game/42");
    });

    it("renders the day header with the formatted date", () => {
      render(
        <CalendarView
          matches={[makeMatch({ id: 1, date: "2026-03-15T15:00:00" })]}
        />,
      );
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent?.toLowerCase()).toContain("maart");
    });

    it("renders empty state when no matches", () => {
      render(<CalendarView matches={[]} />);
      expect(
        screen.getByText("Geen wedstrijden gevonden."),
      ).toBeInTheDocument();
    });

    it("renders FilterTabs only when at least one match has a team label", () => {
      render(
        <CalendarView matches={[makeMatch({ id: 1, team: undefined })]} />,
      );
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("renders FilterTabs when matches have team labels", () => {
      render(<CalendarView matches={[makeMatch({ id: 1 })]} />);
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });
  });

  // ── StatusBadge ───────────────────────────────────────────────────────

  describe("StatusBadge", () => {
    it("renders FF badge for forfeited matches", () => {
      render(
        <CalendarView matches={[makeMatch({ id: 1, status: "forfeited" })]} />,
      );
      expect(screen.getByText("FF")).toBeInTheDocument();
    });

    it("renders Uitgesteld badge for postponed matches", () => {
      render(
        <CalendarView matches={[makeMatch({ id: 1, status: "postponed" })]} />,
      );
      expect(screen.getByText("Uitgesteld")).toBeInTheDocument();
    });

    it("renders Gestopt badge for stopped matches", () => {
      render(
        <CalendarView matches={[makeMatch({ id: 1, status: "stopped" })]} />,
      );
      expect(screen.getByText("Gestopt")).toBeInTheDocument();
    });

    it("renders no status badge for scheduled matches", () => {
      render(
        <CalendarView matches={[makeMatch({ id: 1, status: "scheduled" })]} />,
      );
      expect(screen.queryByText("FF")).not.toBeInTheDocument();
      expect(screen.queryByText("Uitgesteld")).not.toBeInTheDocument();
      expect(screen.queryByText("Gestopt")).not.toBeInTheDocument();
    });

    it("renders no status badge for finished matches", () => {
      render(
        <CalendarView
          matches={[
            makeMatch({
              id: 1,
              status: "finished",
              homeScore: 1,
              awayScore: 0,
            }),
          ]}
        />,
      );
      expect(screen.queryByText("FF")).not.toBeInTheDocument();
      expect(screen.queryByText("Uitgesteld")).not.toBeInTheDocument();
      expect(screen.queryByText("Gestopt")).not.toBeInTheDocument();
    });
  });

  // ── Date grouping ─────────────────────────────────────────────────────

  describe("date grouping", () => {
    it("groups matches by local date and sorts groups ascending", () => {
      const matches = [
        makeMatch({ id: 2, date: "2026-03-22T15:00:00", team: "A-ploeg" }),
        makeMatch({ id: 1, date: "2026-03-15T15:00:00", team: "A-ploeg" }),
      ];
      render(<CalendarView matches={matches} />);
      const headings = screen.getAllByRole("heading", { level: 2 });
      expect(headings[0].textContent?.toLowerCase()).toContain("15");
      expect(headings[1].textContent?.toLowerCase()).toContain("22");
    });

    it("groups multiple matches on the same date under one heading", () => {
      const matches = [
        makeMatch({ id: 1, date: "2026-03-15T10:00:00", team: "U15 A" }),
        makeMatch({ id: 2, date: "2026-03-15T15:00:00", team: "A-ploeg" }),
      ];
      render(<CalendarView matches={matches} />);
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
      // 2 match links + 1 scheurkalender link
      expect(screen.getAllByRole("link")).toHaveLength(3);
    });
  });

  // ── Team filtering ────────────────────────────────────────────────────

  describe("team filtering", () => {
    const matches = [
      makeMatch({ id: 1, team: "A-ploeg" }),
      makeMatch({ id: 2, team: "B-ploeg", date: "2026-03-16T15:00:00" }),
    ];

    it("shows all matches when activeTeam is 'all'", () => {
      mockSearchParams = new URLSearchParams();
      render(<CalendarView matches={matches} />);
      // 2 match links + 1 scheurkalender link
      expect(screen.getAllByRole("link")).toHaveLength(3);
    });

    it("shows only filtered matches when activeTeam is set", () => {
      mockSearchParams = new URLSearchParams("team=B-ploeg");
      render(<CalendarView matches={matches} />);
      // 1 match link + 1 scheurkalender link
      expect(screen.getAllByRole("link")).toHaveLength(2);
      expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/game/2");
    });

    it("shows empty state when filter yields no matches", () => {
      mockSearchParams = new URLSearchParams("team=U15+A");
      render(<CalendarView matches={matches} />);
      expect(
        screen.getByText("Geen wedstrijden gevonden."),
      ).toBeInTheDocument();
    });
  });

  // ── Team tab sort order ───────────────────────────────────────────────

  describe("team tab sort order", () => {
    it("puts A-ploeg and B-ploeg before youth teams regardless of insertion order", () => {
      const matches = [
        makeMatch({ id: 1, team: "U15 A" }),
        makeMatch({ id: 2, team: "B-ploeg", date: "2026-03-16T15:00:00" }),
        makeMatch({ id: 3, team: "A-ploeg", date: "2026-03-17T15:00:00" }),
      ];
      render(<CalendarView matches={matches} />);
      const tabs = screen.getAllByRole("tab");
      // tabs[0] = "Alle teams", tabs[1] = "A-ploeg", tabs[2] = "B-ploeg", tabs[3] = "U15 A"
      expect(tabs[1]).toHaveTextContent("A-ploeg");
      expect(tabs[2]).toHaveTextContent("B-ploeg");
      expect(tabs[3]).toHaveTextContent("U15 A");
    });
  });

  // ── setTeam navigation ────────────────────────────────────────────────

  describe("team filter navigation", () => {
    it("navigates to ?team=X when a team tab is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CalendarView
          matches={[
            makeMatch({ id: 1, team: "A-ploeg" }),
            makeMatch({ id: 2, team: "B-ploeg", date: "2026-03-16T15:00:00" }),
          ]}
        />,
      );
      await user.click(screen.getByRole("tab", { name: "B-ploeg" }));
      expect(mockPush).toHaveBeenCalledWith("/calendar?team=B-ploeg", {
        scroll: false,
      });
    });

    it("navigates to /calendar with no params when 'Alle teams' tab is clicked", async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams("team=A-ploeg");
      render(
        <CalendarView
          matches={[
            makeMatch({ id: 1, team: "A-ploeg" }),
            makeMatch({ id: 2, team: "B-ploeg", date: "2026-03-16T15:00:00" }),
          ]}
        />,
      );
      await user.click(screen.getByRole("tab", { name: "Alle teams" }));
      expect(mockPush).toHaveBeenCalledWith("/calendar", { scroll: false });
    });
  });
});
