import { describe, it, expect } from "vitest";
import { resolveVenue, CLUB_VENUE, type VenueFixtureContext } from "./venue";

function makeFixture(
  overrides: Partial<VenueFixtureContext> = {},
): VenueFixtureContext {
  return {
    status: "scheduled",
    ...overrides,
  };
}

describe("resolveVenue", () => {
  it("returns the club's ground for a home fixture", () => {
    expect(resolveVenue(true, makeFixture())).toBe(CLUB_VENUE);
  });

  it("returns undefined for an away fixture", () => {
    expect(resolveVenue(false, makeFixture())).toBeUndefined();
  });

  it("returns undefined when is_home is unresolved (undefined) — never treated as home", () => {
    expect(resolveVenue(undefined, makeFixture())).toBeUndefined();
  });

  it("never claims the ground for a pitch-reservation placeholder, even when home", () => {
    expect(
      resolveVenue(true, makeFixture({ isPlaceholder: true })),
    ).toBeUndefined();
  });

  it("never claims the ground for an unconfirmed tournament fixture with no result yet", () => {
    expect(
      resolveVenue(
        true,
        makeFixture({ competitionType: "tournament", status: "scheduled" }),
      ),
    ).toBeUndefined();
  });

  it("claims the ground for a tournament fixture once it has a settled scoreline", () => {
    expect(
      resolveVenue(
        true,
        makeFixture({
          competitionType: "tournament",
          status: "finished",
          homeScore: 2,
          awayScore: 1,
        }),
      ),
    ).toBe(CLUB_VENUE);
  });

  it("does not claim the ground for a tournament fixture that is played but missing a scoreline", () => {
    expect(
      resolveVenue(
        true,
        makeFixture({
          competitionType: "tournament",
          status: "finished",
          homeScore: undefined,
          awayScore: undefined,
        }),
      ),
    ).toBeUndefined();
  });
});
