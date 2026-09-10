/**
 * `/ploegen/[slug]` — pins the #2795 fix at the shape the BFF actually
 * returns, not a reimplementation of it.
 *
 * `apps/api/src/handlers/ranking.ts` maps BOTH "no ranking published yet"
 * (an empty upstream table list — the handler's own `tables.length === 0`
 * guard) AND a genuinely unknown/stale PSD team id
 * (`classifyHttpError` in `apps/api/src/psd/service.ts`, any upstream 404)
 * to the exact same `HttpNotFound`. `fetchBffData` in `page.tsx` resolves
 * that 404 to `[]` BEFORE `degradeIfPermanent` ever classifies it — this
 * suite proves that split holds against the real Effect pipeline:
 *
 * - `HttpNotFound` on the ranking read → `no-table` (`<StandingsSection>`
 *   renders its own "no rows yet" copy) — never `ranking-unavailable`. This
 *   is the exact bug found in code review: measured against production,
 *   five real youth teams (U11/U12/U13/U16/U19) get `HttpNotFound` from
 *   `/ranking/{id}` every single time, because their table genuinely has no
 *   rows yet, not because anything is broken.
 * - `ParseError`/`HttpApiDecodeError` (a response this deploy cannot decode)
 *   → `ranking-unavailable` — the failure notice, correctly reserved for a
 *   read that genuinely never resolved to a value.
 *
 * Both cases also re-prove the ticket's headline fix: `#wedstrijden` renders
 * in full either way, because the fixtures read fulfilled independently of
 * whichever way the ranking read went.
 *
 * Mirrors the mocking shape of `app/__tests__/failed-read-boundaries.test.ts`
 * (BffService via a replaced `BffServiceLive` layer, Sanity globally
 * unreachable so every other repository degrades through its own section
 * catch) — that file's own docblock left `/ploegen/[slug]` to "its own page
 * tests, because standing its subject up needs a full team + BFF fixture."
 * This is that fixture.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2795
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { HttpNotFound } from "@kcvv/api-contract";
import type { Match } from "@kcvv/api-contract";
import type { TeamDetailVM } from "@/lib/repositories/team.repository";
import { makeTaggedBffError } from "@/lib/effect/bff-error.fixtures";

// `getTeamMatches` (`lib/server/match-data.ts`) wraps itself in React's
// request-scoped `cache()`, which has no request boundary to key off of
// under Vitest — memoized results would otherwise leak between test cases.
// Same fix `lib/server/match-data.test.ts` uses; spread `actual` rather than
// replacing the whole module so every other React export stays real.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

// Sanity is unreachable for every read this suite does not explicitly mock —
// TeamRepository is mocked below (the page's SUBJECT read has no catch), but
// ArticleRepository's related-articles read and SponsorsSection's own
// SponsorRepository read are left real: both degrade to `[]` through their
// own section-level catch (`degradeSection` / `SponsorsSection`'s inline
// `Effect.catchAll`), so mocking them adds nothing this suite needs.
vi.mock("@/lib/sanity/client", () => ({
  sanityClient: {
    fetch: vi.fn(() => Promise.reject(new Error("Sanity is unreachable"))),
  },
}));

// `<SponsorsSection>` is an async Server Component with no `<Suspense>`
// boundary of its own (unlike `<MatchStripSlot>`, further up the page,
// which wraps its own async child). Under Vitest's client-only React
// renderer that throws ("Only Server Components can be async"), and with no
// boundary to catch it the error unmounts the WHOLE tree, not just this
// section — invisible in assertions that only check page-level text, which
// is how this went unnoticed until a suite that renders this exact page
// existed. Irrelevant to what this suite tests, so it is stubbed out rather
// than worked around.
vi.mock("@/components/home/SponsorsSection", () => ({
  SponsorsSection: () => null,
}));

const { mockFindBySlug, mockGetMatches, mockGetRanking } = vi.hoisted(() => ({
  mockFindBySlug: vi.fn(),
  mockGetMatches: vi.fn(),
  mockGetRanking: vi.fn(),
}));

vi.mock("@/lib/repositories/team.repository", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/repositories/team.repository")>();
  return {
    ...actual,
    TeamRepositoryLive: Layer.succeed(actual.TeamRepository, {
      findAll: () => Effect.succeed([]), // MatchStripSlot's own A-side read
      findBySlug: mockFindBySlug,
      findAllForLanding: () => Effect.succeed([]),
      findYouthTeamsForContact: () => Effect.succeed([]),
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
      getRanking: mockGetRanking,
      getRelated: () => Effect.succeed([]),
      getOpponentHistory: () => Effect.die("not used by this suite"),
      getPlayerStats: () => Effect.die("not used by this suite"),
    }),
  };
});

import TeamPage from "./page";

/** A single OFFICIAL/league fixture, dated a week out so `hasVisibleMatches`
 *  (`match-visibility.ts`) reads it as a real "next" fixture — the exact
 *  shape that proves the team is in competition and that `#wedstrijden` has
 *  something to render, independent of whichever way the ranking read goes. */
