/**
 * `/wedstrijd/[matchId]` — a `matchId` that is not a strict PSD id
 * (`parsePsdId`) 404s in the layout, the page and the metadata before any
 * BFF call (#3486), so `123abc`, `123abd`, … never become fresh ISR entries
 * that each cost a PSD read.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const { mockGetMatchDetail } = vi.hoisted(() => ({
  mockGetMatchDetail: vi.fn(),
}));

vi.mock("@/lib/effect/services/BffService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/effect/services/BffService")>();
  return {
    ...actual,
    BffServiceLive: Layer.succeed(actual.BffService, {
      getMatches: () => Effect.die("not used by this suite"),
      getNextMatches: () => Effect.succeed([]),
      getMatchesWindow: () => Effect.succeed([]),
      getMatchDetail: mockGetMatchDetail,
      getRanking: () => Effect.die("not used by this suite"),
      getRelated: () => Effect.succeed([]),
      getOpponentHistory: () => Effect.die("not used by this suite"),
      getPlayerStats: () => Effect.die("not used by this suite"),
    }),
  };
});

import MatchPage, { generateMetadata } from "./page";
import MatchLayout from "./layout";

const params = (matchId: string) => Promise.resolve({ matchId });

describe("/wedstrijd/[matchId] rejects a non-strict id before any read (#3486)", () => {
  beforeEach(() => {
    mockGetMatchDetail.mockReset();
  });

  it.each(["123abc", "-1", "1234567890"])(
    "404s %j in the layout, the page and the metadata, with no BFF call",
    async (matchId) => {
      await expect(
        MatchLayout({ children: null, params: params(matchId) }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      await expect(MatchPage({ params: params(matchId) })).rejects.toThrow(
        "NEXT_NOT_FOUND",
      );
      const metadata = await generateMetadata({ params: params(matchId) });
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(mockGetMatchDetail).not.toHaveBeenCalled();
    },
  );

  it("still reads a strict id", async () => {
    mockGetMatchDetail.mockReturnValue(Effect.die("stop after the read"));
    await generateMetadata({ params: params("123") });
    expect(mockGetMatchDetail).toHaveBeenCalledWith(123);
  });
});
