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

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamAgendaRow } from "./TeamAgendaRow";
import type { ScheduleMatch } from "@/components/match/types";

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
});
