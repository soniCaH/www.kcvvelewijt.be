import { describe, expect, it } from "vitest";
import { parseEventDateTime } from "./event-datetime";
import { accentLastWord, buildEventHeroKicker } from "./event-hero-format";

// All ISO inputs are UTC; parseEventDateTime pins them to Europe/Brussels, so
// `2026-09-12T16:00:00Z` is 18:00 Brussels (CEST) — matching the locked mockup
// kicker "ZATERDAG 14 SEPTEMBER · 18:00".
const at = (iso: string) => parseEventDateTime(iso);

describe("buildEventHeroKicker", () => {
  it("single-day timed event: full weekday + day + month + start time", () => {
    const kicker = buildEventHeroKicker(at("2026-09-12T16:00:00Z"), null);
    expect(kicker).toContain("12 september");
    expect(kicker).toContain("· 18:00");
  });

  it("all-day single-day event (Brussels midnight): omits the time", () => {
    // 2026-09-11T22:00Z === 2026-09-12T00:00 Brussels (CEST).
    const kicker = buildEventHeroKicker(at("2026-09-11T22:00:00Z"), null);
    expect(kicker).toContain("12 september");
    expect(kicker).not.toContain("·");
    expect(kicker).not.toMatch(/\d{2}:\d{2}/);
  });

  it("multi-day, same month: start weekday+day – end weekday+day+month range", () => {
    const kicker = buildEventHeroKicker(
      at("2026-09-14T08:00:00Z"),
      at("2026-09-15T14:00:00Z"),
    );
    expect(kicker).toMatch(/14 –/);
    expect(kicker).toContain("15 september");
    // Multi-day kickers show the range, never a start time.
    expect(kicker).not.toMatch(/\d{2}:\d{2}/);
  });

  it("multi-day across months: both ends carry their month", () => {
    const kicker = buildEventHeroKicker(
      at("2026-09-30T08:00:00Z"),
      at("2026-10-01T14:00:00Z"),
    );
    expect(kicker).toContain("30 september");
    expect(kicker).toContain("1 oktober");
    expect(kicker).toContain("–");
  });

  it("treats a same-day end as single-day (no range)", () => {
    const kicker = buildEventHeroKicker(
      at("2026-09-12T16:00:00Z"),
      at("2026-09-12T20:00:00Z"),
    );
    expect(kicker).not.toContain("–");
    expect(kicker).toContain("· 18:00");
  });

  it("returns an empty string for an invalid start", () => {
    expect(buildEventHeroKicker(at(""), null)).toBe("");
  });
});

describe("accentLastWord", () => {
  it("returns the final whitespace-delimited word", () => {
    expect(accentLastWord("Mosselfeest 2026")).toBe("2026");
    expect(accentLastWord("Algemene vergadering")).toBe("vergadering");
  });

  it("returns the whole token for a single-word title", () => {
    expect(accentLastWord("Mosselfeest")).toBe("Mosselfeest");
  });

  it("ignores surrounding / collapsing whitespace", () => {
    expect(accentLastWord("  Quiz   avond  ")).toBe("avond");
  });

  it("returns undefined for an empty or whitespace-only title", () => {
    expect(accentLastWord("")).toBeUndefined();
    expect(accentLastWord("   ")).toBeUndefined();
  });
});
