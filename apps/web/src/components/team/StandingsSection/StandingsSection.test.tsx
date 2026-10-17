/**
 * StandingsSection unit tests.
 *
 * Covers:
 *  - Renders one table per official competition, in feed order
 *  - Caption prefers Sanity's `divisionFull` over the provider's name
 *  - Caption falls through to the provider's name when Sanity carries none
 *  - Renders a present-tense note (never a bare `null`) when no table has
 *    published rows yet (#2605/#2636 — the section keeps its seam and nav
 *    entry instead of erasing itself)
 *  - Renders every table as a plain club list, position and numeric columns
 *    dropped, when every row reads played 0 / points 0
 *  - Every table gets the KCVV highlight, not just the first
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { RankingEntry, RankingTable } from "@kcvv/api-contract";
import { StandingsSection } from "./StandingsSection";

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

function table(overrides: Partial<RankingTable> = {}): RankingTable {
  return {
    competition_id: 222464,
    competition_name: "3de Afdeling Voetb Vl A",
    entries: [
      entry({ position: 1, team_id: 1, team_name: "Leader FC", points: 30 }),
      entry({
        position: 2,
        team_id: 1235,
        club_id: 1235,
        team_name: "KCVV Elewijt",
      }),
    ],
    ...overrides,
  } as RankingTable;
}

const AUTUMN = table();
const SPRING = table({
  competition_id: 217486,
  competition_name: "Gewestelijk U13 BJ",
});

describe("StandingsSection", () => {
  it("renders one table per competition, in feed order", () => {
    render(<StandingsSection tables={[AUTUMN, SPRING]} />);

    const tables = screen.getAllByTestId("standings-table");
    expect(tables).toHaveLength(2);
    expect(screen.getByText("3de Afdeling Voetb Vl A")).toBeInTheDocument();
    expect(screen.getByText("Gewestelijk U13 BJ")).toBeInTheDocument();
  });

  it("prefers the editorial division name over the provider's", () => {
    render(
      <StandingsSection tables={[AUTUMN]} divisionFull="3e Nationale VV A" />,
    );

    expect(screen.getByText("3e Nationale VV A")).toBeInTheDocument();
    expect(
      screen.queryByText("3de Afdeling Voetb Vl A"),
    ).not.toBeInTheDocument();
  });

  it("falls through to the provider's name when Sanity carries none", () => {
    render(<StandingsSection tables={[AUTUMN]} divisionFull={null} />);

    expect(screen.getByText("3de Afdeling Voetb Vl A")).toBeInTheDocument();
  });

  it("renders a present-tense note, not nothing, when the team publishes no table", () => {
    // #2605: never a bare `null` — the section keeps its seam and nav entry,
    // and the copy is present tense, never a promise ("nog niet").
    render(<StandingsSection tables={[]} />);

    expect(
      screen.getByText("Voor deze reeks is er geen klassement."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("standings-table")).not.toBeInTheDocument();
  });

  it("renders the same note when every published table is still rowless", () => {
    // The contract permits a published-but-empty reeks. Counting tables
    // rather than rows would show the note around real rows elsewhere.
    render(<StandingsSection tables={[table({ entries: [] })]} />);

    expect(
      screen.getByText("Voor deze reeks is er geen klassement."),
    ).toBeInTheDocument();
  });

  it("renders every entry as a plain club list when every row is numberless", () => {
    const numberless = table({
      entries: [
        entry({ team_id: 1, team_name: "Leader FC", played: 0, points: 0 }),
        entry({
          team_id: 1235,
          team_name: "KCVV Elewijt",
          played: 0,
          points: 0,
        }),
      ],
    });
    render(<StandingsSection tables={[numberless]} />);

    const list = screen.getByTestId("standings-table");
    expect(list).toHaveAttribute("data-variant", "numberless");
    expect(screen.getByText("Leader FC")).toBeInTheDocument();
    expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
    // No numeric columns: `#`/`M`/`W`/`G`/`V`/`+/-`/`Ptn` headers are gone.
    expect(screen.queryAllByRole("columnheader")).toHaveLength(0);
  });

  it("renders a full table (not a list) when at least one row carries real numbers", () => {
    render(<StandingsSection tables={[AUTUMN]} />);

    const rendered = screen.getByTestId("standings-table");
    expect(rendered).not.toHaveAttribute("data-variant", "numberless");
  });

  it("highlights the KCVV row in every table, not just the first", () => {
    render(
      <StandingsSection tables={[AUTUMN, SPRING]} highlightClubId={1235} />,
    );

    expect(screen.getAllByTestId("standings-kcvv-row")).toHaveLength(2);
  });

  it("classifies mixed tables independently: a live poule next to an unplayed one (#2636 finding 4)", () => {
    // The winter-break shape: a finished, fully-scored autumn poule sitting
    // beside a spring poule that has not kicked off. The block-level verdict
    // is "live" (AUTUMN has real points), but the spring table must still
    // render as a club list, not a table of position-0 zeroes.
    const springUnplayed = table({
      competition_id: 221298,
      competition_name: "Gewestelijk U13 AY",
      entries: [
        entry({ team_id: 1, team_name: "FC Mollem", played: 0, points: 0 }),
        entry({
          team_id: 1235,
          team_name: "KCVV Elewijt",
          played: 0,
          points: 0,
        }),
      ],
    });

    render(<StandingsSection tables={[AUTUMN, springUnplayed]} />);

    const rendered = screen.getAllByTestId("standings-table");
    expect(rendered).toHaveLength(2);
    expect(rendered[0]).not.toHaveAttribute("data-variant", "numberless");
    expect(rendered[1]).toHaveAttribute("data-variant", "numberless");
  });
});
