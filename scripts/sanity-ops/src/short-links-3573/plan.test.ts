import { describe, expect, it } from "vitest";
import {
  SHORT_LINK_SEED,
  planSeed,
  preflight,
  shortLinkId,
  type ExistingDoc,
} from "./plan";

describe("SHORT_LINK_SEED", () => {
  it("is the two links the old site's flyers carry", () => {
    expect(SHORT_LINK_SEED).toEqual([
      {
        name: "tornooi",
        target: "https://www.tournify.nl/live/kcvvelewijt2025",
      },
      { name: "stage", target: "/nieuws/herfststage-2026" },
    ]);
  });
});

describe("planSeed", () => {
  it("creates both documents with deterministic ids on an empty dataset", () => {
    const plan = planSeed([]);
    expect(plan.map((p) => [p.action, p.doc._id])).toEqual([
      ["create", "shortLink-tornooi"],
      ["create", "shortLink-stage"],
    ]);
    expect(plan[0].doc).toEqual({
      _id: "shortLink-tornooi",
      _type: "shortLink",
      name: "tornooi",
      target: "https://www.tournify.nl/live/kcvvelewijt2025",
    });
  });

  it("leaves a document that already matches alone, so a re-run is a no-op", () => {
    const existing: ExistingDoc[] = SHORT_LINK_SEED.map((s) => ({
      _id: shortLinkId(s.name),
      ...s,
    }));
    expect(planSeed(existing).map((p) => p.action)).toEqual([
      "unchanged",
      "unchanged",
    ]);
  });

  it("updates a document whose target the board changed, and says what it was", () => {
    const plan = planSeed([
      { _id: "shortLink-tornooi", name: "tornooi", target: "https://x.be" },
    ]);
    expect(plan[0]).toMatchObject({ action: "update", before: "https://x.be" });
    expect(plan[1].action).toBe("create");
  });
});

describe("preflight", () => {
  it("passes an empty dataset and one holding only the seed ids", () => {
    expect(preflight([])).toEqual([]);
    expect(
      preflight([{ _id: "shortLink-stage", name: "stage", target: "/x" }]),
    ).toEqual([]);
  });

  it("refuses a seed name that another document already uses", () => {
    const errors = preflight([
      { _id: "abc123", name: "stage", target: "/elders" },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/stage.*abc123/);
  });

  it("refuses when a draft of a seed document exists: it would be published over this write", () => {
    const errors = preflight([
      { _id: "drafts.shortLink-stage", name: "stage", target: "/draft" },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/drafts\.shortLink-stage/);
  });
});
