/**
 * `/` (homepage) — failed-section regressions for #2505 review findings 1 + 3.
 *
 * Mocks each repository/service's `*Live` Layer directly (not `runPromise`
 * itself), so the real `degradeSection` / `Effect.catchAll` pipelines in
 * `page.tsx` actually run — the point of these tests is that the correct
 * guard is in place, not that the page can render at all.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { HttpBadGateway, type Match } from "@kcvv/api-contract";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import type { TeamNavVM } from "@/lib/repositories/team.repository";
import type { EventVM } from "@/lib/repositories/event.repository";

const minimalArticle: ArticleVM = {
  id: "art-1",
  title: "Groenwit wint van Londerzeel",
  slug: "groenwit-wint-van-londerzeel",
  publishedAt: "2026-05-01T10:00:00Z",
  featured: false,
  coverImageUrl: "https://cdn.example.com/cover.jpg",
  tags: [],
  articleType: null,
  subjects: null,
  firstTransferFact: null,
  firstEventFact: null,
};

// `<SponsorsSection>` is its own async Server Component (reads
// `SponsorRepository` internally) — react-dom's `render()` cannot resolve an
// async component below the root the way the real RSC renderer does, so it
// throws "Only Server Components can be async at the moment" the moment
// `HomePage()`'s tree is rendered. Irrelevant to these two findings, so it
// is stubbed to a plain sync placeholder rather than pulled into these
// mocks' scope.
vi.mock("@/components/home/SponsorsSection/SponsorsSection", () => ({
  SponsorsSection: () => null,
}));

vi.mock("@/lib/repositories/article.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/article.repository")
    >();
  return {
    ...mod,
    ArticleRepositoryLive: Layer.succeed(mod.ArticleRepository, {
      // At least one article so the page's "nothing at all" early return
      // (`articles.length === 0 && matches.length === 0`) doesn't fire —
      // these tests are about the FirstTeamsBlock/agenda sections, not that
      // fallback screen.
      findAll: () => Effect.succeed([minimalArticle]),
      findBySlug: () => Effect.die("not used by this suite"),
      findPaginated: () => Effect.die("not used by this suite"),
      findTags: () => Effect.die("not used by this suite"),
      findRelated: () => Effect.die("not used by this suite"),
      findByLinkedMatch: () => Effect.die("not used by this suite"),
    }),
  };
});

const { mockGetNextMatches, mockGetMatches } = vi.hoisted(() => ({
  mockGetNextMatches: vi.fn(),
  // Backs the per-senior-team fan-out (`getTeamMatches`, via `lib/server/
  // match-data.ts`) — each describe block sets its own default in
  // `beforeEach` and overrides it per-test to discriminate finding 3 from
  // finding 1's combined `firstTeamsReadFailed`.
  mockGetMatches: vi.fn(),
}));

vi.mock("@/lib/effect/services/BffService", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("@/lib/effect/services/BffService")>();
  return {
    ...mod,
    BffServiceLive: Layer.succeed(mod.BffService, {
      getMatches: mockGetMatches,
      getNextMatches: mockGetNextMatches,
      getMatchesWindow: () => Effect.die("not used by this suite"),
      getMatchDetail: () => Effect.die("not used by this suite"),
      getRanking: () => Effect.die("not used by this suite"),
      getRelated: () => Effect.die("not used by this suite"),
      getOpponentHistory: () => Effect.die("not used by this suite"),
      getPlayerStats: () => Effect.die("not used by this suite"),
    }),
  };
});

// `getHomepage` is the single merged read (#2858) — banners and the
// placeholder now come back from one Effect, so a "placeholder read fails"
// case is simulated by making the whole `getHomepage()` call die/succeed;
// the banners half of the mocked return value is fixed to all-null slots,
// same as the pre-merge `getBanners` mock, so these tests still isolate the
// placeholder half.
const { mockGetHomepage } = vi.hoisted(() => ({
  mockGetHomepage: vi.fn(),
}));

vi.mock("@/lib/repositories/homepage.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/homepage.repository")
    >();
  return {
    ...mod,
    HomepageRepositoryLive: Layer.succeed(mod.HomepageRepository, {
      getHomepage: mockGetHomepage,
    }),
  };
});

// A `vi.fn()`, not a fixed `Effect.succeed(null)`, so the #2944 suite below
// can discriminate a failed read from a genuinely empty calendar — both of
// which the pre-fix code degraded to the same `null` (that collapse was the
// bug). Every other describe block sets its own default in `beforeEach`.
const { mockFindNextFeatured } = vi.hoisted(() => ({
  mockFindNextFeatured: vi.fn(),
}));

vi.mock("@/lib/repositories/event.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/event.repository")
    >();
  return {
    ...mod,
    EventRepositoryLive: Layer.succeed(mod.EventRepository, {
      findAll: () => Effect.die("not used by this suite"),
      findUpcomingForList: () => Effect.die("not used by this suite"),
      findNextFeatured: mockFindNextFeatured,
      findBySlug: () => Effect.die("not used by this suite"),
      findAllSlugs: () => Effect.die("not used by this suite"),
    }),
  };
});

const { mockTeamsFindAll } = vi.hoisted(() => ({
  // Each describe block sets its own default in `beforeEach` — empty (no
  // senior teams, so no per-team BFF fan-out via `getTeamMatches`) unless a
  // test opts one in (finding 3's discriminating case below).
  mockTeamsFindAll: vi.fn(),
}));

vi.mock("@/lib/repositories/team.repository", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("@/lib/repositories/team.repository")>();
  return {
    ...mod,
    TeamRepositoryLive: Layer.succeed(mod.TeamRepository, {
      findAll: mockTeamsFindAll,
      findBySlug: () => Effect.die("not used by this suite"),
      findAllForLanding: () => Effect.die("not used by this suite"),
      findYouthTeamsForContact: () => Effect.die("not used by this suite"),
      findByMemberId: () => Effect.die("not used by this suite"),
    }),
  };
});

// Imported at module scope — see CLAUDE.md "Import the module under test at
// module scope". The mock factories above close over hoisted `vi.fn()`s, so
// a dynamic `await import()` is unnecessary here (no TDZ risk: nothing in
// these factories reads a module-scope `const`).
const { default: HomePage } = await import("./page");

describe("/ — a failed placeholder read keeps the page (#2505 review finding 1)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetNextMatches.mockReturnValue(Effect.succeed([]));
    mockTeamsFindAll.mockReturnValue(Effect.succeed([]));
    mockFindNextFeatured.mockReturnValue(Effect.succeed(null));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("survives a placeholder read that dies (real Sanity defect shape) and falls back to the nothing-authored copy", async () => {
    mockGetHomepage.mockReturnValue(
      Effect.die(new Error("Sanity is unreachable")),
    );

    const element = await HomePage();
    render(element);

    // The band rendered at all (no rejection reached the caller) and picked
    // the honest "nothing authored" fallback — not the outage copy, since
    // the match reads themselves succeeded.
    expect(
      screen.getByText("Nog geen wedstrijden ingepland."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/even niet beschikbaar/i),
    ).not.toBeInTheDocument();
  });

  it("still renders the authored notice when the placeholder read succeeds", async () => {
    mockGetHomepage.mockReturnValue(
      Effect.succeed({
        banners: { bannerSlotA: null, bannerSlotB: null, bannerSlotC: null },
        placeholder: {
          announcementText:
            "Groenwit maakt zich klaar voor het nieuwe seizoen.",
        },
      }),
    );

    const element = await HomePage();
    render(element);

    expect(
      screen.getByText("Groenwit maakt zich klaar voor het nieuwe seizoen."),
    ).toBeInTheDocument();
  });
});

// One senior team, so the per-team fan-out (`getTeamMatches` → `bff.getMatches`)
// actually fires — needed to discriminate `upcomingMatchesReadFailed` from
// the combined `firstTeamsReadFailed` (#2505 round-3 review finding M2: with zero
// senior teams, `firstTeamsMatches` is always `[]` and the two booleans are
// provably equal, so a suite that never gives the fan-out anything to fail
// cannot tell the fix from a revert).
const seniorTeamFixture: TeamNavVM = {
  id: "team-a",
  name: "KCVV Elewijt",
  displayName: "A-ploeg",
  slug: "a-ploeg",
  age: null,
  psdId: "101",
  division: "3e Nationale",
  divisionFull: "3e Nationale",
  teamImageUrl: null,
};

// A match belonging to the senior team above (`kcvv_team_id` matches its
// `psdId`) — `page.tsx`'s senior-team dedupe (#2211) filters it OUT of
// `upcomingMatches`, so the agenda's own filtered list ends up empty even
// though the raw `getNextMatches()` read succeeded with a row. That is the
// exact shape review finding 3 named: "any midweek where every live fixture
// belongs to A/B empties `upcomingMatches` on its own" — enough fields for
// `matchRowKind` + `mapMatchToUpcomingMatch`, though its content is never
// rendered (it's filtered before reaching `<UpcomingMatches>`).
const seniorTeamOnlyMatchFixture = {
  id: 501,
  date: new Date("2026-07-15T20:00:00Z"),
  time: "20:00",
  venue: null,
  home_team: { id: 1235, name: "KCVV Elewijt", logo: null, score: null },
  away_team: { id: 628, name: "City Pirates", logo: null, score: null },
  status: "scheduled",
  competition: "3e Nationale",
  competitionType: "league",
  squadLabel: null,
  kcvv_team_id: 101,
  kcvv_team_label: null,
  is_placeholder: false,
} as unknown as Match;

describe("/ — the agenda's outage signal is its own read (#2505 review finding 3)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetHomepage.mockReturnValue(
      Effect.succeed({
        banners: { bannerSlotA: null, bannerSlotB: null, bannerSlotC: null },
        placeholder: null,
      }),
    );
    mockTeamsFindAll.mockReturnValue(Effect.succeed([]));
    mockGetMatches.mockReturnValue(Effect.die("not used by this suite"));
    mockFindNextFeatured.mockReturnValue(Effect.succeed(null));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not claim the agenda is unavailable when getNextMatches succeeds empty", async () => {
    // No senior teams in this suite, so `firstTeamsMatches` is always `[]`
    // and can never itself flip `firstTeamsReadFailed` — this isolates the one
    // signal under test: `matchesResult === null` vs. `[]`.
    mockGetNextMatches.mockReturnValue(Effect.succeed([]));

    const element = await HomePage();
    render(element);

    // The agenda section drops (genuinely empty, not unavailable) — its
    // failure notice must not appear anywhere on the page.
    expect(
      screen.queryByText(/Komende wedstrijden zijn even niet beschikbaar/i),
    ).not.toBeInTheDocument();
  });

  it("does claim the agenda is unavailable when its own getNextMatches read fails", async () => {
    mockGetNextMatches.mockReturnValue(
      Effect.fail(new HttpBadGateway({ error: "upstream is down" })),
    );

    const element = await HomePage();
    render(element);

    // `<FirstTeamsBlock>` also renders an "even niet beschikbaar" sentence
    // in this scenario (its own `unavailable` is `matchesResult === null`
    // too, since there are no senior teams to diverge on) — scope to the
    // agenda region so this assertion is about its own notice specifically.
    const agenda = screen.getByRole("region", { name: "Komende wedstrijden" });
    // Accented substring lands in its own text node (`<AccentEm>`), so this
    // reads the notice paragraph's full text content rather than matching
    // the (split-across-nodes) full sentence directly.
    expect(
      within(agenda).getByText("even niet beschikbaar").closest("p"),
    ).toHaveTextContent(
      "Komende wedstrijden zijn even niet beschikbaar. Probeer het later opnieuw.",
    );
  });

  it("does not claim the agenda is unavailable when only a senior team's own fan-out fails", async () => {
    // The discriminating case: the agenda's own read (getNextMatches)
    // succeeds — with a row, even — but every one of those rows belongs to
    // a senior team, so the senior-team dedupe (#2211) filters
    // `upcomingMatches` down to empty on its own. Meanwhile that same
    // senior team's per-team fetch (getMatches, via getTeamMatches) fails,
    // which flips the combined `firstTeamsReadFailed` (and so
    // <FirstTeamsBlock>'s own `unavailable`) without the agenda's own
    // signal (`matchesResult === null`) ever going true. Reverting
    // `upcomingMatchesReadFailed` back to `firstTeamsReadFailed` turns this test
    // red: the agenda would wrongly print the outage notice.
    mockTeamsFindAll.mockReturnValue(Effect.succeed([seniorTeamFixture]));
    mockGetMatches.mockReturnValue(
      Effect.fail(new HttpBadGateway({ error: "upstream is down" })),
    );
    mockGetNextMatches.mockReturnValue(
      Effect.succeed([seniorTeamOnlyMatchFixture]),
    );

    const element = await HomePage();
    render(element);

    // <FirstTeamsBlock> DOES claim the outage — its `unavailable` still
    // reads the combined signal, correctly, since its own rows come from
    // the failed per-team fan-out.
    const firstTeams = screen.getByRole("region", { name: "Eerste ploegen" });
    expect(
      within(firstTeams).getByText(/even niet beschikbaar/i),
    ).toBeInTheDocument();

    // The agenda must NOT: its own read succeeded (the row that emptied its
    // filtered list is real, not a failure), so it drops silently — the
    // outage notice must be absent everywhere on the page, and since
    // `<UpcomingMatches>` returns `null` on a genuinely empty, available
    // feed, its own "Komende wedstrijden" region shouldn't render at all.
    expect(
      screen.queryByText(/Komende wedstrijden zijn even niet beschikbaar/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Komende wedstrijden" }),
    ).not.toBeInTheDocument();
  });
});

/** Only the fields `toFeaturedEventBandEvent` reads — mirrors the fixture in
 *  `to-featured-event.test.ts`. Dated well past this suite's run so it
 *  can't accidentally read as "past" and get dropped by
 *  `<FeaturedEventBand>`'s own drop-if-empty guard. */
