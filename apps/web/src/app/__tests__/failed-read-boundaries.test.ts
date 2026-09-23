/**
 * A failed read may never be cached as a successful render (#2563)
 *
 * #2433 rule 2: under ISR a throw and a catch have *opposite* persistence. A
 * regeneration that throws leaves the last good page in place; a regeneration
 * that catches to `[]` *succeeds*, so the empty render is written into the
 * cache and the last good one is destroyed. Rule 3 splits which is right by
 * what failed: the page's **subject** takes the page down, a **section** keeps
 * it.
 *
 * Both halves are asserted here against the real Effect pipelines — Sanity is
 * mocked at its client, one level below every repository, so each page's own
 * `catch`/no-catch decision is what the assertion actually reads.
 *
 * **A Sanity read carries a typed `SanityReadError` (#2864).** A subject read
 * dies via an explicit call-site `Effect.orDie`, and every section degrade
 * goes through `degradeSection` (`lib/effect/degrade.ts`) — the compiler
 * enforces that every call site picks one, so a `catchAllCause` reaching for
 * a subject read now fails `type-check` rather than only this test. The
 * subject cases below are regression cover for the render behaviour, not for
 * the type hole itself.
 *
 * **This file pins the routes #2563 touched; it is not the growth guard.** A
 * route added later is not covered here — the rule that scales is rule 5 in
 * `cross-page-consistency.test.ts`. `/ploegen/[slug]` gets the same degrade as
 * the two profiles below and is left to that guard plus its own page tests,
 * because standing its subject up needs a full team + BFF fixture to assert
 * what these two already assert.
 *
 * `/kalender` is `force-dynamic` and caches nothing, so its case rests on
 * #2399's honesty argument alone rather than on ISR persistence.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2563
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Effect, Layer, Runtime, Cause } from "effect";
import { HttpNotFound, HttpBadGateway } from "@kcvv/api-contract";
import { createMatchDetail } from "@/app/(main)/wedstrijd/[matchId]/match-detail.fixtures";
import { makeTaggedBffError } from "@/lib/effect/bff-error.fixtures";

// Sanity is unreachable for every read in this file. Repositories left
// unmocked below therefore die; the two mocked below are the page subjects
// that must survive so their sections can be the thing that fails.
vi.mock("@/lib/sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(() => Promise.reject(new Error("Sanity is unreachable"))),
  },
}));

// `/wedstrijd/[matchId]` reads `BffService` directly in its own page body
// (not through a child component), so its match-detail and ranking reads must be mocked
// here rather than left to die against the real BFF. `getMatchDetail` always
// succeeds — the standings read is this suite's actual subject — and every
// other method is a safe empty default. This layer is NOT inert for the
// other pages below: `/kalender`'s own `fetchCalendarData` calls
// `bff.getMatches(...)` from its own awaited body too (`kalender/page.tsx`),
// so this mock silently hands it a working BFF it did not have before — it
// stays green today only because its `teamRepo.findAll()` dies against the
// globally-unreachable Sanity mock first, never reaching the BFF fan-out.
// Harmless while that ordering holds; load-bearing the day someone mocks
// `TeamRepository` in this file.
const { mockGetMatchDetail, mockGetRanking } = vi.hoisted(() => ({
  mockGetMatchDetail: vi.fn(),
  mockGetRanking: vi.fn(),
}));

vi.mock("@/lib/effect/services/BffService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/effect/services/BffService")>();
  return {
    ...actual,
    BffServiceLive: Layer.succeed(actual.BffService, {
      getMatches: () => Effect.succeed([]),
      getNextMatches: () => Effect.succeed([]),
      getMatchesWindow: () => Effect.succeed([]),
      getMatchDetail: mockGetMatchDetail,
      getRanking: mockGetRanking,
      getRelated: () => Effect.succeed([]),
      getOpponentHistory: () => Effect.die("not used by this suite"),
      getPlayerStats: () => Effect.die("not used by this suite"),
    }),
  };
});

vi.mock("@/lib/repositories/player.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/player.repository")
    >();
  const { Effect, Layer } = await import("effect");
  const player = {
    id: "player-1",
    firstName: "Jan",
    lastName: "Peeters",
    position: "Middenvelder",
  };
  return {
    ...mod,
    PlayerRepositoryLive: Layer.succeed(mod.PlayerRepository, {
      findAll: () => Effect.succeed([player]),
      findByPsdId: () => Effect.succeed(player),
      findKeeperPsdIds: () => Effect.succeed(new Set<string>()),
    }),
  };
});

vi.mock("@/lib/repositories/staff.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/staff.repository")
    >();
  const { Effect, Layer } = await import("effect");
  const member = {
    id: "staff-1",
    psdId: "42",
    firstName: "An",
    lastName: "Willems",
    href: "/staf/42",
    organigramPositions: [],
    responsibilityPaths: [],
  };
  return {
    ...mod,
    StaffRepositoryLive: Layer.succeed(mod.StaffRepository, {
      findAll: () => Effect.succeed([]),
      findByPsdId: () => Effect.succeed(member),
      findKeyContacts: () => Effect.succeed([]),
    }),
  };
});

import SponsorsPage from "@/app/(landing)/sponsors/page";
import CalendarPage from "@/app/(main)/kalender/page";
import JeugdPage from "@/app/(landing)/jeugd/(index)/page";
import PlayerPage from "@/app/(main)/spelers/[slug]/page";
import StaffPage from "@/app/(main)/staf/[slug]/page";
import MatchPage from "@/app/(main)/wedstrijd/[matchId]/page";

/** A league match with a resolvable KCVV side — the only shape that reaches
 * the `getRanking` call in `fetchStandings` at all. Builds on the shared
 * `createMatchDetail` (also used by `utils.test.ts`) rather than a second
 * hand-copy of the same base fixture. */
