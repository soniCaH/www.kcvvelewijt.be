/**
 * ScheurkalenderPage Component Tests
 *
 * Poster layout: calendar-year column split, Freight Big month headings with an
 * italic jersey-deep year, fixed date tab (weekday · day · kickoff), dotted
 * weekend seams, empty state.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  ScheurkalenderPage,
  type ScheurkalenderMatch,
} from "./ScheurkalenderPage";
import { SHEET_WIDTH_PX, WIDTH_FIT_SCALE } from "./poster-geometry";

// Fixtures spanning both calendar years of a season, so the column split is
// exercised. Weekends: 29–30/08, 05–06/09 (2026) | 09–10/01, 16/01 (2027).
const fixtures: ScheurkalenderMatch[] = [
  {
    id: 1,
    date: "2026-08-29",
    time: "20:00",
    opponent: "Fenixx Beigem Humbeek",
    kcvvLabel: "B",
    kcvvIsHome: true,
  },
  {
    id: 2,
    date: "2026-08-30",
    time: "15:00",
    opponent: "KSC Blankenberge",
    kcvvLabel: "A",
    kcvvIsHome: true,
  },
  {
    id: 3,
    date: "2026-09-05",
    time: "19:30",
    opponent: "KSV Rumbeke",
    kcvvLabel: "A",
    kcvvIsHome: false,
  },
  {
    id: 4,
    date: "2027-01-09",
    time: "20:00",
    opponent: "KCS Machelen",
    kcvvLabel: "B",
    kcvvIsHome: true,
  },
  {
    id: 5,
    date: "2027-01-16",
    time: "19:30",
    opponent: "Erpe-Mere United",
    kcvvLabel: "B",
    kcvvIsHome: false,
  },
];

const renderPage = (matches = fixtures, season = "’26/’27") =>
  render(<ScheurkalenderPage matches={matches} season={season} />);

describe("ScheurkalenderPage", () => {
  describe("masthead", () => {
    it("renders the season + A & B subtitle", () => {
      renderPage();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "KCVV Elewijt — Competitie ’26/’27",
      );
      expect(screen.getByText("A & B · Wedstrijdkalender")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("renders the empty message and no month headings", () => {
      renderPage([]);
      // "gevonden" is banned outside query surfaces (#2427 rule 3).
      const headings = screen.getAllByRole("heading", { level: 2 });
      // Only the tier-"surface" <EmptyState>'s own heading renders — no
      // per-month heading, since there is no fixture data to group.
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent("Geen competitiewedstrijden.");
    });
  });

  describe("calendar-year column split", () => {
    it("puts the first year left and the second right", () => {
      const { container } = renderPage();
      const columns = container.querySelectorAll(".grid-cols-2 > div");
      expect(columns).toHaveLength(2);

      const left = within(columns[0] as HTMLElement)
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent);
      const right = within(columns[1] as HTMLElement)
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent);

      expect(left).toEqual(["Augustus ’26.", "September ’26."]);
      expect(right).toEqual(["Januari ’27."]);
    });

    it("renders a single full-width column when the fixtures span one year", () => {
      const { container } = renderPage(fixtures.slice(0, 3));
      expect(container.querySelector(".grid-cols-2")).not.toBeInTheDocument();
      expect(container.querySelector(".grid-cols-1")).toBeInTheDocument();
    });

    it("splits a Sat/Sun pair that crosses a month onto both headings", () => {
      // 31/01/2026 (Sat) and 01/02/2026 (Sun) are one ISO week in two months.
      // Held together under Januari, the Sunday prints as "ZO 1" in a month
      // whose 1st is a Thursday, and Februari loses its opening fixture.
      const { container } = renderPage([
        {
          id: 9,
          date: "2026-01-31",
          time: "20:00",
          opponent: "KVK Ieper",
          kcvvLabel: "B",
          kcvvIsHome: true,
        },
        {
          id: 10,
          date: "2026-02-01",
          time: "15:00",
          opponent: "SK Laar",
          kcvvLabel: "A",
          kcvvIsHome: true,
        },
      ]);
      const headings = container.querySelectorAll("h2");
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent("Januari ’26.");
      expect(headings[1]).toHaveTextContent("Februari ’26.");
      // Each fixture sits under its own month, not merely somewhere on the page.
      const [januari, februari] = container.querySelectorAll("section");
      expect(
        within(januari as HTMLElement).getByText(/KVK Ieper/),
      ).toBeInTheDocument();
      expect(
        within(februari as HTMLElement).getByText(/SK Laar/),
      ).toBeInTheDocument();
    });

    it("keeps a Sat/Sun pair inside one month under a single heading", () => {
      // The split above must not fire on an ordinary weekend.
      const { container } = renderPage([
        {
          id: 11,
          date: "2026-01-17",
          time: "20:00",
          opponent: "KVK Ieper",
          kcvvLabel: "B",
          kcvvIsHome: true,
        },
        {
          id: 12,
          date: "2026-01-18",
          time: "15:00",
          opponent: "SK Laar",
          kcvvLabel: "A",
          kcvvIsHome: true,
        },
      ]);
      const headings = container.querySelectorAll("h2");
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent("Januari ’26.");
    });

    it("puts a lone Sunday on the 1st under its own month", () => {
      // 01/02/2026 is a Sunday, so its weekend's Saturday is 31 January. With no
      // Saturday fixture there is no pair to keep together and nothing to hint
      // that the heading is a month early.
      const { container } = renderPage([
        {
          id: 13,
          date: "2026-02-01",
          time: "15:00",
          opponent: "SK Laar",
          kcvvLabel: "A",
          kcvvIsHome: true,
        },
      ]);
      const headings = container.querySelectorAll("h2");
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent("Februari ’26.");
    });
  });

  describe("month heading", () => {
    it("renders the year as an italic jersey-deep <em> with a trailing period", () => {
      renderPage();
      const heading = screen.getByRole("heading", {
        level: 2,
        name: /Augustus/,
      });
      expect(heading).toHaveTextContent("Augustus ’26.");
      const em = heading.querySelector("em");
      expect(em).toHaveTextContent("’26");
      expect(em?.className).toContain("text-jersey-deep");
      expect(em?.className).toContain("italic");
    });

    it("carries no rule beneath it", () => {
      renderPage();
      const heading = screen.getByRole("heading", {
        level: 2,
        name: /Augustus/,
      });
      expect(heading.className).not.toContain("border-b");
    });
  });

  describe("fixture rows", () => {
    it("renders weekday, day-of-month and kickoff in one date tab", () => {
      renderPage();
      const tab = screen.getAllByText("za")[0]!.parentElement;
      expect(tab).toHaveTextContent("za2920:00");
      // Day-of-month only — the month lives in the heading, so no DD/MM here.
      expect(tab?.textContent).not.toMatch(/\d{2}\/\d{2}/);
    });

    it("keeps the date tab a fixed width when a fixture has no kickoff time", () => {
      renderPage([
        {
          id: 11,
          date: "2026-08-29",
          opponent: "SK Laar",
          kcvvLabel: "A",
          kcvvIsHome: true,
        },
      ]);
      const tab = screen.getByText("za").parentElement!;
      // Third track must stay a fixed width — an `auto` track would collapse
      // here and shift the club names left, out of line with timed rows.
      expect(tab.className).toContain("grid-cols-[17px_20px_46px]");
      expect(tab.children).toHaveLength(3);
      expect(tab.children[2]).toBeEmptyDOMElement();
    });

    it("renders no year anywhere in a fixture row", () => {
      const { container } = renderPage();
      container
        .querySelectorAll(".grid-cols-2 section > div")
        .forEach((row) => {
          expect(row.textContent).not.toMatch(/20\d{2}/);
        });
    });

    it("renders the opponent name verbatim — the BFF owns the casing (#2336)", () => {
      // Raw PSD casing must pass straight through. This page owned a local copy
      // of the re-casing rule for one release; if one creeps back, two layers
      // own it and they drift.
      renderPage([{ ...fixtures[0]!, opponent: "Ksc Blankenberge" }]);
      expect(screen.getByText("Ksc Blankenberge")).toBeInTheDocument();
    });

    it("bolds the KCVV side and leaves the opponent unbolded", () => {
      renderPage();
      // Row markup is [KCVV span][dash span][opponent span] when KCVV is home.
      const kcvvHome =
        screen.getByText(/KSC Blankenberge/).previousElementSibling
          ?.previousElementSibling;
      expect(kcvvHome).toHaveTextContent("KCVV Elewijt A");
      expect(kcvvHome?.className).toContain("font-extrabold");
      expect(screen.getByText(/KSC Blankenberge/).className).not.toContain(
        "font-extrabold",
      );
    });

    it("places KCVV on the away side when playing away", () => {
      renderPage();
      // Match 3: KCVV A away at KSV Rumbeke → opponent first, KCVV second.
      const opponent = screen.getByText(/KSV Rumbeke/);
      expect(opponent.className).not.toContain("font-extrabold");
      expect(opponent.nextElementSibling?.nextElementSibling).toHaveTextContent(
        "KCVV Elewijt A",
      );
    });

    it("renders the squad letter in jersey-deep", () => {
      const { container } = renderPage();
      const squad = container.querySelector(".text-jersey-deep:not(em)");
      expect(squad).toHaveTextContent(/^[AB]$/);
    });

    it("renders no logos or images", () => {
      const { container } = renderPage();
      expect(container.querySelectorAll("img")).toHaveLength(0);
    });
  });

  describe("weekend seams", () => {
    it("separates weekends within a month with a dotted seam, not the first one", () => {
      const { container } = renderPage();
      // Augustus has one weekend, September one → check January's two-weekend month
      // via a month with two weekends: build one explicitly.
      const augustus = container.querySelector("section");
      const weekendBlocks = augustus?.querySelectorAll(":scope > div");
      expect(weekendBlocks?.[0]?.className).not.toContain("border-t");
    });

    it("opens each subsequent weekend in a month with a dotted top border", () => {
      const { container } = renderPage([
        fixtures[3]!, // 09/01/2027
        fixtures[4]!, // 16/01/2027 — same month, next weekend
      ]);
      const blocks = container.querySelectorAll("section > div");
      expect(blocks).toHaveLength(2);
      expect(blocks[0]!.className).not.toContain("border-t");
      expect(blocks[1]!.className).toContain("border-t");
      expect(blocks[1]!.className).toContain("border-dotted");
    });
  });

  describe("chrome", () => {
    it("renders the print button", () => {
      renderPage();
      expect(
        screen.getByRole("button", { name: "Afdrukken" }),
      ).toBeInTheDocument();
    });
  });

  // The print export IS the poster artwork (#2702) — it replaces a screenshot,
  // so a silently dropped hook means a blurry poster, not a broken page. jsdom
  // applies no print styles, so these assert the wiring the stylesheet needs;
  // the geometry itself is verified by exporting a PDF (see the PR).
  describe("poster print export", () => {
    it("wraps the sheet in the scaled page area", () => {
      const { container } = renderPage();
      const page = container.querySelector(".sk-poster");
      expect(page).not.toBeNull();
      expect(page!.querySelector(".sk-poster-sheet")).not.toBeNull();
    });

    it("prints A2 with background fills kept", () => {
      const { container } = renderPage();
      const css = container.querySelector("style")?.textContent ?? "";
      // A2 as explicit dimensions — the `A2` keyword is invalid CSS and gets
      // the whole declaration dropped, so assert the rule, not the prose that
      // explains it.
      expect(css).toContain("size: 420mm 594mm");
      // Margins that leave the 340 × 567 mm poster block.
      expect(css).toContain("margin: 13.5mm 40mm");
      expect(css).toContain("print-color-adjust: exact");
    });

    it("falls back to the width fit the poster block implies", () => {
      const { container } = renderPage();
      const css = container.querySelector("style")?.textContent ?? "";
      // The fallback only bites when the measurement never runs — a path no
      // on-screen check exercises, so nothing else notices if the stylesheet
      // stops carrying it.
      expect(css).toContain(`--sk-poster-scale, ${WIDTH_FIT_SCALE}`);
      expect(css).toContain(`width: ${SHEET_WIDTH_PX}px`);
    });
  });
});
