/**
 * `/ploegen/[slug]/wedstrijden` — pins that a failed **matches** read never
 * 404s a team whose own lookup succeeded (#3041).
 *
 * The route used to carry `Effect.catchTag("HttpNotFound", () =>
 * Effect.sync(() => notFound()))` on this read. That call was dead in
 * practice until #3034 fixed `runPromise` to preserve `notFound()`'s digest,
 * which made it live on a route #3034 did not target — so the first version
 * of this suite pinned the 404 rather than endorsing it.
 *
 * #3041 removed the `catchTag`. Three facts decided it:
 *
 * - `getMatches` is a **list** read. PSD answers an unknown team id with
 *   `200 []`, which decodes cleanly; only `/games/{id}/info` opts into
 *   `emptyBodyIsNotFound` (#2911). So `HttpNotFound` here can never carry the
 *   "stale `psdId` in Sanity" meaning `classify-bff-failure.ts` documents.
 * - The only remaining producer is PSD 404-ing the endpoint itself — an
 *   outage. Degrading that to `[]` would render "Nog geen wedstrijden
 *   gepland" for a team with a full fixture list.
 * - `page.tsx`'s own neighbouring comment already decided the principle for
 *   `ParseError`/`HttpApiDecodeError`: a 404 for a team whose lookup just
 *   succeeded is the strictly worse outcome. `HttpNotFound` was the lone
 *   exception to a rule the file had already written down.
 *
 * So all three permanent tags now share one path: the error boundary. This
 * suite pins that, and pins that the route's own team-level 404 still
 * reaches the not-found page. That last case does NOT exercise #3034's
 * `runPromise` digest fix — `page.tsx`'s `!team` branch throws outside the
 * Effect chain — so it is a route contract, not a guard on that fix;
 * `runtime.test.ts` owns the fix itself.
 *
 * The season-gap producer of `HttpNotFound` on this read is answered as `[]`
 * in the BFF instead (`apps/api/src/psd/service.ts`, covered by
 * `apps/api/src/psd/service.test.ts`), so it never reaches this route as an
 * error at all.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect, Layer, Runtime } from "effect";
import { HttpNotFound } from "@kcvv/api-contract";
import { HttpApiError } from "@effect/platform";
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

describe("/ploegen/[slug]/wedstrijden — a failed matches read never 404s a resolved team (#3041)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFindBySlug.mockReset();
    mockGetMatches.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Rejection shape of one render, or a thrown marker if it resolved. */
  async function renderAndCatch(slug = "kcvv-elewijt-u13") {
    return WedstrijdenPage({ params: Promise.resolve({ slug }) }).then(
      () => {
        throw new Error("expected WedstrijdenPage to reject");
      },
      (error: unknown) => error,
    );
  }

  it("sends an HttpNotFound matches read to the error boundary, not to the not-found page", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(teamFixture("9401")));
    mockGetMatches.mockReturnValue(
      Effect.fail(new HttpNotFound({ error: "psd 404'd the endpoint" })),
    );

    const rejection = await renderAndCatch();

    expect(mockGetMatches).toHaveBeenCalledWith(9401);
    // A 404 digest here would render "Pagina niet gevonden" under the real
    // team's own title and indexable metadata — `generateMetadata` resolves
    // the same team separately and only noindexes its own `!team` branch.
    expect(rejection).not.toMatchObject({
      digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/),
    });
    // Positive half: it is a died Effect reaching the error boundary, which
    // is the outcome this route now shares across every permanent tag.
    expect(Runtime.isFiberFailure(rejection)).toBe(true);
  });

  it("treats HttpNotFound exactly like the other permanent tags on the same read", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(teamFixture("9401")));

    // Both tags are in `PERMANENT_BFF_TAGS` (`classify-bff-failure.ts`) — the
    // comparison is only worth anything against a real permanent peer, not
    // against a transient one like `HttpBadGateway`.
    mockGetMatches.mockReturnValue(
      Effect.fail(new HttpNotFound({ error: "psd 404'd the endpoint" })),
    );
    const notFoundRejection = await renderAndCatch();

    mockGetMatches.mockReturnValue(
      Effect.fail(
        new HttpApiError.HttpApiDecodeError({
          issues: [],
          message: "bad shape",
        }),
      ),
    );
    const decodeRejection = await renderAndCatch();

    // The whole point of #3041: no tag on this read gets its own path, and
    // the shared path is the error boundary — asserted as `true`, not merely
    // as "the same as each other", which two `false`s would also satisfy.
    expect(Runtime.isFiberFailure(notFoundRejection)).toBe(true);
    expect(Runtime.isFiberFailure(decodeRejection)).toBe(true);
  });

  it("still reaches the not-found page with its digest intact when the TEAM is unknown", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(null));

    const rejection = await renderAndCatch("geen-zo-een-ploeg");

    // This pins the route's own contract, NOT #3034's `runPromise` fix: the
    // `!team` branch calls `notFound()` outside the Effect chain, so the
    // throw never passes through `runPromise` and the digest restoration is
    // not exercised here. `runtime.test.ts` owns that.
    expect(mockGetMatches).not.toHaveBeenCalled();
    expect(Runtime.isFiberFailure(rejection)).toBe(false);
    expect(rejection).toMatchObject({
      digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/),
    });
  });
});
