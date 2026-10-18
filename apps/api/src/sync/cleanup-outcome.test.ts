import { describe, it, expect } from "vitest";
import { cleanupJobOutcome } from "./cleanup-outcome";

const message = (result: ReturnType<typeof cleanupJobOutcome>) =>
  result?.ok === false ? String(result.error) : "";

describe("cleanupJobOutcome", () => {
  it("reports nothing (null) when the sync failed outright (phase undefined)", () => {
    expect(cleanupJobOutcome(undefined)).toBeNull();
  });

  it("reports nothing (null) on a night with no cycle end — NOT ok: true, which would be a false recovery", () => {
    expect(cleanupJobOutcome({ kind: "not-run" })).toBeNull();
  });

  it("reports ok: true when a cycle ended and every cleanup leg ran", () => {
    expect(cleanupJobOutcome({ kind: "ok" })).toEqual({ ok: true });
  });

  it("reports ok: false naming the missing teams for an incomplete cycle", () => {
    const result = cleanupJobOutcome({
      kind: "skipped",
      skips: [{ kind: "cycle-incomplete", missingTeamIds: ["2", "7"] }],
    });

    expect(result?.ok).toBe(false);
    expect(message(result)).toContain("cycle incomplete");
    expect(message(result)).toContain("2, 7");
    expect(message(result)).not.toContain("sync:orphan-cap-override");
  });

  it("reports ok: false with the fetch error when the club-wide staff fetch failed", () => {
    const result = cleanupJobOutcome({
      kind: "skipped",
      skips: [
        { kind: "staff-fetch-failed", error: "PsdTeamClientError: boom" },
      ],
    });

    expect(result?.ok).toBe(false);
    expect(message(result)).toContain("staff archival skipped");
    expect(message(result)).toContain("PsdTeamClientError: boom");
    expect(message(result)).not.toContain("sync:orphan-cap-override");
  });

  it("reports ok: false with the counts and the release lever for an orphan-cap refusal", () => {
    const result = cleanupJobOutcome({
      kind: "skipped",
      skips: [
        {
          kind: "orphan-cap",
          entity: "players",
          orphanCount: 41,
          activeCount: 120,
          ratio: 41 / 120,
        },
      ],
    });

    expect(result?.ok).toBe(false);
    expect(message(result)).toContain(
      "players: 41/120 would be archived (34 %), over the safety cap",
    );
    expect(message(result)).toContain("sync:orphan-cap-override");
    expect(message(result)).toContain(
      "Releasing a stuck PSD sync orphan-cap refusal",
    );
  });

  it("lists every skip in one message and names each capped entity in the lever", () => {
    const result = cleanupJobOutcome({
      kind: "skipped",
      skips: [
        { kind: "staff-fetch-failed", error: "boom" },
        {
          kind: "orphan-cap",
          entity: "players",
          orphanCount: 4,
          activeCount: 5,
          ratio: 0.8,
        },
        {
          kind: "orphan-cap",
          entity: "teams",
          orphanCount: 4,
          activeCount: 5,
          ratio: 0.8,
        },
      ],
    });

    const text = message(result);
    expect(text).toContain("staff archival skipped");
    expect(text).toContain("players: 4/5");
    expect(text).toContain("teams: 4/5");
    expect(text).toContain("set to players, teams");
  });
});
