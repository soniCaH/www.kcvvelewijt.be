import { describe, expect, it } from "vitest";
import { buildClubBook } from "./club-book";
import { clubBookNodes, clubBookPaths } from "./club-book.fixture";

/**
 * The fixture feeds a dozen stories (VR baselines and the PDF check). Pin what
 * those stories rely on, so changing it cannot silently empty a story.
 */
describe("club book fixture", () => {
  const book = buildClubBook(clubBookNodes, clubBookPaths);
  const rows = book.chapters.flatMap((c) => c.sections.flatMap((s) => s.rows));

  it("fills all eight key boxes with their why-line", () => {
    const figures = book.keyGroups.flatMap((g) => g.figures);

    expect(figures).toHaveLength(8);
    expect(figures.every((f) => f.why && f.holders.length > 0)).toBe(true);
  });

  it("has a Raad whose members also hold boxes, so chapters name a board", () => {
    expect(book.raad?.members.length).toBeGreaterThan(0);
    expect(book.chapters.some((c) => c.board.length > 0)).toBe(true);
  });

  it("merges the TVJO holder's second box into one row", () => {
    expect(
      rows.some(
        (r) => r.titles.join(" · ") === "TVJO · Jeugdcoördinator Onderbouw",
      ),
    ).toBe(true);
  });

  it("carries a shared box, vacant boxes and unplaced boxes", () => {
    expect(rows.some((r) => r.holders.length > 1)).toBe(true);
    expect(rows.some((r) => r.holders.length === 0)).toBe(true);
    expect(book.overige.length).toBeGreaterThan(0);
  });

  it("attaches role-scoped questions to the TVJO row", () => {
    const tvjo = rows.find((r) => r.titles[0] === "TVJO");

    expect(tvjo?.holders[0]?.questions.map((q) => q.id)).toEqual([
      "allergie",
      "trainers",
      "onderbouw",
    ]);
  });
});
