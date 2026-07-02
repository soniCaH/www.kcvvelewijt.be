import { describe, it, expect } from "vitest";
import {
  resolveSubject,
  deriveSubjectFirstName,
  joinFirstNames,
  buildUnanimousAttribution,
  ALL_RESPONDENTS_KEY,
  type IndexedSubject,
} from "./resolveSubject";

describe("resolveSubject", () => {
  describe("player branch", () => {
    it("prefers transparentImage over psdImage when both are present", () => {
      const resolved = resolveSubject({
        kind: "player",
        playerRef: {
          firstName: "Maxim",
          lastName: "Breugelmans",
          jerseyNumber: 9,
          position: "Middenvelder",
          transparentImageUrl: "https://cdn.sanity.io/transparent.webp",
          psdImageUrl: "https://cdn.sanity.io/psd.webp",
        },
      });
      expect(resolved).toEqual({
        name: "Maxim Breugelmans",
        role: "#9",
        photoUrl: "https://cdn.sanity.io/transparent.webp",
        jerseyNumber: 9,
        position: "Middenvelder",
      });
    });

    it("returns null position for players without a field position", () => {
      const resolved = resolveSubject({
        kind: "player",
        playerRef: {
          firstName: "Maxim",
          lastName: "Breugelmans",
          jerseyNumber: 9,
          position: null,
          psdImageUrl: "https://cdn.sanity.io/psd.webp",
        },
      });
      expect(resolved?.position).toBeNull();
    });

    it("falls back to psdImage when transparentImage is missing (90% case)", () => {
      const resolved = resolveSubject({
        kind: "player",
        playerRef: {
          firstName: "Maxim",
          lastName: "Breugelmans",
          jerseyNumber: 9,
          transparentImageUrl: null,
          psdImageUrl: "https://cdn.sanity.io/psd.webp",
        },
      });
      expect(resolved?.photoUrl).toBe("https://cdn.sanity.io/psd.webp");
    });

    it("returns empty role when jerseyNumber is missing", () => {
      const resolved = resolveSubject({
        kind: "player",
        playerRef: {
          firstName: "Maxim",
          lastName: "Breugelmans",
          jerseyNumber: null,
          psdImageUrl: "https://cdn.sanity.io/psd.webp",
        },
      });
      expect(resolved?.role).toBe("");
      expect(resolved?.jerseyNumber).toBeNull();
    });

    it("returns null when the player reference itself is missing", () => {
      expect(resolveSubject({ kind: "player", playerRef: null })).toBeNull();
    });

    it("returns null when both name parts are empty", () => {
      expect(
        resolveSubject({
          kind: "player",
          playerRef: { firstName: null, lastName: null, jerseyNumber: 9 },
        }),
      ).toBeNull();
    });
  });

  describe("staff branch", () => {
    it("resolves name + functionTitle + photo", () => {
      const resolved = resolveSubject({
        kind: "staff",
        staffRef: {
          firstName: "Jeroen",
          lastName: "Van den Berghe",
          functionTitle: "Hoofdcoach A-ploeg",
          photoUrl: "https://cdn.sanity.io/staff.webp",
        },
      });
      expect(resolved).toEqual({
        name: "Jeroen Van den Berghe",
        role: "Hoofdcoach A-ploeg",
        photoUrl: "https://cdn.sanity.io/staff.webp",
        jerseyNumber: null,
        position: null,
      });
    });

    it("returns null when the staff reference is missing", () => {
      expect(resolveSubject({ kind: "staff", staffRef: null })).toBeNull();
    });
  });

  describe("custom branch", () => {
    it("resolves name + role + photo", () => {
      const resolved = resolveSubject({
        kind: "custom",
        customName: "Luc Janssens",
        customRole: "Oud-speler",
        customPhotoUrl: "https://cdn.sanity.io/custom.webp",
      });
      expect(resolved).toEqual({
        name: "Luc Janssens",
        role: "Oud-speler",
        photoUrl: "https://cdn.sanity.io/custom.webp",
        jerseyNumber: null,
        position: null,
      });
    });

    it("returns null when customName is blank", () => {
      expect(
        resolveSubject({ kind: "custom", customName: "   ", customRole: "X" }),
      ).toBeNull();
    });
  });

  it("returns null when subject is null/undefined/missing kind", () => {
    expect(resolveSubject(null)).toBeNull();
    expect(resolveSubject(undefined)).toBeNull();
    expect(resolveSubject({})).toBeNull();
  });

  it("returns null when kind is an unrecognised discriminator value", () => {
    expect(
      resolveSubject({
        kind: "legacy-type" as unknown as "player",
        customName: "Should not be resolved",
      }),
    ).toBeNull();
  });
});

describe("deriveSubjectFirstName", () => {
  it("prefers the ref first name over splitting the resolved name", () => {
    expect(
      deriveSubjectFirstName(
        { kind: "player", playerRef: { firstName: "Julien" } },
        "Julien Verschaeve",
      ),
    ).toBe("Julien");
  });

  it("falls back to the first token of the resolved name", () => {
    expect(deriveSubjectFirstName(null, "Niels Peeters")).toBe("Niels");
  });
});

describe("joinFirstNames", () => {
  it("returns an empty string for no names", () => {
    expect(joinFirstNames([])).toBe("");
  });
  it("returns the single name unchanged", () => {
    expect(joinFirstNames(["Julien"])).toBe("Julien");
  });
  it("joins two names with an ampersand", () => {
    expect(joinFirstNames(["Julien", "Niels"])).toBe("Julien & Niels");
  });
  it("joins 3+ names with commas and a trailing ampersand", () => {
    expect(joinFirstNames(["Julien", "Niels", "Lars"])).toBe(
      "Julien, Niels & Lars",
    );
  });
});

describe("buildUnanimousAttribution", () => {
  const subjects: IndexedSubject[] = [
    {
      _key: "a",
      kind: "player",
      playerRef: { firstName: "Julien", lastName: "V" },
    },
    {
      _key: "b",
      kind: "player",
      playerRef: { firstName: "Niels", lastName: "P" },
    },
  ];

  it("returns one member per resolvable subject, in order", () => {
    expect(buildUnanimousAttribution(subjects)).toEqual([
      { firstName: "Julien", fullName: "Julien V" },
      { firstName: "Niels", fullName: "Niels P" },
    ]);
  });

  it("drops subjects that fail to resolve", () => {
    expect(
      buildUnanimousAttribution([
        subjects[0]!,
        { _key: "x", kind: "player", playerRef: null },
      ]),
    ).toEqual([{ firstName: "Julien", fullName: "Julien V" }]);
  });

  it("returns an empty array for missing subjects", () => {
    expect(buildUnanimousAttribution(null)).toEqual([]);
    expect(buildUnanimousAttribution(undefined)).toEqual([]);
  });
});

it("exposes the sentinel constant", () => {
  expect(ALL_RESPONDENTS_KEY).toBe("__all__");
});
