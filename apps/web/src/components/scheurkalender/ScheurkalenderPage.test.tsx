/**
 * ScheurkalenderPage Component Tests
 *
 * Treatment A (#2137): weekend grouping, inline A/B + bold KCVV side,
 * no-year date, single weekend rule (no boundary doubling), empty state.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ScheurkalenderPage,
  type ScheurkalenderMatch,
} from "./ScheurkalenderPage";

// Real fixtures (subset of the locked mock). Three weekends (ISO weeks):
//   wk 35: za 30/08 + zo 31/08   wk 36: zo 07/09   wk 37: za 13/09
const fixtures: ScheurkalenderMatch[] = [
  {
    id: 1,
    date: "2025-08-30",
    time: "20:00",
    opponent: "Fc Zemst Sportief",
    kcvvLabel: "B",
    kcvvIsHome: true,
  },
  {
    id: 2,
    date: "2025-08-31",
    time: "15:00",
    opponent: "Sc City Pirates Antwerpen",
    kcvvLabel: "A",
    kcvvIsHome: true,
  },
  {
    id: 3,
    date: "2025-09-07",
    time: "20:00",
    opponent: "As Verbroedering Geel",
    kcvvLabel: "A",
    kcvvIsHome: false,
  },
  {
    id: 4,
    date: "2025-09-13",
    time: "14:30",
    opponent: "Peutie Fc",
    kcvvLabel: "B",
    kcvvIsHome: false,
  },
];

describe("ScheurkalenderPage", () => {
  describe("masthead", () => {
    it("renders the season + A & B subtitle", () => {
      render(<ScheurkalenderPage matches={fixtures} season="25/26" />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "KCVV Elewijt — Competitie 25/26",
      );
      expect(screen.getByText("A & B · Wedstrijdkalender")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("renders the empty message and no table when there are no fixtures", () => {
      render(<ScheurkalenderPage matches={[]} season="25/26" />);
      expect(
        screen.getByText("Geen competitiewedstrijden gevonden."),
      ).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  describe("weekend grouping", () => {
    it("buckets fixtures per weekend (ISO week) into separate <tbody>s", () => {
      const { container } = render(
        <ScheurkalenderPage matches={fixtures} season="25/26" />,
      );
      const tbodies = container.querySelectorAll("tbody");
      expect(tbodies).toHaveLength(3);
      expect(tbodies[0].querySelectorAll("tr")).toHaveLength(2); // 30+31 Aug
      expect(tbodies[1].querySelectorAll("tr")).toHaveLength(1); // 7 Sep
      expect(tbodies[2].querySelectorAll("tr")).toHaveLength(1); // 13 Sep
    });

    it("renders a single 2px rule between weekends with no hairline doubling", () => {
      const { container } = render(
        <ScheurkalenderPage matches={fixtures} season="25/26" />,
      );
      const tbodies = container.querySelectorAll("tbody");

      // First weekend's first row has no top rule (no doubling at the very top).
      const firstWeekendRows = tbodies[0].querySelectorAll("tr");
      firstWeekendRows[0]
        .querySelectorAll("td")
        .forEach((td) => expect(td.className).not.toContain("border-t-2"));

      // Last row of a weekend drops its bottom hairline (no doubling at the seam).
      firstWeekendRows[firstWeekendRows.length - 1]
        .querySelectorAll("td")
        .forEach((td) => expect(td.className).not.toContain("border-b"));

      // Each subsequent weekend opens with the single 2px ink rule.
      tbodies[1]
        .querySelectorAll("tr")[0]
        .querySelectorAll("td")
        .forEach((td) => expect(td.className).toContain("border-t-2"));
    });
  });

  describe("rows", () => {
    it("formats dates as Dutch weekday + DD/MM with no year", () => {
      const { container } = render(
        <ScheurkalenderPage matches={fixtures} season="25/26" />,
      );
      expect(screen.getByText("za 30/08")).toBeInTheDocument();
      expect(screen.getByText("zo 31/08")).toBeInTheDocument();
      expect(screen.getByText("zo 07/09")).toBeInTheDocument();
      expect(screen.getByText("za 13/09")).toBeInTheDocument();
      // No 4-digit year anywhere in the fixture table.
      const table = container.querySelector("table");
      expect(table?.textContent).not.toMatch(/20\d{2}/);
    });

    it("renders kickoff times", () => {
      render(<ScheurkalenderPage matches={fixtures} season="25/26" />);
      expect(screen.getAllByText("20:00")).toHaveLength(2); // ids 1 & 3
      expect(screen.getByText("14:30")).toBeInTheDocument();
    });

    it("renders the KCVV squad inline (A/B) from the queried team", () => {
      render(<ScheurkalenderPage matches={fixtures} season="25/26" />);
      expect(screen.getAllByText("KCVV Elewijt A")).toHaveLength(2);
      expect(screen.getAllByText("KCVV Elewijt B")).toHaveLength(2);
    });

    it("bolds the KCVV side and leaves the opponent unbolded", () => {
      render(<ScheurkalenderPage matches={fixtures} season="25/26" />);
      screen
        .getAllByText(/^KCVV Elewijt [AB]$/)
        .forEach((cell) => expect(cell.className).toContain("font-extrabold"));
      expect(screen.getByText("Fc Zemst Sportief").className).not.toContain(
        "font-extrabold",
      );
      expect(screen.getByText("As Verbroedering Geel").className).not.toContain(
        "font-extrabold",
      );
    });

    it("places KCVV in the home column when home, away column when away", () => {
      const { container } = render(
        <ScheurkalenderPage matches={fixtures} season="25/26" />,
      );
      const rows = container.querySelectorAll("tbody tr");
      // Match 1: KCVV B home → home cell (3rd <td>) is the KCVV cell.
      expect(rows[0].querySelectorAll("td")[2]).toHaveTextContent(
        "KCVV Elewijt B",
      );
      // Match 3 (weekend 2, first row): KCVV A away → away cell (4th <td>).
      expect(rows[2].querySelectorAll("td")[3]).toHaveTextContent(
        "KCVV Elewijt A",
      );
    });

    it("renders no logos, squad pills, or scores", () => {
      const { container } = render(
        <ScheurkalenderPage matches={fixtures} season="25/26" />,
      );
      expect(container.querySelectorAll("img")).toHaveLength(0);
    });
  });

  describe("chrome", () => {
    it("renders the print button", () => {
      render(<ScheurkalenderPage matches={fixtures} season="25/26" />);
      expect(
        screen.getByRole("button", { name: "Afdrukken" }),
      ).toBeInTheDocument();
    });
  });
});
