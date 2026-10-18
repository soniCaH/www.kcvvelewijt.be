import { describe, expect, it } from "vitest";
import {
  buildMutations,
  classifyEmptyRoles,
  isTrainerOrDelegateTitle,
  type TeamRow,
} from "./plan";

const team = (
  _id: string,
  staff: TeamRow["staff"],
  _rev = `rev-${_id}`,
): TeamRow => ({ _id, _rev, name: _id, staff });

const entry = (
  _key: string,
  role: string | null | undefined,
  functionTitle: string | null,
) => ({
  _key,
  role,
  member: { firstName: "Jan", lastName: _key, functionTitle },
});

describe("isTrainerOrDelegateTitle", () => {
  it("recognises trainer and delegate titles", () => {
    for (const t of [
      "T1 - A-team",
      "T2 - B-team",
      "Keeperstrainer",
      "Ploegafgevaardigde",
      "Afgevaardigde A-ploeg",
      "Coach",
    ]) {
      expect(isTrainerOrDelegateTitle(t), t).toBe(true);
    }
  });

  it("does not treat other functions as trainer or delegate", () => {
    for (const t of [
      "TVJO",
      "Controller",
      "Video-analyst",
      "Sportief Verantwoordelijke",
      "Verzorger",
      "Coördinator Middenbouw",
    ]) {
      expect(isTrainerOrDelegateTitle(t), t).toBe(false);
    }
  });
});

describe("classifyEmptyRoles", () => {
  it("proposes andere only for an empty role whose title is another function", () => {
    const rows = [
      team("team-1", [
        entry("a", null, "TVJO"),
        entry("b", "", "Video-analyst"),
        entry("c", undefined, "T2 - B-team"),
        entry("d", null, null),
        entry("e", "trainer", "TVJO"),
      ]),
    ];
    const { andere, undecided } = classifyEmptyRoles(rows);
    expect(andere.map((e) => e.key)).toEqual(["a", "b"]);
    expect(undecided.map((e) => e.key)).toEqual(["c", "d"]);
  });

  it("lets the owner add an undecided entry and skip a proposed one", () => {
    const rows = [
      team("team-1", [entry("a", null, "TVJO"), entry("d", null, null)]),
    ];
    const { andere, undecided } = classifyEmptyRoles(rows, {
      add: new Set(["d"]),
      skip: new Set(["a"]),
    });
    expect(andere.map((e) => e.key)).toEqual(["d"]);
    expect(undecided.map((e) => e.key)).toEqual(["a"]);
  });

  it("skips entries without a member and teams without staff", () => {
    const rows = [
      team("team-1", [{ _key: "x", role: null, member: null }]),
      team("team-2", null),
    ];
    expect(classifyEmptyRoles(rows)).toEqual({ andere: [], undecided: [] });
  });
});

describe("buildMutations", () => {
  it("writes one revision-pinned patch per document, drafts included", () => {
    const rows = [
      team("team-1", [
        entry("a", null, "TVJO"),
        entry("b", null, "Controller"),
      ]),
      team("drafts.team-1", [entry("a", null, "TVJO")]),
      team("team-2", [entry("c", null, "T1")]),
    ];
    const { andere } = classifyEmptyRoles(rows);
    expect(buildMutations(andere)).toEqual([
      {
        patch: {
          id: "team-1",
          ifRevisionID: "rev-team-1",
          set: {
            'staff[_key=="a"].role': "andere",
            'staff[_key=="b"].role': "andere",
          },
        },
      },
      {
        patch: {
          id: "drafts.team-1",
          ifRevisionID: "rev-drafts.team-1",
          set: { 'staff[_key=="a"].role': "andere" },
        },
      },
    ]);
  });
});
