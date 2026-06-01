/**
 * SquadGrid unit tests.
 *
 * Covers:
 *  - Auto-hides (null) when no players
 *  - Position grouping order: Doelmannen → Verdedigers → Middenvelders → Aanvallers
 *  - Trailing "Spelers" catch-all for unmapped positions (no player dropped)
 *  - Groups with no members are omitted
 *  - Every player renders a card
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PlayerVM } from "@/lib/repositories/player.repository";
import { SquadGrid } from "./SquadGrid";

function player(
  id: string,
  firstName: string,
  position: string,
  number?: number,
): PlayerVM {
  return {
    id,
    firstName,
    lastName: "Test",
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
});