const featuredEventFixture: EventVM = {
  id: "event-1",
  title: "Mosselfestijn",
  slug: "mosselfestijn",
  dateStart: "2027-06-01T18:00:00Z",
  dateEnd: null,
  eventType: null,
  location: null,
  coverImageUrl: "https://cdn.example/cover.jpg",
  href: "#",
  featuredOnHome: true,
} as unknown as EventVM;

describe("/ — the featured-event band holds its shape on a failed read (#2944)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetNextMatches.mockReturnValue(Effect.succeed([]));
    mockTeamsFindAll.mockReturnValue(Effect.succeed([]));
    mockGetHomepage.mockReturnValue(
      Effect.succeed({
        banners: { bannerSlotA: null, bannerSlotB: null, bannerSlotC: null },
        placeholder: null,
      }),
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("holds the featured-event band open and names the reason when the event read fails", async () => {
    // Every other read succeeds — mirrors the isolation comment at
    // page.test.tsx:208: the failure must be attributable to THIS read, not
    // to a shared flag another band can flip.
    mockFindNextFeatured.mockReturnValue(
      Effect.die(new Error("Sanity is unreachable")),
    );

    const element = await HomePage();
    render(element);

    expect(screen.getByText(/even niet beschikbaar/i)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Aanstaand evenement" }),
    ).toBeInTheDocument();
  });

  it("drops the featured-event band silently when there is genuinely no upcoming event", async () => {
    // `findNextFeatured` resolves to `null` (empty calendar), no failure —
    // this is a guard against over-correcting into hold-always: before the
    // fix this passed vacuously (the band was absent either way), so it's
    // meaningless on its own without the sibling test above also failing
    // pre-fix.
    mockFindNextFeatured.mockReturnValue(Effect.succeed(null));

    const element = await HomePage();
    render(element);

    expect(
      screen.queryByRole("region", { name: "Aanstaand evenement" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("featured-event-band")).not.toBeInTheDocument();
  });

  it("does not claim the featured-event band is unavailable when only an unrelated read fails", async () => {
    // Isolation, mirroring the #2505 round-3 finding M2 pattern above: a
    // shared or mis-derived flag must not let another band's own failure
    // (here, the agenda's `getNextMatches`) trip this band's notice too.
    mockFindNextFeatured.mockReturnValue(Effect.succeed(featuredEventFixture));
    mockGetNextMatches.mockReturnValue(
      Effect.fail(new HttpBadGateway({ error: "upstream is down" })),
    );

    const element = await HomePage();
    render(element);

    const featuredEventRegion = screen.getByRole("region", {
      name: "Aanstaand evenement",
    });
    expect(
      within(featuredEventRegion).queryByText(/even niet beschikbaar/i),
    ).not.toBeInTheDocument();
    expect(
      within(featuredEventRegion).getByRole("heading", { level: 2 }),
    ).toBeInTheDocument();
  });
});
