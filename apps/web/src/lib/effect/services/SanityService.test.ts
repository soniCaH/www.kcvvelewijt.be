import { describe, it, expect, vi } from "vitest";
import { Effect } from "effect";
import { SanityService, SanityServiceLive } from "./SanityService";

vi.mock("../../sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn().mockResolvedValue([
      {
        _id: "player-psd-42",
        psdId: "42",
        firstName: "Jan",
        lastName: "Janssen",
        keeper: false,
        positionPsd: null,
        position: "Middenvelder",
        transparentImageUrl: null,
        celebrationImageUrl: null,
        psdImageUrl: null,
        bio: null,
        birthDate: "1995-01-15",
        nationality: null,
        jerseyNumber: null,
        height: null,
        weight: null,
      },
    ]),
  },
}));

describe("SanityService.getPlayers", () => {
  it("returns players from Sanity", async () => {
    const program = Effect.gen(function* () {
      const svc = yield* SanityService;
      return yield* svc.getPlayers();
    }).pipe(Effect.provide(SanityServiceLive));

    const players = await Effect.runPromise(program);
    expect(players).toHaveLength(1);
    expect(players[0]?.psdId).toBe("42");
  });
});
