/**
 * `/kalender` — the homepage agenda on top of the calendar (#3430).
 *
 * Mocks each service's `*Live` Layer (not `runPromise`), so the page's real
 * `Effect.catchAll` guard runs — the point is that a failed agenda read is a
 * section failure, not a page failure.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { HttpBadGateway, type Match } from "@kcvv/api-contract";

// The widget is a client island with its own tests; this suite is about what
// sits above it, so a stub proves "the calendar still renders".
vi.mock("@/components/calendar/CalendarWidget", () => ({
  CalendarWidget: ({
    initialIsPhone,
    initialAbonneer,
    initialType,
    teams,
  }: {
    initialIsPhone?: boolean;
    initialAbonneer?: string;
    initialType?: string;
    teams: { psdId: number }[];
  }) => (
    <div
      data-testid="calendar-widget"
      data-initial-type={initialType}
      data-initial-is-phone={String(initialIsPhone)}
      data-initial-abonneer={initialAbonneer}
      data-team-psd-ids={teams.map((t) => t.psdId).join(",")}
    />
  ),
}));

const { mockRequestHeaders } = vi.hoisted(() => ({
  mockRequestHeaders: vi.fn(),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(mockRequestHeaders() as HeadersInit),
}));

const { mockGetNextMatches, mockFindAllTeams } = vi.hoisted(() => ({
  mockGetNextMatches: vi.fn(),
  mockFindAllTeams: vi.fn(),
}));

vi.mock("@/lib/effect/services/BffService", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("@/lib/effect/services/BffService")>();
  return {
    ...mod,
    BffServiceLive: Layer.succeed(mod.BffService, {
      getMatches: () => Effect.succeed([]),
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

vi.mock("@/lib/repositories/team.repository", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("@/lib/repositories/team.repository")>();
  return {
    ...mod,
    TeamRepositoryLive: Layer.succeed(mod.TeamRepository, {
      findAll: mockFindAllTeams,
      // The page must never read the hidden teams (#3898): this read dies.
      findHiddenPsdIds: () => Effect.die("not used by this suite"),
      findBySlug: () => Effect.die("not used by this suite"),
      findAllForLanding: () => Effect.die("not used by this suite"),
      findByMemberId: () => Effect.die("not used by this suite"),
    }),
  };
});

vi.mock("@/lib/repositories/event.repository", async (importOriginal) => {
  const mod =
    await importOriginal<
      typeof import("@/lib/repositories/event.repository")
    >();
  return {
    ...mod,
    EventRepositoryLive: Layer.succeed(mod.EventRepository, {
      findForShare: () => Effect.die("not used by this suite"),
      findAll: () => Effect.die("not used by this suite"),
      findUpcomingForList: () => Effect.succeed([]),
      findNextFeatured: () => Effect.die("not used by this suite"),
      findBySlug: () => Effect.die("not used by this suite"),
    }),
  };
});

const { default: CalendarPage } = await import("../page");

beforeEach(() => {
  mockFindAllTeams.mockReturnValue(Effect.succeed([]));
});

const renderPage = async (
  searchParams: {
    type?: string | string[];
    view?: string;
    abonneer?: string | string[];
  } = {},
) =>
  render(await CalendarPage({ searchParams: Promise.resolve(searchParams) }));

const nextMatch = {
  id: 501,
  date: new Date("2099-11-01T00:00:00Z"),
  time: "15:00",
  home_team: { id: 1235, name: "KCVV Elewijt" },
  away_team: { id: 2, name: "FC Elders" },
  status: "scheduled",
  kcvv_team_label: "A-Ploeg",
} as unknown as Match;

describe("/kalender — upcoming matches on top (#3430)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockRequestHeaders.mockReturnValue({});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the agenda between the hero and the calendar", async () => {
    mockGetNextMatches.mockReturnValue(Effect.succeed([nextMatch]));

    await renderPage();

    const agenda = screen.getByRole("heading", {
      level: 2,
      name: /komende wedstrijden/i,
    });
    const hero = screen.getByRole("heading", { level: 1 });
    const widget = screen.getByTestId("calendar-widget");
    // Document order: hero, then agenda, then calendar.
    expect(
      hero.compareDocumentPosition(agenda) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      agenda.compareDocumentPosition(widget) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("FC Elders")).toBeInTheDocument();
  });

  it("keeps the calendar when the agenda read fails, and says the agenda is unavailable", async () => {
    mockGetNextMatches.mockReturnValue(
      Effect.fail(new HttpBadGateway({ error: "upstream is down" })),
    );

    await renderPage();

    expect(screen.getByText(/even niet beschikbaar/i)).toBeInTheDocument();
    expect(screen.getByTestId("calendar-widget")).toBeInTheDocument();
  });

  it("keeps the calendar when the agenda read dies (a defect, not a typed failure)", async () => {
    mockGetNextMatches.mockReturnValue(Effect.die(new Error("boom")));

    await renderPage();

    expect(screen.getByText(/even niet beschikbaar/i)).toBeInTheDocument();
    expect(screen.getByTestId("calendar-widget")).toBeInTheDocument();
  });
});

describe("/kalender — phone first paint (#3480)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetNextMatches.mockReturnValue(Effect.succeed([]));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts the widget on the phone layout for a mobile client hint", async () => {
    mockRequestHeaders.mockReturnValue({ "sec-ch-ua-mobile": "?1" });
    await renderPage();
    expect(screen.getByTestId("calendar-widget")).toHaveAttribute(
      "data-initial-is-phone",
      "true",
    );
  });

  it("starts the widget on the phone layout for a phone UA without a hint", async () => {
    mockRequestHeaders.mockReturnValue({
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    });
    await renderPage();
    expect(screen.getByTestId("calendar-widget")).toHaveAttribute(
      "data-initial-is-phone",
      "true",
    );
  });

  it("starts the widget on the desktop layout for a desktop client", async () => {
    mockRequestHeaders.mockReturnValue({ "sec-ch-ua-mobile": "?0" });
    await renderPage();
    expect(screen.getByTestId("calendar-widget")).toHaveAttribute(
      "data-initial-is-phone",
      "false",
    );
  });
});

describe("/kalender — ?abonneer= (#3788)", () => {
  beforeEach(() => {
    mockRequestHeaders.mockReturnValue({});
    mockGetNextMatches.mockReturnValue(Effect.succeed([]));
  });

  it.each([
    [
      "a single value, handed over raw for the widget to validate",
      "102",
      "102",
    ],
    ["a repeated param, narrowed to its first value", ["1", "2"], "1"],
    ["an absent param", undefined, null],
  ])("%s", async (_label, abonneer, expected) => {
    await renderPage({ abonneer });
    expect(
      screen
        .getByTestId("calendar-widget")
        .getAttribute("data-initial-abonneer"),
    ).toBe(expected);
  });
});

// #3898: a hidden team's calendar is reachable only by typing its id into the
// feed URL. The page offers the widget the shown teams only, so the dropdown
// never lists a hidden team and `?abonneer=<hidden id>` matches no team (the
// widget ignores an id that is not in `teams`).
describe("/kalender — hidden teams (#3898)", () => {
  beforeEach(() => {
    mockRequestHeaders.mockReturnValue({});
    mockGetNextMatches.mockReturnValue(Effect.succeed([]));
    mockFindAllTeams.mockReturnValue(
      Effect.succeed([
        {
          id: "team-1235",
          name: "A-ploeg",
          displayName: "A-ploeg",
          slug: "a-ploeg",
          age: "A",
          psdId: "1235",
          division: null,
          divisionFull: null,
          teamImageUrl: null,
        },
      ]),
    );
  });

  it("offers the widget the shown teams only, so ?abonneer=23 matches none", async () => {
    await renderPage({ abonneer: "23" });
    const widget = screen.getByTestId("calendar-widget");
    expect(widget.getAttribute("data-team-psd-ids")).toBe("1235");
    expect(widget.getAttribute("data-initial-abonneer")).toBe("23");
  });
});

describe("/kalender — ?type= (#3875)", () => {
  beforeEach(() => {
    mockRequestHeaders.mockReturnValue({});
    mockGetNextMatches.mockReturnValue(Effect.succeed([]));
  });

  it("seeds a repeated type the same as a single one", async () => {
    await renderPage({ type: ["a", "b"] });
    const repeated = screen
      .getByTestId("calendar-widget")
      .getAttribute("data-initial-type");
    cleanup();
    await renderPage({ type: "a" });
    expect(repeated).toBe("a");
    expect(
      screen.getByTestId("calendar-widget").getAttribute("data-initial-type"),
    ).toBe(repeated);
  });
});
