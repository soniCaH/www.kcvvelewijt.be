/**
 * StructureDirectory unit tests.
 *
 * Covers:
 *  - groupByDepartment: drops the synthetic "club" root · locked afdeling order ·
 *    folds undefined department into Algemeen · preserves incoming order · drops
 *    empty afdelingen
 *  - renders an afdeling header + position count per group
 *  - compact: caps each afdeling at initialPerDepartment until expanded
 *  - "Toon alle N →" shows the total and toggles to "Toon minder ←"
 *  - vacant positions render as real cards (no fabricated data)
 *  - returns null when there are no positions
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StructureDirectory, groupByDepartment } from "./StructureDirectory";
import type { OrgChartNode } from "@/types/organigram";

const CLUB_ROOT: OrgChartNode = {
  id: "club",
  title: "KCVV Elewijt",
  department: "algemeen",
  members: [{ id: "club", name: "KCVV Elewijt" }],
};

function position(
  id: string,
  department: OrgChartNode["department"],
  overrides: Partial<OrgChartNode> = {},
): OrgChartNode {
  return {
    id,
    title: `Functie ${id}`,
    department,
    members: [{ id: `p-${id}`, name: `Persoon ${id}` }],
    ...overrides,
  };
}

describe("groupByDepartment", () => {
  it("drops the synthetic club root node", () => {
    const groups = groupByDepartment([
      CLUB_ROOT,
      position("a", "hoofdbestuur"),
    ]);
    const allNodes = groups.flatMap((g) => g.nodes);
    expect(allNodes.find((n) => n.id === "club")).toBeUndefined();
    expect(allNodes).toHaveLength(1);
  });

  it("orders afdelingen Hoofdbestuur → Jeugdbestuur → Algemeen", () => {
    const groups = groupByDepartment([
      position("a", "algemeen"),
      position("b", "jeugdbestuur"),
      position("c", "hoofdbestuur"),
    ]);
    expect(groups.map((g) => g.label)).toEqual([
      "Hoofdbestuur",
      "Jeugdbestuur",
      "Algemeen",
    ]);
  });

  it("folds positions with no department into Algemeen", () => {
    const groups = groupByDepartment([
      position("a", undefined),
      position("b", "algemeen"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("Algemeen");
    expect(groups[0]?.nodes).toHaveLength(2);
  });

  it("preserves incoming order within an afdeling", () => {
    const groups = groupByDepartment([
      position("first", "hoofdbestuur"),
      position("second", "hoofdbestuur"),
      position("third", "hoofdbestuur"),
    ]);
    expect(groups[0]?.nodes.map((n) => n.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("drops empty afdelingen", () => {
    const groups = groupByDepartment([position("a", "jeugdbestuur")]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("Jeugdbestuur");
  });
});

describe("StructureDirectory", () => {
  it("renders an afdeling header with the position count", () => {
    render(
      <StructureDirectory
        nodes={[position("a", "hoofdbestuur"), position("b", "hoofdbestuur")]}
      />,
    );
    expect(screen.getByText("Hoofdbestuur")).toBeInTheDocument();
    expect(screen.getByText("2 functies")).toBeInTheDocument();
  });

  it("uses the singular 'functie' label for a one-position afdeling", () => {
    render(<StructureDirectory nodes={[position("a", "jeugdbestuur")]} />);
    expect(screen.getByText("1 functie")).toBeInTheDocument();
  });

  it("caps each afdeling at initialPerDepartment until expanded", async () => {
    const nodes = Array.from({ length: 6 }, (_, i) =>
      position(`h${i}`, "hoofdbestuur"),
    );
    render(<StructureDirectory nodes={nodes} initialPerDepartment={4} />);

    expect(screen.getAllByTestId("org-person-card")).toHaveLength(4);

    await userEvent.click(screen.getByRole("button", { name: /Toon alle 6/ }));
    expect(screen.getAllByTestId("org-person-card")).toHaveLength(6);
  });

  it("toggles the global control between 'Toon alle N →' and 'Toon minder ←'", async () => {
    const nodes = Array.from({ length: 5 }, (_, i) =>
      position(`h${i}`, "hoofdbestuur"),
    );
    render(<StructureDirectory nodes={nodes} initialPerDepartment={4} />);

    const toggle = screen.getByRole("button", { name: /Toon alle 5/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    const collapse = screen.getByRole("button", { name: /Toon minder/ });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
  });

  it("does not render the toggle when nothing is hidden", () => {
    render(
      <StructureDirectory
        nodes={[position("a", "hoofdbestuur")]}
        initialPerDepartment={4}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders vacant positions as real cards", () => {
    render(
      <StructureDirectory
        nodes={[position("vac", "hoofdbestuur", { members: [] })]}
      />,
    );
    const card = screen.getByTestId("org-person-card");
    expect(card).toHaveAttribute("data-card-state", "vacant");
    expect(screen.getByText("deze plek is vrij")).toBeInTheDocument();
  });

  it("returns null when there are no positions (only the club root)", () => {
    const { container } = render(<StructureDirectory nodes={[CLUB_ROOT]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
