import { describe, it, expect } from "vitest";
import { deriveStructureIndex } from "./structure-index";
import type { OrgChartNode } from "@/types/organigram";

const nodes: OrgChartNode[] = [
  {
    id: "voorzitter",
    title: "Voorzitter",
    department: "hoofdbestuur",
    members: [{ id: "p1", name: "Jan" }],
  },
  {
    id: "secretaris",
    title: "Secretaris",
    department: "hoofdbestuur",
    members: [{ id: "p2", name: "Inge" }],
  },
  {
    id: "jeugd",
    title: "Jeugdcoördinator",
    department: "jeugdbestuur",
    // p1 co-holds a second role → must still count once in `mensen`.
    members: [
      { id: "p1", name: "Jan" },
      { id: "p3", name: "Maria" },
    ],
  },
  {
    id: "vacant",
    title: "Vacante penningmeester",
    department: "hoofdbestuur",
    members: [],
  },
];

describe("deriveStructureIndex", () => {
  it("counts positions as the number of nodes", () => {
    expect(deriveStructureIndex(nodes).posities).toBe(4);
  });

  it("dedupes people across shared / co-held roles", () => {
    // p1, p2, p3 → 3 distinct people (p1 appears twice).
    expect(deriveStructureIndex(nodes).mensen).toBe(3);
  });

  it("counts distinct populated departments", () => {
    expect(deriveStructureIndex(nodes).afdelingen).toBe(2);
  });

  it("returns zeroes for an empty organigram", () => {
    expect(deriveStructureIndex([])).toEqual({
      posities: 0,
      mensen: 0,
      afdelingen: 0,
    });
  });
});
