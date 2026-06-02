import { describe, it, expect } from "vitest";
import { groupEventsByMonth } from "./group-events-by-month";

// Minimal structural fixtures — the util only reads `dateStart`. Z-suffixed
// (UTC) at mid-day so the Brussels-zoned month bucket is stable on any runner.
const ev = (id: string, dateStart: string) => ({ id, dateStart });

describe("groupEventsByMonth", () => {
  it("groups events into chronological month buckets", () => {
    const groups = groupEventsByMonth([
      ev("a", "2026-09-12T12:00:00Z"),
      ev("b", "2026-09-20T12:00:00Z"),
      ev("c", "2026-10-03T12:00:00Z"),
    ]);

    expect(groups.map((g) => g.key)).toEqual(["2026-09", "2026-10"]);
    expect(groups[0]?.events.map((e) => e.id)).toEqual(["a", "b"]);
    expect(groups[1]?.events.map((e) => e.id)).toEqual(["c"]);
  });

  it("sorts events ascending before grouping (input order independent)", () => {
    const groups = groupEventsByMonth([
      ev("late", "2026-10-03T12:00:00Z"),
      ev("early", "2026-09-12T12:00:00Z"),
    ]);

    expect(groups.map((g) => g.key)).toEqual(["2026-09", "2026-10"]);
    expect(groups[0]?.events[0]?.id).toBe("early");
  });

  it("labels months with the capitalised Dutch name and no year within a single year", () => {
    const [sep] = groupEventsByMonth([ev("a", "2026-09-12T12:00:00Z")]);
    expect(sep?.label).toBe("September");
  });

  it("adds the year to every label when the list spans more than one year", () => {
    const groups = groupEventsByMonth([
      ev("a", "2026-12-20T12:00:00Z"),
      ev("b", "2027-01-10T12:00:00Z"),
    ]);

    expect(groups.map((g) => g.label)).toEqual([
      "December 2026",
      "Januari 2027",
    ]);
  });

  it("drops events with an unparseable dateStart", () => {
    const groups = groupEventsByMonth([
      ev("ok", "2026-09-12T12:00:00Z"),
      ev("bad", ""),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.events.map((e) => e.id)).toEqual(["ok"]);
  });

  it("returns an empty array for no events", () => {
    expect(groupEventsByMonth([])).toEqual([]);
  });
});
