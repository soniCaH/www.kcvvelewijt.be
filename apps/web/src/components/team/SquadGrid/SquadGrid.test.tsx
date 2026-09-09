/**
 * SquadGrid unit tests.
 *
 * Covers:
 *  - Auto-hides (null) when no players
 *  - Position grouping order: Doelmannen → Verdedigers → Middenvelders → Aanvallers
 *  - Trailing "Spelers" catch-all for unmapped positions (no player dropped)
 *  - Groups with no members are omitted
 *  - Every player renders a card
 *  - Single-group gate (#2638): a lone catch-all renders no heading; a lone
 *    REAL position bucket keeps its heading; two or more groups always do
 *  - Within-group order (#2894): jerseyNumber ascending, falling back to a
 *    locale-aware lastName collation; numbered before unnumbered; applies to
 *    the catch-all "Spelers" group too
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PlayerVM } from "@/lib/repositories/player.repository";
import { SquadGrid } from "./SquadGrid";

function player(
  id: string,
  firstName: string,
  position: string | undefined,
  number?: number,
  lastName = "Test",
): PlayerVM {
  return {
    id,
    firstName,
    lastName,
    position,
    number,
    href: `/spelers/${id}`,
  };
}

const SQUAD: PlayerVM[] = [
  player("1", "Jonas", "Keeper", 1),
  player("2", "Bram", "Verdediger", 2),
  player("3", "Senne", "Verdediger", 3),
  player("4", "Yanni", "Middenvelder", 6),
  player("5", "Maxim", "Aanvaller", 9),
  player("6", "Jeugd", "Speler", 14),
];

describe("SquadGrid", () => {
  it("renders null when there are no players", () => {
    const { container } = render(<SquadGrid players={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders position groups in canonical order", () => {
    render(<SquadGrid players={SQUAD} />);
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual([
      "Doelmannen",
      "Verdedigers",
      "Middenvelders",
      "Aanvallers",
      "Spelers",
    ]);
  });

  it("places unmapped positions in the trailing Spelers group", () => {
    render(<SquadGrid players={SQUAD} />);
    const spelersSection = screen.getByRole("region", { name: "Spelers" });
    expect(spelersSection.textContent).toContain("Jeugd");
  });

  it("omits groups that have no members", () => {
    render(<SquadGrid players={[player("1", "Jonas", "Keeper", 1)]} />);
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual(["Doelmannen"]);
  });

  it("renders a card for every player", () => {
    render(<SquadGrid players={SQUAD} />);
    expect(screen.getAllByTestId("player-card")).toHaveLength(SQUAD.length);
  });

  it("places an unauthored (undefined) position in the trailing Spelers group too (#2567)", () => {
    render(
      <SquadGrid
        players={[
          player("1", "Jonas", "Keeper", 1),
          player("7", "Onbekend", undefined, 21),
        ]}
      />,
    );
    const spelersSection = screen.getByRole("region", { name: "Spelers" });
    expect(spelersSection.textContent).toContain("Onbekend");
  });

  it("renders no heading when the single group is the catch-all (#2638)", () => {
    // No player's position is known — every player lands in the one
    // trailing "Spelers" catch-all, exactly the U9 shape the gate exists
    // for. The region itself still carries the label as its accessible
    // name; only the visible <h3> heading disappears.
    render(
      <SquadGrid
        players={[
          player("1", "Onbekend Een", undefined, 1),
          player("2", "Onbekend Twee", undefined, 2),
        ]}
      />,
    );
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    expect(screen.getByRole("region", { name: "Spelers" })).toBeInTheDocument();
  });

  it("keeps the heading when the single group is a real position bucket, not the catch-all (#2638)", () => {
    // A squad that is, today, entirely keepers is still a true
    // classification — "Doelmannen" separates this group from nothing only
    // by accident of today's data, not because the label is meaningless
    // the way an all-unknown "Spelers" run is. The gate must not hide this
    // just because it happens to be the only group.
    render(
      <SquadGrid
        players={[
          player("1", "Jonas", "Keeper", 1),
          player("2", "Lars", "Keeper", 16),
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Doelmannen" }),
    ).toBeInTheDocument();
  });

  it("still renders headings when the partition yields two or more groups (#2638)", () => {
    render(
      <SquadGrid
        players={[
          player("1", "Jonas", "Keeper", 1),
          player("7", "Onbekend", undefined, 21),
        ]}
      />,
    );
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual(["Doelmannen", "Spelers"]);
  });

  describe("Within-group order (#2894)", () => {
    /** The numbers rendered by the "Doelmannen" region's cards, in DOM order. */
    function numbersIn(regionName: string): string[] {
      const region = screen.getByRole("region", { name: regionName });
      return Array.from(
        region.querySelectorAll('[data-testid="player-card-number"]'),
      ).map((el) => el.textContent ?? "");
    }

    /** The last names rendered by a region's cards, in DOM order. */
    function lastNamesIn(regionName: string): string[] {
      const region = screen.getByRole("region", { name: regionName });
      return Array.from(region.querySelectorAll("em")).map(
        (el) => el.textContent ?? "",
      );
    }

    it("orders an all-numbered group by jerseyNumber ascending", () => {
      render(
        <SquadGrid
          players={[
            player("1", "Senne", "Verdediger", 9),
            player("2", "Bram", "Verdediger", 2),
            player("3", "Yanni", "Verdediger", 5),
          ]}
        />,
      );
      expect(numbersIn("Verdedigers")).toEqual(["2", "5", "9"]);
    });

    it("falls back to lastName when two players share the same jerseyNumber", () => {
      // Real shape (review, PR #2897): a mid-season departure and arrival
      // both wearing 7, or a youth squad reusing a number — `players[]` is
      // read-only, so nobody can resolve this by re-numbering. A shared
      // number must not silently fall through to PSD's incoming order.
      render(
        <SquadGrid
          players={[
            player("1", "A", "Verdediger", 7, "Wouters"),
            player("2", "B", "Verdediger", 7, "Aerts"),
          ]}
        />,
      );
      expect(lastNamesIn("Verdedigers")).toEqual(["Aerts", "Wouters"]);
    });

    it("falls back to a locale-aware lastName collation when no player has a number", () => {
      render(
        <SquadGrid
          players={[
            player("1", "A", "Aanvaller", undefined, "Van Hóf"),
            player("2", "B", "Aanvaller", undefined, "Van Hog"),
            player("3", "C", "Aanvaller", undefined, "Van Hoe"),
          ]}
        />,
      );
      // A discriminating fixture: `Intl.Collator("nl")` and a bare `<`
      // disagree on this trio. Collated: Hoe, Hóf, Hog (diacritic is a
      // tiebreak on an otherwise-equal base letter, so "ó" sorts next to
      // its own "o", ahead of the different base letter "g"). A bare `<`
      // would instead give Hoe, Hog, Hóf — code-point order puts every
      // accented character after every unaccented one. A fixture where the
      // two agree (e.g. "Van Hof" vs "Van Hóf") would pass even without
      // the collator and prove nothing about locale-awareness.
      expect(lastNamesIn("Aanvallers")).toEqual([
        "Van Hoe",
        "Van Hóf",
        "Van Hog",
      ]);
    });

    it("sorts numbered players before unnumbered ones in a mixed group", () => {
      render(
        <SquadGrid
          players={[
            player("1", "A", "Middenvelder", undefined, "Aerts"),
            player("2", "B", "Middenvelder", 7),
            player("3", "C", "Middenvelder", undefined, "Bosmans"),
            player("4", "D", "Middenvelder", 3),
          ]}
        />,
      );
      const region = screen.getByRole("region", { name: "Middenvelders" });
      const cards = Array.from(
        region.querySelectorAll('[data-testid="player-card"]'),
      );
      // Numbered (3, 7) first in ascending order, then unnumbered
      // (Aerts, Bosmans) in last-name order.
      expect(
        cards.map(
          (c) =>
            c.querySelector('[data-testid="player-card-number"]')
              ?.textContent ?? c.querySelector("em")?.textContent,
        ),
      ).toEqual(["3", "7", "Aerts", "Bosmans"]);
    });

    it("applies the same order to the trailing catch-all Spelers group", () => {
      render(
        <SquadGrid
          players={[
            player("1", "A", undefined, undefined, "Wouters"),
            player("2", "B", undefined, 4),
            player("3", "C", undefined, undefined, "Aerts"),
            player("4", "D", undefined, 1),
          ]}
        />,
      );
      const region = screen.getByRole("region", { name: "Spelers" });
      const cards = Array.from(
        region.querySelectorAll('[data-testid="player-card"]'),
      );
      expect(
        cards.map(
          (c) =>
            c.querySelector('[data-testid="player-card-number"]')
              ?.textContent ?? c.querySelector("em")?.textContent,
        ),
      ).toEqual(["1", "4", "Aerts", "Wouters"]);
    });

    it("renders both players when two unnumbered players share a last name, without crashing or dropping one", () => {
      // Neither a number nor a lastName difference to order by. The AC
      // asks only that this tie be covered by a test, not that it define a
      // tertiary order (e.g. firstName) — so this asserts only what the
      // comparator actually guarantees: no crash, no dropped player.
      // Asserting a specific order here would encode `Array.prototype.sort`
      // stability (i.e. the fixture's own input order) as if it were part
      // of the spec, and it would start failing the moment a tiebreak is
      // added.
      render(
        <SquadGrid
          players={[
            player("1", "Wouter", "Keeper", undefined, "Peeters"),
            player("2", "Monique", "Keeper", undefined, "Peeters"),
          ]}
        />,
      );
      const region = screen.getByRole("region", { name: "Doelmannen" });
      const firstNames = Array.from(
        region.querySelectorAll('[data-testid="player-card"]'),
      ).map((c) => c.querySelector(".font-semibold")?.textContent);
      expect(firstNames).toHaveLength(2);
      expect(new Set(firstNames)).toEqual(new Set(["Wouter", "Monique"]));
    });

    it("keeps group order unchanged: keepers → defenders → midfield → attackers → catch-all", () => {
      render(
        <SquadGrid
          players={[
            player("1", "A", "Aanvaller", 9),
            player("2", "B", undefined, 1, "Aerts"),
            player("3", "C", "Keeper", 1),
            player("4", "D", "Verdediger", 4),
            player("5", "E", "Middenvelder", 8),
          ]}
        />,
      );
      const headings = screen
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent);
      expect(headings).toEqual([
        "Doelmannen",
        "Verdedigers",
        "Middenvelders",
        "Aanvallers",
        "Spelers",
      ]);
    });
  });
});
