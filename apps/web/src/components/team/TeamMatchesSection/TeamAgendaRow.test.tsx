/**
 * TeamAgendaRow unit tests.
 *
 * Covers:
 *  - Date stub day/month render
 *  - Score rendered for finished matches (desktop score slot)
 *  - Kickoff time rendered for upcoming matches
 *  - Outcome underline: win / draw (none) / loss box-shadow on the score
 *  - Featured (jersey-deep) vs normal card data-attribute
 *  - Mobile: home/away icon (House/Bus) visible
 *  - Long name truncation (title attribute)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamAgendaRow } from "./TeamAgendaRow";
import type { ScheduleMatch } from "@/components/match/types";

// Render Link as a plain anchor that forwards onClick (no router in tests).
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

const BASE: ScheduleMatch = {
  id: 1,
  date: new Date("2026-08-15T15:00:00.000Z"),
  time: "15:00",
  homeTeam: { id: 10, name: "KCVV Elewijt" },
  awayTeam: { id: 20, name: "FC Opponent" },
  status: "scheduled",
  competition: "3e Provinciale A",
  isHome: true,
};

const FINISHED_WIN: ScheduleMatch = {
  ...BASE,
  status: "finished",
  homeScore: 3,
  awayScore: 1,
  isHome: true,
};

const FINISHED_DRAW: ScheduleMatch = {
  ...BASE,
  status: "finished",
  homeScore: 1,
  awayScore: 1,
  isHome: true,
};

const FINISHED_LOSS: ScheduleMatch = {
  ...BASE,
  status: "finished",
  homeScore: 0,
  awayScore: 2,
  isHome: true,
};

describe("TeamAgendaRow", () => {
  describe("Date stub", () => {
    it("renders the day number", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toContain("15");
    });

    it("renders the abbreviated Dutch month", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toMatch(/aug/i);
    });

    it("renders the date stub by default", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByLabelText("15 aug")).toBeInTheDocument();
    });

    it("omits the date stub when showDateStub is false", () => {
      render(<TeamAgendaRow match={BASE} showDateStub={false} />);
      expect(screen.queryByLabelText("15 aug")).not.toBeInTheDocument();
      // the row itself still renders.
      expect(screen.getByTestId("team-agenda-row")).toBeInTheDocument();
    });
  });

  describe("Score / time", () => {
    it("shows the score for a finished match", () => {
      render(<TeamAgendaRow match={FINISHED_WIN} />);
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("3");
      expect(row.textContent).toContain("1");
    });

    it("shows the kickoff time for an upcoming match", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toContain(
        "15:00",
      );
    });
  });

  describe("upcomingLabel", () => {
    it("shows the upcoming label instead of the kickoff time for a scheduled match", () => {
      render(<TeamAgendaRow match={BASE} upcomingLabel="Gepland" />);
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("Gepland");
      expect(row.textContent).not.toContain("15:00");
    });

    it("still shows the scoreline for a finished match even when set", () => {
      render(<TeamAgendaRow match={FINISHED_WIN} upcomingLabel="Gepland" />);
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("3");
      expect(row.textContent).not.toContain("Gepland");
    });

    it("falls back to the kickoff time when no upcoming label is given", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toContain(
        "15:00",
      );
    });

    it("never shows the upcoming label for a finished match with missing scores", () => {
      render(
        <TeamAgendaRow
          match={{
            ...BASE,
            status: "finished",
            homeScore: undefined,
            awayScore: undefined,
          }}
          upcomingLabel="Gepland"
        />,
      );
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("15:00");
      expect(row.textContent).not.toContain("Gepland");
    });
  });

  describe("Outcome underline (box-shadow)", () => {
    it("applies win shadow on the score span", () => {
      const { container } = render(<TeamAgendaRow match={FINISHED_WIN} />);
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("jersey-deep");
    });

    it("applies loss shadow on the score span", () => {
      const { container } = render(<TeamAgendaRow match={FINISHED_LOSS} />);
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("color-alert");
    });

    it("applies no box-shadow for a draw", () => {
      const { container } = render(<TeamAgendaRow match={FINISHED_DRAW} />);
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBe(0);
    });
  });

  describe("Featured card", () => {
    it("sets data-featured=true when featured prop is true", () => {
      render(<TeamAgendaRow match={BASE} featured />);
      expect(
        screen.getByTestId("team-agenda-row").getAttribute("data-featured"),
      ).toBe("true");
    });

    it("sets data-featured=false by default", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(
        screen.getByTestId("team-agenda-row").getAttribute("data-featured"),
      ).toBe("false");
    });
  });

  describe("kcvvTeamId fallback for home/away resolution", () => {
    it("uses kcvvTeamId to resolve home when match.isHome is undefined", () => {
      const match: ScheduleMatch = {
        ...FINISHED_WIN,
        isHome: undefined,
        homeTeam: { id: 1235, name: "KCVV Elewijt" },
        awayTeam: { id: 99, name: "FC Opponent" },
        homeScore: 3,
        awayScore: 1,
      };
      const { container } = render(
        <TeamAgendaRow match={match} kcvvTeamId={1235} />,
      );
      // KCVV is home (id 1235 matches homeTeam.id 1235), home wins 3-1 → win shadow
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("jersey-deep");
    });

    it("uses kcvvTeamId to resolve away when match.isHome is undefined", () => {
      const match: ScheduleMatch = {
        ...FINISHED_LOSS,
        isHome: undefined,
        homeTeam: { id: 99, name: "FC Opponent" },
        awayTeam: { id: 1235, name: "KCVV Elewijt" },
        homeScore: 2,
        awayScore: 0,
      };
      const { container } = render(
        <TeamAgendaRow match={match} kcvvTeamId={1235} />,
      );
      // KCVV is away (id 1235 matches awayTeam.id? No, kcvvTeamId=1235 ≠ homeTeam.id=99 → isHome=false)
      // isHome=false + homeScore(2) > awayScore(0) → loss shadow
      const spans = container.querySelectorAll("[style*='box-shadow']");
      expect(spans.length).toBeGreaterThan(0);
      expect(spans[0]?.getAttribute("style")).toContain("color-alert");
    });
  });

  describe("Competition caption", () => {
    it("renders the competition name", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.getByTestId("team-agenda-row").textContent).toContain(
        "3e Provinciale A",
      );
    });

    it("omits the competition slot when absent", () => {
      render(<TeamAgendaRow match={{ ...BASE, competition: undefined }} />);
      expect(screen.getByTestId("team-agenda-row").textContent).not.toContain(
        "Provinciale",
      );
    });
  });

  describe("captionLabel (KCVV squad in the caption, P2)", () => {
    it("renders the caption label joined to the competition", () => {
      render(<TeamAgendaRow match={BASE} captionLabel="A-Ploeg" />);
      // Appears once per layout (desktop + mobile).
      expect(screen.getAllByText("A-Ploeg").length).toBeGreaterThan(0);
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("A-Ploeg");
      expect(row.textContent).toContain("·");
      expect(row.textContent).toContain("3e Provinciale A");
    });

    it("renders the caption label in jersey-deep on a normal row", () => {
      const { container } = render(
        <TeamAgendaRow match={BASE} captionLabel="A-Ploeg" />,
      );
      const label = container.querySelector("span.text-jersey-deep");
      expect(label).not.toBeNull();
      expect(label).toHaveTextContent("A-Ploeg");
    });

    it("renders the caption label alone when there is no competition", () => {
      render(
        <TeamAgendaRow
          match={{ ...BASE, competition: undefined }}
          captionLabel="U21"
        />,
      );
      const row = screen.getByTestId("team-agenda-row");
      expect(row.textContent).toContain("U21");
      expect(row.textContent).not.toContain("·");
    });

    it("renders only the competition when no caption label is given", () => {
      const { container } = render(<TeamAgendaRow match={BASE} />);
      expect(
        container.querySelector("span.text-jersey-deep"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("team-agenda-row").textContent).toContain(
        "3e Provinciale A",
      );
    });
  });

  describe("Long team name", () => {
    it("sets title attribute on home team in desktop layout", () => {
      const { container } = render(
        <TeamAgendaRow
          match={{
            ...BASE,
            homeTeam: { id: 10, name: "KSV Schoonbeek-Beverst A" },
          }}
        />,
      );
      const el = container.querySelector('[title="KSV Schoonbeek-Beverst A"]');
      expect(el).not.toBeNull();
    });
  });

  describe("Link to match detail", () => {
    it("wraps the row in a link to /wedstrijd/{id}", () => {
      render(<TeamAgendaRow match={{ ...BASE, id: 4242 }} />);
      expect(screen.getByRole("link").getAttribute("href")).toBe(
        "/wedstrijd/4242",
      );
    });

    it("uses the full home–away label as the link's accessible name", () => {
      render(<TeamAgendaRow match={BASE} />);
      const label = screen.getByRole("link").getAttribute("aria-label") ?? "";
      // Lock the full accessible-name contract — both teams in home→away order,
      // a space-padded dash separator, plus the date suffix (see `matchLabel`
      // in TeamAgendaRow). The `[–—-]` class tolerates en-/em-dash or hyphen
      // without locking the exact glyph, but still fails on a format change.
      expect(label).toMatch(/^KCVV Elewijt [–—-] FC Opponent, 15 aug$/);
    });
  });

  describe("Team designation (team_label)", () => {
    it("renders the opponent's team designation suffix", () => {
      render(
        <TeamAgendaRow
          match={{
            ...BASE,
            awayTeam: {
              id: 20,
              name: "Yellow Red KV Mechelen",
              teamLabel: "U23",
            },
          }}
        />,
      );
      // Appears once per layout (desktop away + mobile opponent column).
      const labels = screen.getAllByText("U23");
      expect(labels.length).toBeGreaterThan(0);
    });

    it("does not render a suffix when teamLabel is absent", () => {
      render(<TeamAgendaRow match={BASE} />);
      expect(screen.queryByText("U23")).toBeNull();
    });
  });

  describe("onNavigate", () => {
    it("fires onNavigate when the row is clicked through", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();
      render(<TeamAgendaRow match={BASE} onNavigate={onNavigate} />);
      await user.click(screen.getByTestId("team-agenda-row"));
      expect(onNavigate).toHaveBeenCalledTimes(1);
    });
  });
});
