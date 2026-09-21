import { describe, it, expect } from "vitest";
import {
  searchMembers,
  searchResponsibilities,
  dedupeMembersByPerson,
  mapSemanticResults,
  interleaveResults,
  findLiteralAnswers,
  mergeAnswers,
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
    title: "Inschrijven als nieuw lid",
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
    title: "Sportongeval",
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

  it("matches on the title and labels Titel (#3092)", () => {
    const results = searchResponsibilities("sportongeval", paths, 5);
    expect(results[0].path.id).toBe("blessure");
    expect(results[0].matchedFields).toContain("Titel");
  });

  it("returns no matches for a short query that appears nowhere", () => {
    // "xy" is < 3 chars (skipped by the per-word pass) and absent from every
    // fixture field, so the full-query substring pass finds nothing either.
    expect(searchResponsibilities("xy", paths, 5)).toEqual([]);
  });
});

// #3092 — a word an editor wrote into a path's title or keywords must find
// that path whatever the semantic lane ranks.
describe("findLiteralAnswers", () => {
  it("finds a path by a keyword it literally carries", () => {
    const results = findLiteralAnswers("verzekering", paths, 5);
    expect(results.map((r) => r.path.id)).toEqual(["blessure"]);
    expect(results[0].matchedFields).toEqual(["Trefwoorden"]);
  });

  it("finds a path by its title, case-insensitively and trimmed", () => {
    const results = findLiteralAnswers("  SportOngeval ", paths, 5);
    expect(results.map((r) => r.path.id)).toEqual(["blessure"]);
    expect(results[0].matchedFields).toEqual(["Titel"]);
  });

  it("never matches on the question — a sentence full of common words", () => {
    expect(findLiteralAnswers("mijn kind geblesseerd", paths, 5)).toEqual([]);
    expect(findLiteralAnswers("wat", paths, 5)).toEqual([]);
  });

  it("ranks a title hit above a keyword hit", () => {
    const two: ResponsibilityPath[] = [
      { ...paths[0], id: "k", title: "B", keywords: ["afmelden"] },
      { ...paths[0], id: "t", title: "Afmelden", keywords: [] },
    ];
    expect(
      findLiteralAnswers("afmelden", two, 5).map((r) => r.path.id),
    ).toEqual(["t", "k"]);
  });

  it("ignores a match that only sits in the summary prose", () => {
    expect(findLiteralAnswers("correspondent", paths, 5)).toEqual([]);
  });

  it("ignores queries shorter than 3 characters", () => {
    expect(findLiteralAnswers("in", paths, 5)).toEqual([]);
  });

  it("caps to maxResults", () => {
    const two: ResponsibilityPath[] = [
      { ...paths[0], id: "a", keywords: ["afmelden"] },
      { ...paths[0], id: "b", keywords: ["afmelden"] },
    ];
    expect(findLiteralAnswers("afmelden", two, 1)).toHaveLength(1);
  });

  it("matches a keyword stored with a decomposed accent against a typed one", () => {
    const decomposed: ResponsibilityPath[] = [
      { ...paths[0], id: "allergie", keywords: ["allergiee\u0308n"] },
    ];
    expect(
      findLiteralAnswers("allergieën", decomposed, 5).map((r) => r.path.id),
    ).toEqual(["allergie"]);
    expect(
      findLiteralAnswers("mijn allergieën zijn erg", decomposed, 5).map(
        (r) => r.path.id,
      ),
    ).toEqual(["allergie"]);
  });

  it("finds a path whose keyword is a whole word inside the query, as a weak hit", () => {
    const results = findLiteralAnswers(
      "ik had een ongeval op training",
      paths,
      5,
    );
    expect(results.map((r) => r.path.id)).toEqual(["blessure"]);
    expect(results[0].score).toBeLessThan(10);
  });

  it("does not treat a keyword inside a longer word as a whole-word hit", () => {
    expect(findLiteralAnswers("twee ongevallen gezien", paths, 5)).toEqual([]);
  });
});

describe("mergeAnswers", () => {
  const lit = (id: string) => ({
    type: "responsibility" as const,
    path: paths.find((p) => p.id === id)!,
    score: 30,
    matchedFields: ["Trefwoorden"],
  });
  const sem = (id: string, score: number) => ({
    type: "responsibility" as const,
    path: paths.find((p) => p.id === id)!,
    score,
    matchedFields: [],
  });

  it("puts literal hits first, then the semantic ones", () => {
    expect(
      mergeAnswers([lit("blessure")], [sem("inschrijven", 0.4)], 5).map(
        (r) => r.path.id,
      ),
    ).toEqual(["blessure", "inschrijven"]);
  });

  it("keeps each path once, as its literal hit", () => {
    const merged = mergeAnswers(
      [lit("blessure")],
      [sem("blessure", 0.9), sem("inschrijven", 0.4)],
      5,
    );
    expect(merged.map((r) => r.path.id)).toEqual(["blessure", "inschrijven"]);
    expect(merged[0].matchedFields).toEqual(["Trefwoorden"]);
  });

  it("orders tied strong hits by their semantic score", () => {
    const tied = [lit("inschrijven"), lit("blessure")];
    expect(
      mergeAnswers(
        tied,
        [sem("blessure", 0.57), sem("inschrijven", 0.46)],
        5,
      ).map((r) => r.path.id),
    ).toEqual(["blessure", "inschrijven"]);
  });

  it("places a weak hit by semantic rank, or after the semantic hits when it has none", () => {
    const weak = { ...lit("blessure"), score: 1 };
    expect(
      mergeAnswers([weak], [sem("inschrijven", 0.4)], 5).map((r) => r.path.id),
    ).toEqual(["inschrijven", "blessure"]);
  });

  it("never cuts a literal hit at the cap — a plain semantic hit gives way", () => {
    const weak = { ...lit("blessure"), score: 1 };
    expect(
      mergeAnswers([weak], [sem("inschrijven", 0.4)], 1).map((r) => r.path.id),
    ).toEqual(["blessure"]);
  });

  it("caps the merged lane to maxResults", () => {
    expect(
      mergeAnswers([lit("blessure")], [sem("inschrijven", 0.4)], 1).map(
        (r) => r.path.id,
      ),
    ).toEqual(["blessure"]);
  });
});

describe("mapSemanticResults", () => {
  const pathById = new Map(paths.map((p) => [p.id, p]));

  it("maps semantic hits to paths by slug (then id), carrying the cosine score", () => {
    const mapped = mapSemanticResults(
      [
        { id: "x", slug: "blessure", score: 0.71 },
        { id: "inschrijven", slug: "no-such-slug", score: 0.42 },
      ],
      pathById,
    );
    expect(mapped).toHaveLength(2);
    expect(mapped[0].path.id).toBe("blessure");
    expect(mapped[0].score).toBe(0.71);
    expect(mapped[0].type).toBe("responsibility");
    expect(mapped[1].path.id).toBe("inschrijven"); // id fallback
  });

  it("drops hits with no matching path", () => {
    const mapped = mapSemanticResults(
      [{ id: "ghost", slug: "ghost", score: 0.9 }],
      pathById,
    );
    expect(mapped).toEqual([]);
  });
});

describe("interleaveResults", () => {
  it("interleaves person, answer, person, answer", () => {
    const combined = interleaveResults(
      searchMembers("peeters", members, 5),
      searchResponsibilities("inschrijven", paths, 5),
    );
    expect(combined.map((r) => r.type)).toEqual(["member", "responsibility"]);
  });
});
