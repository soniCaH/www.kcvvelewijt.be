import { describe, expect, it } from "vitest";
import { resolvePullQuoteSpeaker } from "./resolvePullQuoteSpeaker";

describe("resolvePullQuoteSpeaker", () => {
  it("returns null when no speaker is given", () => {
    expect(resolvePullQuoteSpeaker(null)).toBeNull();
    expect(resolvePullQuoteSpeaker(undefined)).toBeNull();
  });

  it("returns null when the reference is unresolved (deleted document)", () => {
    expect(resolvePullQuoteSpeaker({})).toBeNull();
  });

  it("returns null when the resolved document has no name", () => {
    expect(resolvePullQuoteSpeaker({ _type: "player" })).toBeNull();
  });

  it("resolves a player — transparentImage preferred over psdImage", () => {
    expect(
      resolvePullQuoteSpeaker({
        _type: "player",
        firstName: "Maxim",
        lastName: "Breugelmans",
        position: "Aanvaller",
        transparentImageUrl: "https://example.com/maxim-transparent.png",
        psdImageUrl: "https://example.com/maxim-psd.png",
      }),
    ).toEqual({
      name: "Maxim Breugelmans",
      firstName: "Maxim",
      role: "Aanvaller",
      photoUrl: "https://example.com/maxim-transparent.png",
    });
  });

  it("falls back to a player's psdImage when transparentImage is absent", () => {
    expect(
      resolvePullQuoteSpeaker({
        _type: "player",
        firstName: "Maxim",
        lastName: "Breugelmans",
        psdImageUrl: "https://example.com/maxim-psd.png",
      }),
    ).toEqual({
      name: "Maxim Breugelmans",
      firstName: "Maxim",
      role: "",
      photoUrl: "https://example.com/maxim-psd.png",
    });
  });

  it("resolves a staff member — editorial photo preferred over psdImage", () => {
    expect(
      resolvePullQuoteSpeaker({
        _type: "staffMember",
        firstName: "Anouk",
        lastName: "De Wit",
        functionTitle: "Bestuur",
        photoUrl: "https://example.com/anouk.jpg",
        psdImageUrl: "https://example.com/anouk-psd.jpg",
      }),
    ).toEqual({
      name: "Anouk De Wit",
      firstName: "Anouk",
      role: "Bestuur",
      photoUrl: "https://example.com/anouk.jpg",
    });
  });

  it("resolves a photo-less staff member — no photo at all (monogram path)", () => {
    expect(
      resolvePullQuoteSpeaker({
        _type: "staffMember",
        firstName: "Anouk",
        lastName: "De Wit",
        functionTitle: "Bestuur",
      }),
    ).toEqual({
      name: "Anouk De Wit",
      firstName: "Anouk",
      role: "Bestuur",
      photoUrl: null,
    });
  });

  it("returns null for an unknown discriminator", () => {
    expect(
      resolvePullQuoteSpeaker({
        _type: "team",
        firstName: "Onbekend",
      }),
    ).toBeNull();
  });
});
