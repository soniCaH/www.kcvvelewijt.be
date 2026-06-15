import { describe, it, expect } from "vitest";
import { deriveSeason, groupBySeason } from "./season";

describe("deriveSeason", () => {
  it("places a spring match (Jan–Jun) in the season that started the prior July", () => {
    expect(deriveSeason(new Date(2026, 4, 18))).toEqual({
      key: "2025-2026",
      label: "Seizoen '25–'26",
    });
  });

  it("places an autumn match (Jul–Dec) in the season that starts that July", () => {
    expect(deriveSeason(new Date(2025, 10, 24))).toEqual({
      key: "2025-2026",
      label: "Seizoen '25–'26",
    });
  });

  it("treats July as the start of the new season (boundary)", () => {
    expect(deriveSeason(new Date(2025, 6, 1)).key).toBe("2025-2026");
  });

  it("treats June as still belonging to the prior season (boundary)", () => {
    expect(deriveSeason(new Date(2025, 5, 30)).key).toBe("2024-2025");
  });

  it("lands an August cup match in the upcoming season", () => {
    expect(deriveSeason(new Date(2026, 7, 5))).toEqual({
      key: "2026-2027",
      label: "Seizoen '26–'27",
    });
  });

  it("formats the label with two-digit years and an en-dash", () => {
    expect(deriveSeason(new Date(2024, 8, 1)).label).toBe("Seizoen '24–'25");
  });
});

describe("groupBySeason", () => {
  const make = (iso: string, id: number) => ({ id, date: new Date(iso) });

  it("groups items by season preserving input order across and within groups", () => {
    const items = [
      make("2026-08-05T12:00:00", 1), // '26–'27
      make("2026-05-18T12:00:00", 2), // '25–'26
      make("2026-04-12T12:00:00", 3), // '25–'26
      make("2024-08-25T12:00:00", 4), // '24–'25
    ];
    const groups = groupBySeason(items, (m) => m.date);

    expect(groups.map((g) => g.season.key)).toEqual([
      "2026-2027",
      "2025-2026",
      "2024-2025",
    ]);
    expect(groups[1]?.items.map((m) => m.id)).toEqual([2, 3]);
  });

  it("returns an empty array for no items", () => {
    expect(groupBySeason([], (m: { date: Date }) => m.date)).toEqual([]);
  });
});