function leagueFixture(id: number): Match {
  return {
    id,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    time: "15:00",
    home_team: { id: 1235, name: "KCVV Elewijt" },
    away_team: { id: 42, name: "FC Perk" },
    status: "scheduled",
    competition: "3e Provinciale A",
    competitionType: "league",
    is_home: true,
  } as Match;
}

/** A youth team fixture — no players/staff/editorial content, so those
 *  sections auto-hide and the assertions below stay scoped to the
 *  competitive block this suite actually exercises. */
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

describe("/ploegen/[slug] classifies a failed ranking read against the real BFF shape (#2795)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFindBySlug.mockReset();
    mockGetMatches.mockReset();
    mockGetRanking.mockReset();
    mockGetMatches.mockReturnValue(Effect.succeed([leagueFixture(9401)]));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("a 404 ranking read (the BFF's ONLY shape for 'no table yet') classifies as no-table, not ranking-unavailable — fixtures still render", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(teamFixture("9401")));
    // apps/api/src/handlers/ranking.ts maps BOTH an unknown psd team id AND
    // an empty upstream table list to this same 404 — verified against the
    // handler + apps/api/src/psd/service.ts's classifyHttpError. This 404
    // must therefore read as "not published yet", never a failure.
    mockGetRanking.mockReturnValue(
      Effect.fail(new HttpNotFound({ error: "unknown psd team id" })),
    );

    const element = await TeamPage({
      params: Promise.resolve({ slug: "kcvv-elewijt-u13" }),
    });
    render(element);

    expect(mockGetRanking).toHaveBeenCalledWith(9401);

    // `no-table`: a real #klassement section, in its own present-tense voice
    // — never the failure notice.
    const standings = screen.getByTestId("standings-section");
    expect(standings.textContent).toContain(
      "Voor deze reeks is er geen klassement.",
    );
    expect(document.getElementById("klassement")).not.toBeNull();
    expect(screen.queryByText(/even niet beschikbaar/i)).toBeNull();

    // The headline #2795 fix: fixtures render in full regardless of which
    // way the ranking read went.
    expect(document.getElementById("wedstrijden")).not.toBeNull();
  });

  it("a genuine permanent ranking failure (decode error) renders the failure notice, not no-table — fixtures still render", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(teamFixture("9402")));
    // A tag PSD can plausibly send that this deploy cannot decode — reserved
    // for exactly this class of error, never the 404 case above.
    mockGetRanking.mockReturnValue(
      Effect.fail(makeTaggedBffError("HttpApiDecodeError")),
    );

    const element = await TeamPage({
      params: Promise.resolve({ slug: "kcvv-elewijt-u13" }),
    });
    render(element);

    expect(mockGetRanking).toHaveBeenCalledWith(9402);

    // `ranking-unavailable`: the failure notice in place of a section — no
    // `<StandingsSection>`, no `#klassement` id/heading.
    expect(screen.queryByTestId("standings-section")).toBeNull();
    expect(document.getElementById("klassement")).toBeNull();
    expect(document.body.textContent).toContain("even niet beschikbaar");
    expect(document.body.textContent).toContain("Probeer het later opnieuw");

    // The headline #2795 fix, re-proven for the genuine-failure path too:
    // the ranking read failing permanently must not hide fixtures that
    // fulfilled.
    expect(document.getElementById("wedstrijden")).not.toBeNull();
  });
});