function leagueMatchFixture(id: number) {
  return createMatchDetail({
    id,
    competitionType: "league",
    kcvv_team_id: 1,
    is_placeholder: false,
  });
}

/** Unwrap a rejected `Effect.runPromise`'s `FiberFailure` down to the tagged
 * error's own `_tag` — same squash `isPermanentBffFailure` uses. */
function rejectedBffErrorTag(error: unknown): unknown {
  if (!Runtime.isFiberFailure(error)) return undefined;
  const squashed = Cause.squash(error[Runtime.FiberFailureCauseId]);
  return (squashed as { _tag?: unknown })?._tag;
}

describe("a failed subject takes the page down (#2563)", () => {
  it("/sponsors — the sponsor wall is the subject, so the page throws", async () => {
    await expect(SponsorsPage()).rejects.toThrow();
  });

  it("/kalender — the team list is the subject, so the page throws", async () => {
    await expect(CalendarPage()).rejects.toThrow();
  });
});

describe("a failed section keeps the page (#2563)", () => {
  // Every degrade here logs — `degradeSection` warns with the cause, `/jeugd`'s
  // two `try/catch` fetchers use `console.error`. The assertion is that the page
  // survives, not that it stays quiet, so both channels are silenced.
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("/spelers/[slug] — a failed related-articles read leaves the profile", async () => {
    await expect(
      PlayerPage({ params: Promise.resolve({ slug: "42" }) }),
    ).resolves.toBeTruthy();
  });

  it("/staf/[slug] — a failed related-articles read leaves the profile", async () => {
    await expect(
      StaffPage({ params: Promise.resolve({ slug: "42" }) }),
    ).resolves.toBeTruthy();
  });

  it("/jeugd — a failed editorial-cards read leaves the page", async () => {
    await expect(JeugdPage()).resolves.toBeTruthy();
  });
});

