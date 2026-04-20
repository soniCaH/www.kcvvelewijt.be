import { describe, it, expect } from "vitest";
import { resolveContent } from "./decisionRule";

describe("resolveContent", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("returns motto baseline when no placeholder data", () => {
    const result = resolveContent(undefined, now);
    expect(result).toEqual({
      mode: "baseline",
      eyebrow: "TUSSENSEIZOEN",
    });
  });

  it("returns motto baseline when placeholder has no actionable fields", () => {
    const result = resolveContent({}, now);
    expect(result.mode).toBe("baseline");
  });

  it("returns countdown when future kickoff date is set", () => {
    const result = resolveContent(
      { nextSeasonKickoff: new Date("2026-08-10T00:00:00Z") },
      now,
    );
    expect(result.mode).toBe("countdown");
    if (result.mode !== "countdown") return;
    expect(result.eyebrow).toBe("NIEUW SEIZOEN");
    expect(result.daysUntil).toBe(70);
  });

  it("treats past kickoff date as unset (falls back to baseline)", () => {
    const result = resolveContent(
      { nextSeasonKickoff: new Date("2026-05-01T00:00:00Z") },
      now,
    );
    expect(result.mode).toBe("baseline");
  });

  it("countdown with daysUntil === 1 is still countdown mode", () => {
    const result = resolveContent(
      { nextSeasonKickoff: new Date("2026-06-02T00:00:00Z") },
      now,
    );
    expect(result.mode).toBe("countdown");
    if (result.mode !== "countdown") return;
    expect(result.daysUntil).toBe(1);
  });

  it("daysUntil === 0 switches to 'today' mode", () => {
    const result = resolveContent(
      { nextSeasonKickoff: new Date("2026-06-01T00:00:00Z") },
      now,
    );
    expect(result.mode).toBe("today");
  });

  it("returns announcement when only announcementText is set", () => {
    const result = resolveContent(
      { announcementText: "Kalender volgende week online" },
      now,
    );
    expect(result.mode).toBe("announcement");
    if (result.mode !== "announcement") return;
    expect(result.eyebrow).toBe("MEDEDELING");
    expect(result.text).toBe("Kalender volgende week online");
  });

  it("announcement preserves optional href", () => {
    const result = resolveContent(
      {
        announcementText: "Kalender",
        announcementHref: "https://example.com",
      },
      now,
    );
    if (result.mode !== "announcement")
      throw new Error("expected announcement");
    expect(result.href).toBe("https://example.com");
  });

  it("countdown takes precedence over announcement", () => {
    const result = resolveContent(
      {
        nextSeasonKickoff: new Date("2026-08-10T00:00:00Z"),
        announcementText: "Kalender volgende week online",
      },
      now,
    );
    expect(result.mode).toBe("countdown");
    if (result.mode !== "countdown") return;
    expect(result.secondary).toBe("Kalender volgende week online");
  });

  it("anchors the day diff to Europe/Brussels, not UTC", () => {
    // 22:30 UTC on 2026-08-09 is already 00:30 Brussels on 2026-08-10 (CEST, UTC+2).
    // A Brussels user sees "seizoen start vandaag" rather than "Nog 1 dag".
    const lateNightNow = new Date("2026-08-09T22:30:00Z");
    const result = resolveContent(
      { nextSeasonKickoff: new Date("2026-08-10T00:00:00Z") },
      lateNightNow,
    );
    expect(result.mode).toBe("today");
  });

  it("today mode carries announcement as secondary when both set", () => {
    const result = resolveContent(
      {
        nextSeasonKickoff: new Date("2026-06-01T00:00:00Z"),
        announcementText: "Succes!",
      },
      now,
    );
    expect(result.mode).toBe("today");
    if (result.mode !== "today") return;
    expect(result.secondary).toBe("Succes!");
  });
});
