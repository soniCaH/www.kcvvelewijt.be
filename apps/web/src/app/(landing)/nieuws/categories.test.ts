import { describe, it, expect } from "vitest";
import { MIN_ARTICLES_PER_CHIP, toCategoryChips } from "./categories";

const names = (tags: Parameters<typeof toCategoryChips>[0]) =>
  toCategoryChips(tags).map((c) => c.attributes.name);

describe("toCategoryChips (#3432)", () => {
  it("sorts by article count, high to low", () => {
    expect(
      names([
        { name: "B-Ploeg", count: 22 },
        { name: "A-Ploeg", count: 77 },
        { name: "Jeugd", count: 23 },
      ]),
    ).toEqual(["A-Ploeg", "Jeugd", "B-Ploeg"]);
  });

  it("breaks a tie alphabetically", () => {
    expect(
      names([
        { name: "Evenement", count: 4 },
        { name: "Beker Van Zemst", count: 4 },
      ]),
    ).toEqual(["Beker Van Zemst", "Evenement"]);
  });

  it(`hides a tag with fewer than ${MIN_ARTICLES_PER_CHIP} articles`, () => {
    expect(MIN_ARTICLES_PER_CHIP).toBe(3);
    expect(
      names([
        { name: "Football Manager", count: 2 },
        { name: "Beker Van Brabant", count: 1 },
        { name: "Evenement", count: 3 },
      ]),
    ).toEqual(["Evenement"]);
  });

  it("uses the tag as id, name and slug", () => {
    expect(toCategoryChips([{ name: "Jeugd", count: 5 }])).toEqual([
      { id: "Jeugd", attributes: { name: "Jeugd", slug: "Jeugd" } },
    ]);
  });
});
