import { describe, expect, it } from "vitest";
import {
  mergeRelatedRow,
  RELATED_ROW_MAX_ITEMS,
  RELATED_ROW_MAX_SIBLINGS,
  type RelatedRowTiers,
} from "./mergeRelatedRow";

interface Fixture {
  href: string;
}

const item = (href: string): Fixture => {
  return { href };
};

const tiers = (overrides: Partial<RelatedRowTiers<Fixture>> = {}) => {
  const empty: RelatedRowTiers<Fixture> = {
    domain: [],
    curated: [],
    reference: [],
    semantic: [],
    siblings: [],
  };
  return { ...empty, ...overrides };
};

describe("mergeRelatedRow", () => {
  it("orders items domain → curated → reference → semantic → siblings", () => {
    const result = mergeRelatedRow(
      tiers({
        domain: [item("/domain")],
        curated: [item("/curated")],
        reference: [item("/reference")],
        semantic: [item("/semantic")],
        siblings: [item("/siblings")],
      }),
    );

    expect(result.map((i) => i.href)).toEqual([
      "/domain",
      "/curated",
      "/reference",
      "/semantic",
      "/siblings",
    ]);
  });

  it("preserves within-tier order", () => {
    const result = mergeRelatedRow(
      tiers({ curated: [item("/a"), item("/b"), item("/c")] }),
    );

    expect(result.map((i) => i.href)).toEqual(["/a", "/b", "/c"]);
  });

  it("dedupes by href, first occurrence wins (earlier tier beats later)", () => {
    const result = mergeRelatedRow(
      tiers({
        domain: [item("/shared")],
        curated: [item("/shared"), item("/only-curated")],
      }),
    );

    expect(result.map((i) => i.href)).toEqual(["/shared", "/only-curated"]);
  });

  it("dedupes within the same tier", () => {
    const result = mergeRelatedRow(
      tiers({ reference: [item("/a"), item("/a"), item("/b")] }),
    );

    expect(result.map((i) => i.href)).toEqual(["/a", "/b"]);
  });

  it("caps the whole row at RELATED_ROW_MAX_ITEMS", () => {
    expect(RELATED_ROW_MAX_ITEMS).toBe(8);

    const result = mergeRelatedRow(
      tiers({
        domain: [item("/1"), item("/2"), item("/3")],
        curated: [item("/4"), item("/5"), item("/6")],
        reference: [item("/7"), item("/8"), item("/9"), item("/10")],
      }),
    );

    expect(result).toHaveLength(8);
    expect(result.map((i) => i.href)).toEqual([
      "/1",
      "/2",
      "/3",
      "/4",
      "/5",
      "/6",
      "/7",
      "/8",
    ]);
  });

  it("caps siblings at RELATED_ROW_MAX_SIBLINGS before the whole-row cap applies", () => {
    expect(RELATED_ROW_MAX_SIBLINGS).toBe(3);

    const result = mergeRelatedRow(
      tiers({
        siblings: [
          item("/s1"),
          item("/s2"),
          item("/s3"),
          item("/s4"),
          item("/s5"),
        ],
      }),
    );

    expect(result.map((i) => i.href)).toEqual(["/s1", "/s2", "/s3"]);
  });

  it("does not let a deduped sibling count against its own 3-item cap", () => {
    const result = mergeRelatedRow(
      tiers({
        domain: [item("/s1")],
        siblings: [item("/s1"), item("/s2"), item("/s3"), item("/s4")],
      }),
    );

    // /s1 is dropped as a dupe of the domain item, so the sibling cap admits
    // three fresh ones: s2, s3, s4.
    expect(result.map((i) => i.href)).toEqual(["/s1", "/s2", "/s3", "/s4"]);
  });

  it("returns an empty array when every tier is empty", () => {
    expect(mergeRelatedRow(tiers())).toEqual([]);
  });

  it("still applies the whole-row cap after the sibling sub-cap", () => {
    const result = mergeRelatedRow(
      tiers({
        domain: [item("/1"), item("/2")],
        curated: [item("/3"), item("/4")],
        reference: [item("/5"), item("/6")],
        semantic: [item("/7")],
        siblings: [item("/s1"), item("/s2"), item("/s3")],
      }),
    );

    // 2 + 2 + 2 + 1 = 7 non-sibling items, only room for 1 of the 3 siblings.
    expect(result).toHaveLength(8);
    expect(result.at(-1)?.href).toBe("/s1");
  });
});