/**
 * #2637 — every gated section gains a real `<h2>`, and the info section
 * becomes the unconditional "Trainingen & contact" routing exception.
 *
 * A youth team with a squad + staff, no official fixture this season (the
 * competitive block collapses to `<CompetitiveStatusLine>`, which — per
 * #2540/#2636 — earns no `<h2>`/id/nav entry of its own), and no `body`/
 * `contactInfo` — the state all 26 team documents are in today (measured
 * 2026-08-18). Pins the exact heading outline #2637's acceptance criteria
 * give for this case: `H1 → h2 Spelers → h2 Staf → h2 Trainingen & contact`.
 * `<SponsorsSection>` is stubbed to `null` above (pre-existing harness
 * constraint — an async Server Component with no local Suspense boundary),
 * so the sponsor wall's own heading is out of reach here and out of this
 * ticket's scope regardless.
 */
function headingSweepTeamFixture(): TeamDetailVM {
  return {
    id: "team-u8",
    name: "KCVV Elewijt U8",
    displayName: "U8",
    slug: "kcvv-elewijt-u8",
    age: "U8",
    psdId: "9501",
    footbelId: null,
    division: null,
    divisionFull: null,
    tagline: undefined,
    teamType: "youth",
    ageGroup: "U8",
    teamImageUrl: null,
    body: null,
    contactInfo: null,
    players: [
      { id: "p1", firstName: "Jef", lastName: "Peeters", position: "Keeper" },
    ],
    staff: [
      { id: "s1", firstName: "Marc", lastName: "Van Damme", role: "Trainer" },
    ],
  };
}

describe("/ploegen/[slug] heading sweep — every gated section gets a real <h2> (#2637)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFindBySlug.mockReset();
    mockGetMatches.mockReset();
    mockGetRanking.mockReset();
    // No official fixture this season — the competitive block collapses to
    // the status line, which renders no `<h2>` of its own (#2540/#2636).
    mockGetMatches.mockReturnValue(Effect.succeed([]));
    mockGetRanking.mockReturnValue(Effect.succeed([]));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("youth page with squad + staff, no competitive block, no body/contactInfo: H1 → h2 Spelers → h2 Staf → h2 Trainingen & contact", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(headingSweepTeamFixture()));

    const element = await TeamPage({
      params: Promise.resolve({ slug: "kcvv-elewijt-u8" }),
    });
    render(element);

    const headings = screen
      .getAllByRole("heading")
      .map((h) => ({ level: Number(h.tagName.slice(1)), text: h.textContent }));

    const h1 = headings.find((h) => h.level === 1);
    expect(h1?.text).toContain("U8");

    // Filtered to this page's own h2s, in relative order. The youth-only
    // "Sluit je aan" enrolment CTA (`<TeamEnrolmentCta>`) now renders LAST —
    // after `#info`/"Trainingen & contact.", not between #spelers and #staf
    // — per #2639 (decided by #2543): #2637 made `#info` render on every
    // page, which stranded the CTA mid-page as the page's first (and, on a
    // thin youth page, only) content `<h2>`, ahead of the coach and the
    // training times.
    const ownHeadings = headings
      .filter((h) => h.level === 2)
      .map((h) => h.text)
      .filter((text): text is string =>
        [
          "Spelers.",
          "Staf.",
          "Trainingen & contact.",
          "Sluit je aan bij de jeugd van Elewijt.",
        ].includes(text ?? ""),
      );
    expect(ownHeadings).toEqual([
      "Spelers.",
      "Staf.",
      "Trainingen & contact.",
      "Sluit je aan bij de jeugd van Elewijt.",
    ]);

    // The competitive block is genuinely closed — no #klassement/#wedstrijden
    // section, real fixtures/ranking notwithstanding.
    expect(document.getElementById("klassement")).toBeNull();
    expect(document.getElementById("wedstrijden")).toBeNull();

    // Measured outcome: the info section renders even with body/contactInfo
    // both unset — the routing copy alone keeps it on the page.
    const info = document.getElementById("info");
    expect(info).not.toBeNull();
    expect(info?.textContent).toContain(
      "De trainingsuren van U8 staan nog niet op de site.",
    );

    // The seam survives an empty-but-present section: `<StripedSeam>` has no
    // stable DOM hook of its own, so this asserts on the invariant that
    // matters — the `#info` section itself still renders as a section
    // sibling in the flow, not swallowed behind a `null` return.
    expect(info?.tagName).toBe("SECTION");
  });

  it("names the team in the Trainingen sentence by displayName, never ageGroup — pinned against the real production mismatch (kcvve-u16: age U17, displayName U16)", async () => {
    mockFindBySlug.mockReturnValue(
      Effect.succeed({
        ...headingSweepTeamFixture(),
        // The exact shape measured on production 2026: PSD's `age` (a
        // competition band, shared across teams) disagrees with the team's
        // own resolved identity. `ageGroup` is `computeAgeGroup(age)`, so an
        // `ageGroup` fallback here would print "U17" — the same
        // head-a-different-team bug `teamDisplayName()` exists to close
        // (#2630/#2539) — in the one new sentence this ticket added.
        age: "U17",
        ageGroup: "U17",
        displayName: "U16",
      }),
    );

    const element = await TeamPage({
      params: Promise.resolve({ slug: "kcvv-elewijt-u8" }),
    });
    render(element);

    const info = document.getElementById("info");
    expect(info?.textContent).toContain(
      "De trainingsuren van U16 staan nog niet op de site.",
    );
    expect(info?.textContent).not.toContain("van U17");
  });
});

