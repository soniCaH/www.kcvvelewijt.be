import { describe, it, expect } from "vitest";
import { resolveTransfer, KCVV_CLUB_NAME } from "./types";

describe("resolveTransfer", () => {
  it("incoming: from = other club, to = KCVV (KCVV is the destination)", () => {
    const out = resolveTransfer({
      direction: "incoming",
      playerName: "Jan",
      otherClubName: "Standard Luik",
      otherClubLogoUrl: "https://cdn/std.png",
    });
    expect(out.from?.name).toBe("Standard Luik");
    expect(out.from?.isKcvv).toBe(false);
    expect(out.to?.name).toBe(KCVV_CLUB_NAME);
    expect(out.to?.isKcvv).toBe(true);
    expect(out.kickerLabel).toBe("Incoming");
  });

  it("outgoing: from = KCVV, to = other club (KCVV is the source)", () => {
    const out = resolveTransfer({
      direction: "outgoing",
      playerName: "Jan",
      otherClubName: "KV Mechelen",
    });
    expect(out.from?.name).toBe(KCVV_CLUB_NAME);
    expect(out.from?.isKcvv).toBe(true);
    expect(out.to?.name).toBe("KV Mechelen");
    expect(out.to?.isKcvv).toBe(false);
    expect(out.kickerLabel).toBe("Outgoing");
  });

  it("extension: collapses to a single KCVV row + until label, no from/to", () => {
    const out = resolveTransfer({
      direction: "extension",
      playerName: "Jan",
      until: "2028",
    });
    expect(out.from).toBeUndefined();
    expect(out.to).toBeUndefined();
    expect(out.kcvvOnly?.isKcvv).toBe(true);
    expect(out.until).toBe("2028");
    expect(out.kickerLabel).toBe("Extension");
  });

  it("defaults to incoming when direction is missing — graceful fallback for drafts", () => {
    const out = resolveTransfer({ playerName: "Anoniem" });
    expect(out.direction).toBe("incoming");
    expect(out.to?.isKcvv).toBe(true);
  });

  it("other-club logo falls back to null when not provided by the editor", () => {
    const out = resolveTransfer({
      direction: "incoming",
      otherClubName: "Club X",
    });
    expect(out.from?.logoUrl).toBeNull();
  });
});
