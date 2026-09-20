/**
 * `/ploegen/[slug]/wedstrijden` — pins a path #3034's `runPromise` fix made
 * live on a route that ticket does not target (review finding 5).
 *
 * `page.tsx:141`'s `Effect.catchTag("HttpNotFound", () => Effect.sync(() =>
 * notFound()))` predates #3034. Before that fix, `runPromise` rejected with a
 * digest-less `FiberFailure` regardless of what threw inside the Effect chain
 * — this exact `notFound()` call was dead in practice, indistinguishable from
 * any other bug: the route's own 500 error boundary rendered either way, so a
 * team whose *matches* read 404s could never actually reach the not-found
 * page. It is live now.
 *
 * This is a **behaviour change on a route #3034 does not target**, and it is
 * not obviously the right one — see the open questions this suite does NOT
 * resolve, named in the #3034 PR body and tracked separately:
 *
 * - `page.tsx:130-136`'s own comment argues *against* 404-ing a team whose
 *   lookup just succeeded (`ParseError`/`HttpApiDecodeError` are deliberately
 *   left un-caught for exactly that reason) — yet `HttpNotFound` on the same
 *   read still takes the whole page down. `classify-bff-failure.ts:5-8`
 *   documents `HttpNotFound` here as "a mistyped or stale psdId in Sanity",
 *   and every other route's convention for that tag is to degrade the
 *   section (an empty schedule), not 404 the page.
 * - `generateMetadata` (`page.tsx:38-45`) only emits the "Team niet gevonden"
 *   title/`noindex` on its own `!team` branch. This newly-live path resolves
 *   the SAME team successfully in `generateMetadata`, so the not-found BODY
 *   below now renders under the real team's title/metadata.
 *
 * This file only pins what the route does today — the digest survives, so
 * the route now reaches its not-found boundary instead of a 500 — without
 * taking a position on whether "not-found" is the right outcome at all.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect, Layer, Runtime } from "effect";
import { HttpNotFound } from "@kcvv/api-contract";
import type { TeamDetailVM } from "@/lib/repositories/team.repository";

const { mockFindBySlug, mockGetMatches } = vi.hoisted(() => ({
  mockFindBySlug: vi.fn(),
  mockGetMatches: vi.fn(),
}));

vi.mock("@/lib/repositories/team.repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/repositories/team.repository")>();
  return {
    ...actual,
    TeamRepositoryLive: Layer.succeed(actual.TeamRepository, {
      findAll: () => Effect.succeed([]),
      findBySlug: mockFindBySlug,
      findAllForLanding: () => Effect.succeed([]),
      findByMemberId: () => Effect.succeed([]),
    }),
  };
});

vi.mock("@/lib/effect/services/BffService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/effect/services/BffService")>();
  return {
    ...actual,
    BffServiceLive: Layer.succeed(actual.BffService, {
      getMatches: mockGetMatches,
      getNextMatches: () => Effect.succeed([]),
      getMatchesWindow: () => Effect.succeed([]),
      getMatchDetail: () => Effect.die("not used by this suite"),
      getRanking: () => Effect.die("not used by this suite"),
      getRelated: () => Effect.succeed([]),
      getOpponentHistory: () => Effect.die("not used by this suite"),
      getPlayerStats: () => Effect.die("not used by this suite"),
    }),
  };
});

import WedstrijdenPage from "./page";

/** A real, resolvable team — the shape a stale/mistyped `psdId` still passes
 *  (a genuine team exists; only its *matches* read 404s). */
function teamFixture(psdId: string): TeamDetailVM {
  return {
    id: "team-u13",
    name: "KCVV Elewijt U13",
    displayName: "U13",
    slug: "kcvv-elewijt-u13",
    age: "U13",
    psdId,
    footbelId: null,
    division: null,
    divisionFull: null,
    tagline: undefined,
    teamType: "youth",
    ageGroup: "U13",
    teamImageUrl: null,
    body: null,
    contactInfo: null,
    players: [],
    staff: [],
  };
}

describe("/ploegen/[slug]/wedstrijden — a HttpNotFound matches read is now live (#3034)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFindBySlug.mockReset();
    mockGetMatches.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects with notFound()'s own digest instead of a digest-less FiberFailure", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(teamFixture("9401")));
    mockGetMatches.mockReturnValue(
      Effect.fail(new HttpNotFound({ error: "unknown psd team id" })),
    );

    const rejection = await WedstrijdenPage({
      params: Promise.resolve({ slug: "kcvv-elewijt-u13" }),
    }).then(
      () => {
        throw new Error("expected WedstrijdenPage to reject");
      },
      (error: unknown) => error,
    );

    expect(mockGetMatches).toHaveBeenCalledWith(9401);
    expect(Runtime.isFiberFailure(rejection)).toBe(false);
    expect(rejection).toMatchObject({
      digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/),
    });
  });
});
