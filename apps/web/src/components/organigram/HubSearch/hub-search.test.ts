import { describe, it, expect } from "vitest";
import {
  searchMembers,
  searchResponsibilities,
  searchHub,
  dedupeMembersByPerson,
} from "./hub-search";
import type { HubMemberResult } from "./hub-search";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

const members: OrgChartNode[] = [
  {
    id: "voorzitter",
    title: "Voorzitter",
    roleCode: "PRES",
    department: "hoofdbestuur",
    members: [{ id: "staff-1", name: "Jan Peeters", email: "jan@kcvv.be" }],
  },
  {
    id: "jeugdcoordinator",
    title: "Jeugdcoördinator",
    department: "jeugdbestuur",
    members: [{ id: "staff-2", name: "Maria Janssens" }],
  },
  {
    id: "vacant",
    title: "Vacante secretaris",
    department: "hoofdbestuur",
    members: [],
  },
];

const paths: ResponsibilityPath[] = [
  {
    id: "inschrijven",
    role: ["niet-lid", "ouder"],
    question: "Hoe schrijf ik mijn kind in?",
    keywords: ["inschrijven", "lid worden"],
    summary: "Gebruik het online inschrijvingsformulier.",
    category: "administratief",
    primaryContact: { contactType: "manual", role: "Secretaris" },
    steps: [],
  },
  {
    id: "blessure",
    role: ["speler", "ouder"],
    question: "Wat als mijn kind geblesseerd is?",
    keywords: ["blessure", "ongeval", "verzekering"],
    summary: "Verwittig de gerechtigd correspondent voor de verzekering.",
    category: "medisch",
    primaryContact: { contactType: "manual", role: "GC" },
    steps: [],
  },
];

describe("searchMembers", () => {
  it("returns [] for an empty/whitespace query", () => {
    expect(searchMembers("", members, 5)).toEqual([]);
    expect(searchMembers("   ", members, 5)).toEqual([]);
  });

  it("matches on name and labels the matched field", () => {
    const results = searchMembers("peeters", members, 5);
    expect(results).toHaveLength(1);
    expect(results[0].member.id).toBe("voorzitter");
    expect(results[0].matchedFields).toContain("Naam");
  });

  it("ranks a name match above a department-only match", () => {
    // "hoofdbestuur" hits voorzitter (department) and vacant (department),
    // "jan" hits voorzitter on name → voorzitter should outrank on a name query.
    const results = searchMembers("jan", members, 5);
    expect(results[0].member.id).toBe("voorzitter");
  });

  it("matches by role code and department", () => {
    expect(searchMembers("pres", members, 5)[0].member.id).toBe("voorzitter");
    const dept = searchMembers("jeugdbestuur", members, 5);
    expect(dept.map((r) => r.member.id)).toContain("jeugdcoordinator");
  });

  it("caps results to maxResults", () => {
    expect(searchMembers("bestuur", members, 1)).toHaveLength(1);
  });

  it("consolidates a person who holds several positions into one result", () => {
    // A multi-position person (primary holder of 3 nodes) must surface once,
    // not 3× — the bug owner-reported on the live hub search.
    const multi: OrgChartNode[] = [
      {
        id: "node-a",
        title: "Secretaris",
        department: "hoofdbestuur",
        members: [{ id: "kvr", name: "Kevin Van Ransbeeck" }],
      },
      {
        id: "node-b",
        title: "Website & Communicatie",
        department: "algemeen",
        members: [{ id: "kvr", name: "Kevin Van Ransbeeck" }],
      },
      {
        id: "node-c",
        title: "Gerechtelijk Correspondent",
        department: "hoofdbestuur",
        members: [{ id: "kvr", name: "Kevin Van Ransbeeck" }],
      },
    ];
    const results = searchMembers("kevin", multi, 10);
    expect(results).toHaveLength(1);
    expect(results[0].member.members[0]?.id).toBe("kvr");
    expect(results[0].extraPositions).toBe(2);
  });

  it("does not consolidate distinct people who both match", () => {
    const results = searchMembers("a", members, 10); // matches several names
    const personIds = results.map((r) => r.member.members[0]?.id);
    expect(new Set(personIds).size).toBe(personIds.length);
    expect(results.every((r) => r.extraPositions === 0)).toBe(true);
  });
});

describe("dedupeMembersByPerson", () => {
  const result = (
    nodeId: string,
    personId: string | undefined,
    score: number,
  ): HubMemberResult => ({
    type: "member",
    score,
    matchedFields: [],
    extraPositions: 0,
    member: {
      id: nodeId,
      title: nodeId,
      members: personId ? [{ id: personId, name: personId }] : [],
    },
  });

  it("keeps the highest-scoring position as the representative", () => {
    const deduped = dedupeMembersByPerson([
      result("low", "p1", 50),
      result("high", "p1", 80),
    ]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].member.id).toBe("high");
    expect(deduped[0].extraPositions).toBe(1);
  });

  it("passes vacant / holder-less matches through untouched", () => {
    const deduped = dedupeMembersByPerson([
      result("vacant-1", undefined, 10),
      result("vacant-2", undefined, 10),
    ]);
    expect(deduped).toHaveLength(2);
    expect(deduped.every((r) => r.extraPositions === 0)).toBe(true);
  });
});

describe("searchResponsibilities", () => {
  it("returns [] for an empty query", () => {
    expect(searchResponsibilities("", paths, 5)).toEqual([]);
  });

  it("matches on question and labels Vraag", () => {
    const results = searchResponsibilities("schrijf ik mijn kind", paths, 5);
    expect(results[0].path.id).toBe("inschrijven");
    expect(results[0].matchedFields).toContain("Vraag");
  });

  it("matches on keywords", () => {
    const results = searchResponsibilities("verzekering", paths, 5);
    expect(results[0].path.id).toBe("blessure");
    expect(results[0].matchedFields).toContain("Trefwoorden");
  });

  it("returns no matches for a short query that appears nowhere", () => {
    // "xy" is < 3 chars (skipped by the per-word pass) and absent from every
    // fixture field, so the full-query substring pass finds nothing either.
    expect(searchResponsibilities("xy", paths, 5)).toEqual([]);
  });
});

describe("searchHub", () => {
  it("interleaves people and answers (person, answer, person, answer)", () => {
    // "inschrijven" matches the answer keyword; "bestuur" matches members.
    // Use a query that hits both: "in" is too short — craft mixed data instead.
    const mixedMembers: OrgChartNode[] = [
      {
        id: "secretaris",
        title: "Secretaris inschrijvingen",
        department: "hoofdbestuur",
        members: [{ id: "s-1", name: "Inge De Wit" }],
      },
    ];
    const results = searchHub("inschrijv", mixedMembers, paths, 5);
    expect(results[0].type).toBe("member");
    expect(results[1].type).toBe("responsibility");
  });

  it("returns answers even when no people match", () => {
    const results = searchHub("blessure", members, paths, 5);
    expect(results.every((r) => r.type === "responsibility")).toBe(true);
    expect(results[0].type).toBe("responsibility");
  });

  it("returns [] when nothing matches", () => {
    expect(searchHub("zzzzz", members, paths, 5)).toEqual([]);
  });
});