/**
 * #2639 (decided by #2543) — the youth enrolment CTA band moves from between
 * `<SquadGrid>` and `<TeamStaff>` to after `#info` and before
 * `<SponsorsSection>`/`<RelatedRow>`, and gains an in-view event mirroring
 * the three sibling section events (`team_standings_in_view` /
 * `team_matches_in_view` / `team_squad_in_view`). The heading-order half of
 * this move is already pinned by the heading-sweep suite above; this suite
 * covers the two things that suite doesn't: the new `<TrackInView>` wrapper
 * is actually present around the moved section (mirroring the sibling
 * sections, none of which have their firing behaviour re-tested at this
 * page level either — that is `TrackInView.test.tsx`'s own job), and the
 * band still earns no `<TeamSectionNav>` entry now that it sits past
 * `#info`.
 */
describe("/ploegen/[slug] enrolment CTA band — moved position + in-view event (#2639)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFindBySlug.mockReset();
    mockGetMatches.mockReset();
    mockGetRanking.mockReset();
    mockGetMatches.mockReturnValue(Effect.succeed([]));
    mockGetRanking.mockReturnValue(Effect.succeed([]));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('wraps the moved section in <TrackInView eventName="team_enrolment_cta_in_view">, around the unchanged component', async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(headingSweepTeamFixture()));

    const element = await TeamPage({
      params: Promise.resolve({ slug: "kcvv-elewijt-u8" }),
    });
    render(element);

    const wrapper = document.querySelector(
      '[data-track-event="team_enrolment_cta_in_view"]',
    );
    expect(wrapper).not.toBeNull();
    // The wrapped content is still the unchanged component — same heading,
    // same href — confirming the wrapper was added around the existing
    // section rather than replacing it.
    expect(wrapper?.textContent).toContain(
      "Sluit je aan bij de jeugd van Elewijt.",
    );
    expect(wrapper?.querySelector('a[href="/club/word-lid"]')).not.toBeNull();
  });

  it("earns no <TeamSectionNav> entry — the CTA is a call to action, not navigable content", async () => {
    mockFindBySlug.mockReturnValue(Effect.succeed(headingSweepTeamFixture()));

    const element = await TeamPage({
      params: Promise.resolve({ slug: "kcvv-elewijt-u8" }),
    });
    render(element);

    // This fixture's Staf/Spelers/Info trio still renders the sticky nav
    // (>1 item), so its absence here is a real assertion, not a vacuous one
    // from the nav failing to mount at all.
    const nav = screen.getByTestId("team-section-nav");
    expect(nav.textContent).not.toContain("Sluit je aan");
    expect(nav.textContent).not.toContain("Word lid");
  });

  it("senior teams still render no enrolment band, seam or wrapper at all", async () => {
    mockFindBySlug.mockReturnValue(
      Effect.succeed({
        ...headingSweepTeamFixture(),
        teamType: "senior" as const,
      }),
    );

    const element = await TeamPage({
      params: Promise.resolve({ slug: "kcvv-elewijt-u8" }),
    });
    render(element);

    expect(
      document.querySelector('[data-track-event="team_enrolment_cta_in_view"]'),
    ).toBeNull();
    // Not `queryByText` with the full sentence: `<EditorialHeading
    // emphasis={{ text: "Elewijt" }}>` splits the heading into a text node +
    // `<em>Elewijt</em>` + a text node, and the default text matcher only
    // concatenates an element's DIRECT text-node children — it never matches
    // the full sentence even when the band IS rendered, making that
    // assertion vacuous. `textContent` walks the whole subtree instead.
    expect(document.body.textContent).not.toContain(
      "Sluit je aan bij de jeugd van Elewijt.",
    );
  });
});
