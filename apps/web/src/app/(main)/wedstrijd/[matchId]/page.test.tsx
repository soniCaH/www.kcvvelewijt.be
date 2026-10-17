/**
 * `/wedstrijd/[matchId]` — a `matchId` that is not a strict PSD id
 * (`parsePsdId`) 404s in the layout, the page and the metadata before any
 * BFF call (#3486), so `123abc`, `123abd`, … never become fresh ISR entries
 * that each cost a PSD read.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer } from "effect";
import { HttpNotFound } from "@kcvv/api-contract";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  // Carries Next's real digest so `unstable_rethrow` treats it as control flow.
  notFound: () => {
    throw Object.assign(new Error("NEXT_NOT_FOUND"), {
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
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
import { createMatchDetail } from "./match-detail.fixtures";
import { SITE_CONFIG } from "@/lib/constants";

const params = (matchId: string) => Promise.resolve({ matchId });

describe("/wedstrijd/[matchId] rejects a non-strict id before any read (#3486)", () => {
  beforeEach(() => {
    mockGetMatchDetail.mockReset();
  });

  it.each(["123abc", "-1", "1234567890", "03602", "0"])(
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

  it("lets an unknown match's notFound() through generateMetadata instead of a baked-in title (#3135)", async () => {
    mockGetMatchDetail.mockReturnValue(
      Effect.fail(new HttpNotFound({ error: "no such match" })),
    );
    await expect(generateMetadata({ params: params("999") })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("still degrades to the generic title on a genuine read failure", async () => {
    mockGetMatchDetail.mockReturnValue(Effect.die(new Error("BFF down")));
    await expect(generateMetadata({ params: params("999") })).resolves.toEqual({
      title: "Wedstrijd niet gevonden",
    });
  });

  it("builds the canonical from the numeric id (#3483)", async () => {
    mockGetMatchDetail.mockReturnValue(Effect.succeed(createMatchDetail()));
    const metadata = await generateMetadata({ params: params("3602") });
    expect(metadata.alternates?.canonical).toBe(
      `${SITE_CONFIG.siteUrl}/wedstrijd/3602`,
    );
  });
});