describe("/wedstrijd/[matchId] classifies a failed ranking read (#2778)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetMatchDetail.mockReset();
    mockGetRanking.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("a transient ranking failure (502) takes the page down, so ISR serves the last-good page", async () => {
    mockGetMatchDetail.mockReturnValue(
      Effect.succeed(leagueMatchFixture(9001)),
    );
    mockGetRanking.mockReturnValue(
      Effect.fail(new HttpBadGateway({ error: "upstream is down" })),
    );

    const rejection = await MatchPage({
      params: Promise.resolve({ matchId: "9001" }),
    }).then(
      () => {
        throw new Error("expected MatchPage to reject");
      },
      (error: unknown) => error,
    );

    // Proves the rejection is THIS read, not a coincidence of Sanity being
    // globally unreachable in this file.
    expect(mockGetRanking).toHaveBeenCalledWith(1);
    expect(rejectedBffErrorTag(rejection)).toBe("HttpBadGateway");
  });

  it("a 404 ranking read stays silent — indistinguishable from 'no table published yet', not a failure (#2576)", async () => {
    mockGetMatchDetail.mockReturnValue(
      Effect.succeed(leagueMatchFixture(9002)),
    );
    // apps/api/src/handlers/ranking.ts maps BOTH an unknown psd team id AND
    // an empty upstream table list to this same 404 — the BFF can never
    // return a genuinely-empty ranking any other way. A 404 here must
    // therefore stay silent, the same as the guards inside `fetchStandings`
    // — never the failure notice (review finding 1, verified against the
    // real handler rather than assumed).
    mockGetRanking.mockReturnValue(
      Effect.fail(new HttpNotFound({ error: "unknown psd team id" })),
    );

    const element = await MatchPage({
      params: Promise.resolve({ matchId: "9002" }),
    });
    // Proves `getRanking` was actually reached (not short-circuited by the
    // is_placeholder/competitionType/kcvv_team_id guard) before asserting the
    // page survived it.
    expect(mockGetRanking).toHaveBeenCalledWith(1);
    render(element);
    expect(screen.queryByText("KLASSEMENT")).toBeNull();
  });

  it("a genuine permanent ranking failure (decode error) renders a failure notice instead of nothing (#2576)", async () => {
    mockGetMatchDetail.mockReturnValue(
      Effect.succeed(leagueMatchFixture(9003)),
    );
    // A tag PSD can plausibly send that this deploy cannot decode — the
    // failure sentinel is reserved for exactly this class of error, not the
    // 404 above.
    mockGetRanking.mockReturnValue(
      Effect.fail(makeTaggedBffError("HttpApiDecodeError")),
    );

    const element = await MatchPage({
      params: Promise.resolve({ matchId: "9003" }),
    });
    expect(mockGetRanking).toHaveBeenCalledWith(1);
    render(element);
    // The section renders (not `null`) and says so in its own voice, rather
    // than the empty space a permanent failure rendered before #2576.
    expect(screen.getByText("KLASSEMENT")).toBeInTheDocument();
    expect(screen.getByText(/even niet beschikbaar/i)).toBeInTheDocument();
  });
});

describe("/wedstrijd/[matchId] maps an unknown match id to a real notFound(), not a 500 (#3034)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetMatchDetail.mockReset();
    mockGetRanking.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Root cause: `Effect.catchTag("HttpNotFound", () => Effect.sync(() =>
  // notFound()))` throws Next's sentinel *inside* the Effect fiber.
  // `ManagedRuntime.runPromise` never rejects with the error a defect threw —
  // it rejects with a fresh `FiberFailureImpl` that copies only
  // `message`/`name`/`stack`, dropping the non-standard `.digest` property
  // `isHTTPAccessFallbackError` (`next/dist/client/components/http-access-
  // fallback`) keys off. `app-render.tsx`'s catch can then no longer
  // recognise the rejection as `NEXT_HTTP_ERROR_FALLBACK` and falls through
  // to `res.statusCode = 500` — a real 500 for a route that should 404.
  //
  // This asserts the fix at the one place `MatchPage` actually reaches it:
  // the rejection the page's own `await fetchMatchOrNotFound(...)` produces
  // for a genuinely-unknown id must carry `notFound()`'s own `.digest`, not
  // an unrecognisable `FiberFailure` wrapper.
  it("a HttpNotFound match-detail read rejects with notFound()'s own digest", async () => {
    mockGetMatchDetail.mockReturnValue(
      Effect.fail(new HttpNotFound({ error: "unknown match id" })),
    );

    const rejection = await MatchPage({
      params: Promise.resolve({ matchId: "99999999" }),
    }).then(
      () => {
        throw new Error("expected MatchPage to reject");
      },
      (error: unknown) => error,
    );

    expect(Runtime.isFiberFailure(rejection)).toBe(false);
    expect(rejection).toMatchObject({
      digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/),
    });
  });

  it("a real match id still resolves — the fix does not touch the success path", async () => {
    mockGetMatchDetail.mockReturnValue(
      Effect.succeed(leagueMatchFixture(3424)),
    );
    mockGetRanking.mockReturnValue(Effect.succeed([]));

    await expect(
      MatchPage({ params: Promise.resolve({ matchId: "3424" }) }),
    ).resolves.toBeTruthy();
  });
});
