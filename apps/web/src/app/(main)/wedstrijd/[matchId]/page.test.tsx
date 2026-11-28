/**
 * `/wedstrijd/[matchId]` — a `matchId` that is not a strict PSD id
 * (`parsePsdId`) 404s in the layout, the page and the metadata before any
 * BFF call (#3486), so `123abc`, `123abd`, … never become fresh ISR entries
 * that each cost a PSD read.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const { mockGetMatchDetail, mockTrackEvent, mockFindMatchbal } = vi.hoisted(
  () => ({
    mockGetMatchDetail: vi.fn(),
    mockTrackEvent: vi.fn(),
    mockFindMatchbal: vi.fn(),
  }),
);

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: mockTrackEvent }));

// The page's five Sanity reads each degrade on failure; stubbing them keeps
// the whole-page render off the network.
vi.mock("@/lib/repositories/player.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/player.repository")
    >();
  return {
    ...mod,
    PlayerRepositoryLive: Layer.succeed(mod.PlayerRepository, {
      findKeeperPsdIds: () => Effect.succeed(new Set<string>()),
    } as never),
  };
});
vi.mock("@/lib/repositories/article.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/article.repository")
    >();
  return {
    ...mod,
    ArticleRepositoryLive: Layer.succeed(mod.ArticleRepository, {
      findByLinkedMatch: () => Effect.succeed([]),
    } as never),
  };
});
vi.mock(
  "@/lib/repositories/photoGallery.repository",
  async (importOriginal) => {
    const mod =
      await importOriginal<
        typeof import("@/lib/repositories/photoGallery.repository")
      >();
    return {
      ...mod,
      PhotoGalleryRepositoryLive: Layer.succeed(mod.PhotoGalleryRepository, {
        findByLinkedMatch: () => Effect.succeed([]),
      } as never),
    };
  },
);
vi.mock("@/lib/repositories/sponsor.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/sponsor.repository")
    >();
  return {
    ...mod,
    SponsorRepositoryLive: Layer.succeed(mod.SponsorRepository, {
      findMatchbal: mockFindMatchbal,
    } as never),
  };
});
vi.mock("@/lib/repositories/team.repository", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("@/lib/repositories/team.repository")>();
  return {
    ...mod,
    TeamRepositoryLive: Layer.succeed(mod.TeamRepository, {
      findAll: () => Effect.succeed([]),
    } as never),
  };
});

vi.mock("@/lib/effect/services/BffService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/effect/services/BffService")>();
  return {
    ...actual,
    BffServiceLive: Layer.succeed(actual.BffService, {
      getMatches: () => Effect.die("not used by this suite"),
      getNextMatches: () => Effect.succeed([]),
      getMatchesWindow: () => Effect.succeed([]),
      getUpcomingMatches: () => Effect.succeed([]),
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

describe("/wedstrijd/[matchId] practical link (#3634)", () => {
  const LABEL = "Parking · inkom · kantine";

  beforeEach(() => {
    mockGetMatchDetail.mockReset();
    mockTrackEvent.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderPage = async (overrides = {}) => {
    mockFindMatchbal.mockReturnValue(Effect.succeed(null));
    mockGetMatchDetail.mockReturnValue(
      Effect.succeed(createMatchDetail({ id: 3602, ...overrides })),
    );
    render(await MatchPage({ params: params("3602") }));
  };

  it("links a Match with a venue to the club's practical information", async () => {
    await renderPage({ venue: "Sportpark Elewijt" });

    const link = screen.getByRole("link", { name: LABEL });
    expect(link).toHaveAttribute("href", "/club/contact");
    // The arrow is decoration: the accessible name is the words alone.
    expect(link.querySelector("[aria-hidden='true']")).not.toBeNull();
  });

  it("renders no link on a Match without a venue", async () => {
    await renderPage();

    expect(screen.queryByRole("link", { name: LABEL })).toBeNull();
  });

  it("sends exactly match_id, status and destination on a click", async () => {
    await renderPage({ venue: "Sportpark Elewijt" });

    await userEvent.click(screen.getByRole("link", { name: LABEL }));

    // `match_detail_view` also fires on mount; only the click is asserted.
    const clicks = mockTrackEvent.mock.calls.filter(
      ([name]) => name === "match_practical_click",
    );
    expect(clicks).toEqual([
      [
        "match_practical_click",
        { match_id: 3602, status: "scheduled", destination: "/club/contact" },
      ],
    ]);
  });
});

describe("/wedstrijd/[matchId] matchday sponsor (#3917)", () => {
  beforeEach(() => {
    mockGetMatchDetail.mockReset();
    mockFindMatchbal.mockReset();
    mockGetMatchDetail.mockReturnValue(
      Effect.succeed(createMatchDetail({ id: 3602 })),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("names the Matchbal Sponsor of this Match", async () => {
    mockFindMatchbal.mockReturnValue(
      Effect.succeed({
        id: "sponsor-1",
        name: "Alupoort",
        url: "https://www.alupoort.be",
        logoUrl: null,
      }),
    );
    render(await MatchPage({ params: params("3602") }));

    expect(mockFindMatchbal).toHaveBeenCalledWith("3602");
    expect(screen.getByTestId("matchday-sponsor")).toHaveTextContent(
      "Matchbal aangeboden doorAlupoort",
    );
  });

  it("shows nothing for a Match without a Matchbal", async () => {
    mockFindMatchbal.mockReturnValue(Effect.succeed(null));
    render(await MatchPage({ params: params("3602") }));

    expect(screen.queryByTestId("matchday-sponsor")).toBeNull();
  });

  it("shows nothing when the read fails, and the page still renders", async () => {
    mockFindMatchbal.mockReturnValue(Effect.die(new Error("sanity down")));
    render(await MatchPage({ params: params("3602") }));

    expect(screen.queryByTestId("matchday-sponsor")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
