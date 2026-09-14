/**
 * StandingsTable unit tests.
 *
 * Covers:
 *  - Auto-hides (renders null) when entries is empty
 *  - Renders all columns: # · Ploeg · M · W · G · V · +/- · Ptn
 *  - KCVV row highlight: data-testid + non-italic bold name
 *  - Non-KCVV rows: no highlight testid
 *  - Goal difference formatting (+N for positive)
 *  - No Vorm column, no green/yellow/red badges
 *  - Numberless entries (played 0 / points 0, #2605): no columns at all,
 *    just crest + name — derived from `entries` itself, not a caller-set
 *    prop (#2636 finding 9)
 *  - Anchoring: #, Ploeg and Ptn are pinned on the cell itself, not by
 *    position (#2582 review M1)
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { RankingEntry } from "@kcvv/api-contract";
import { StandingsTable } from "./StandingsTable";
import { stubAnimationFrame } from "@/../tests/helpers/scroll-hint.helpers";

function entry(overrides: Partial<RankingEntry> = {}): RankingEntry {
  return {
    position: 1,
    team_id: 1,
    team_name: "FC Test",
    played: 10,
    won: 6,
    drawn: 2,
    lost: 2,
    goals_for: 20,
    goals_against: 10,
    goal_difference: 10,
    points: 20,
    ...overrides,
  } as RankingEntry;
}

const DIVISION: RankingEntry[] = [
  entry({ position: 1, team_id: 1, team_name: "Leader FC", points: 30 }),
  entry({
    position: 2,
    team_id: 1235,
    team_name: "KCVV Elewijt",
    points: 24,
    goal_difference: 5,
  }),
  entry({
    position: 3,
    team_id: 3,
    team_name: "Third Town",
    points: 22,
    goal_difference: -3,
  }),
];

const NUMBERLESS_DIVISION: RankingEntry[] = [
  entry({
    position: 0,
    team_id: 1,
    team_name: "Leader FC",
    played: 0,
    points: 0,
    goal_difference: 0,
  }),
  entry({
    position: 0,
    team_id: 1235,
    team_name: "KCVV Elewijt",
    played: 0,
    points: 0,
    goal_difference: 0,
  }),
];

function mockScrollDimensions(scrollWidth: number, clientWidth: number) {
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    value: scrollWidth,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    value: clientWidth,
  });
}

describe("StandingsTable", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (HTMLElement.prototype as any).scrollWidth;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (HTMLElement.prototype as any).clientWidth;
  });

  it("renders null when entries is empty", () => {
    const { container } = render(<StandingsTable entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the standard column headers", () => {
    render(<StandingsTable entries={DIVISION} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual(["#", "Ploeg", "M", "W", "G", "V", "+/-", "Ptn"]);
  });

  it("highlights the KCVV row when highlightTeamId matches", () => {
    render(<StandingsTable entries={DIVISION} highlightTeamId={1235} />);
    const kcvvRow = screen.getByTestId("standings-kcvv-row");
    expect(kcvvRow).toBeInTheDocument();
    expect(kcvvRow.textContent).toContain("KCVV Elewijt");
  });

  it("renders the KCVV team name non-italic + bold", () => {
    render(<StandingsTable entries={DIVISION} highlightTeamId={1235} />);
    const kcvvRow = screen.getByTestId("standings-kcvv-row");
    const nameSpan = kcvvRow.querySelector('[title="KCVV Elewijt"]');
    expect(nameSpan?.className).toContain("not-italic");
    expect(nameSpan?.className).toContain("font-semibold");
  });

  it("does not highlight any row when highlightTeamId is absent", () => {
    render(<StandingsTable entries={DIVISION} />);
    expect(screen.queryByTestId("standings-kcvv-row")).toBeNull();
  });

  it("puts the overflow floor on the Ploeg column, not the name leaf (review M4)", () => {
    // The floor forces the TABLE to overflow at narrow widths — it has
    // nothing to do with truncation, which is what min-w-0 on the leaf
    // itself already provides (the canonical way to make `truncate` work
    // inside a flex row). Asserting the exact tokens, not a regex that
    // would equally match the 112px value already proven insufficient.
    render(<StandingsTable entries={DIVISION} />);
    const headers = screen.getAllByRole("columnheader");
    const ploeg = headers.find((h) => h.textContent === "Ploeg");
    expect(ploeg).toHaveClass("min-w-44");

    const nameSpan = screen.getByTitle("Leader FC");
    expect(nameSpan).toHaveClass("min-w-0");
  });

  it("does not highlight a non-matching team", () => {
    render(<StandingsTable entries={DIVISION} highlightTeamId={9999} />);
    expect(screen.queryByTestId("standings-kcvv-row")).toBeNull();
  });

  it("formats positive goal difference with a leading +", () => {
    render(<StandingsTable entries={DIVISION} highlightTeamId={1235} />);
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("renders negative goal difference without a + prefix", () => {
    render(<StandingsTable entries={DIVISION} />);
    expect(screen.getByText("-3")).toBeInTheDocument();
  });

  it("never hides W/G/V behind a responsive class — scrolling answers overflow, not hiding (#2582)", () => {
    render(<StandingsTable entries={DIVISION} />);
    const headers = screen.getAllByRole("columnheader");
    for (const label of ["W", "G", "V"]) {
      const header = headers.find((h) => h.textContent === label);
      expect(header?.className).not.toContain("hidden");
      expect(header?.className).not.toContain("sm:table-cell");
    }
  });

  it("does not render a Vorm/form column", () => {
    render(<StandingsTable entries={DIVISION} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent?.toLowerCase());
    expect(headers).not.toContain("vorm");
    expect(headers).not.toContain("form");
  });

  it("renders a plain club list (no columns) when every entry is played 0 / points 0", () => {
    render(
      <StandingsTable
        entries={NUMBERLESS_DIVISION}
        highlightTeamId={1235}
        caption="3de Afdeling Voetb Vl A"
      />,
    );

    expect(screen.queryAllByRole("columnheader")).toHaveLength(0);
    expect(screen.getByTestId("standings-table")).toHaveAttribute(
      "data-variant",
      "numberless",
    );
    expect(screen.getByText("Leader FC")).toBeInTheDocument();
    expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
    expect(screen.getByText("3de Afdeling Voetb Vl A")).toBeInTheDocument();
  });

  it("still highlights the KCVV row when numberless", () => {
    render(
      <StandingsTable entries={NUMBERLESS_DIVISION} highlightTeamId={1235} />,
    );

    const kcvvRow = screen.getByTestId("standings-kcvv-row");
    expect(kcvvRow.textContent).toContain("KCVV Elewijt");
  });

  it("renders the full table (not a list) as soon as one entry carries real numbers", () => {
    // Guards against a caller ever being able to force the list render on
    // real data — there is no prop left to do that with (#2636 finding 9).
    const mixed = [
      ...NUMBERLESS_DIVISION,
      entry({ team_id: 999, team_name: "FC Perk", played: 4, points: 9 }),
    ];
    render(<StandingsTable entries={mixed} />);

    expect(screen.getByTestId("standings-table")).not.toHaveAttribute(
      "data-variant",
      "numberless",
    );
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
  });

  describe("scroll arrow — control register, no reserved rail (#2444/#2476)", () => {
    it("makes the scroll region keyboard-reachable (tabIndex=0)", () => {
      render(<StandingsTable entries={DIVISION} />);
      const region = screen.getByRole("region");
      expect(region.getAttribute("tabindex")).toBe("0");
    });

    it("mounts no arrow when the table fits", () => {
      mockScrollDimensions(500, 500);
      render(<StandingsTable entries={DIVISION} />);
      expect(screen.queryByLabelText("Scroll right")).not.toBeInTheDocument();
    });

    it("mounts a control-register right arrow, overlaying with no reserved rail, on real overflow", () => {
      mockScrollDimensions(900, 500);
      render(<StandingsTable entries={DIVISION} />);

      const arrow = screen.getByLabelText("Scroll right");
      expect(arrow).toBeInTheDocument();
      expect(arrow).toHaveClass("bg-jersey-deep");
      expect(arrow).toHaveClass("h-8");

      const region = screen.getByRole("region");
      expect(region.className).not.toContain("pl-10");
      expect(region.className).not.toContain("pr-10");
    });

    it("caps the edge fade at 24px, shrinking as the scroll runs out", () => {
      mockScrollDimensions(900, 500);
      const { container } = render(<StandingsTable entries={DIVISION} />);

      let fade = container.querySelector(".bg-gradient-to-l") as HTMLElement;
      expect(fade.style.width).toBe("24px");

      const region = screen.getByRole("region");
      const { flush } = stubAnimationFrame();
      // 400px total overflow; scrolled to 385 leaves 15px.
      Object.defineProperty(region, "scrollLeft", { value: 385 });
      act(() => {
        region.dispatchEvent(new Event("scroll"));
      });
      act(() => {
        flush();
      });

      fade = container.querySelector(".bg-gradient-to-l") as HTMLElement;
      expect(fade.style.width).toBe("15px");
    });
  });

  describe("anchoring — on the cell that is the anchor, not by position (#2476 rule 3 / review M1)", () => {
    it("pins #, Ploeg and Ptn unconditionally — sticky is inert without a scroll, so there is nothing to gate", () => {
      render(<StandingsTable entries={DIVISION} />);
      const headers = screen.getAllByRole("columnheader");
      const byLabel = (label: string) =>
        headers.find((h) => h.textContent === label)!;

      expect(byLabel("#")).toHaveClass("sticky", "left-0", "w-12");
      expect(byLabel("Ploeg")).toHaveClass("sticky", "left-12");
      expect(byLabel("Ptn")).toHaveClass("sticky", "right-0", "w-14");
      for (const label of ["M", "W", "G", "V", "+/-"]) {
        expect(byLabel(label)).not.toHaveClass("sticky");
      }
    });

    it("gives the KCVV row's pinned cells its own tint, never a flat bg-cream (review finding 2)", () => {
      render(<StandingsTable entries={DIVISION} highlightTeamId={1235} />);
      const kcvvRow = screen.getByTestId("standings-kcvv-row");
      const pinnedCells = kcvvRow.querySelectorAll("td.sticky");
      expect(pinnedCells).toHaveLength(3); // #, Ploeg, Ptn

      const otherRow = screen.getByText("Leader FC").closest("tr")!;
      const otherPinnedCells = otherRow.querySelectorAll("td.sticky");

      for (const cell of pinnedCells) {
        expect(cell.className).toContain("bg-[color-mix");
        expect(cell.className).not.toContain("bg-cream");
      }
      for (const cell of otherPinnedCells) {
        expect(cell.className).toContain("bg-cream");
        expect(cell.className).not.toContain("bg-[color-mix");
      }
    });

    it("does not show a divider shadow at the anchor edge when the table fits", () => {
      mockScrollDimensions(500, 500);
      render(<StandingsTable entries={DIVISION} />);
      const region = screen.getByRole("region");
      expect(region.className).not.toContain("shadow-[2px_0_4px");
      expect(region.className).not.toContain("shadow-[-2px_0_4px");
    });

    it("shows the divider shadow and insets the arrow/fade past the pinned Ptn column once the table overflows (review finding 3)", () => {
      mockScrollDimensions(900, 500);
      render(<StandingsTable entries={DIVISION} />);
      const region = screen.getByRole("region");
      expect(region.className).toContain("shadow-[2px_0_4px");
      expect(region.className).toContain("shadow-[-2px_0_4px");

      const arrow = screen.getByLabelText("Scroll right");
      expect(arrow).toHaveClass("right-14");
      expect(arrow).not.toHaveClass("right-0");
    });
  });
});
