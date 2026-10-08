/**
 * `/kalender` — the homepage agenda on top of the calendar (#3430).
 *
 * Mocks each service's `*Live` Layer (not `runPromise`), so the page's real
 * `Effect.catchAll` guard runs — the point is that a failed agenda read is a
 * section failure, not a page failure.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Effect, Layer } from "effect";
import { HttpBadGateway, type Match } from "@kcvv/api-contract";

// The widget is a client island with its own tests; this suite is about what
// sits above it, so a stub proves "the calendar still renders".
vi.mock("@/components/calendar/CalendarWidget", () => ({
  CalendarWidget: () => <div data-testid="calendar-widget" />,
}));

const { mockGetNextMatches } = vi.hoisted(() => ({
  mockGetNextMatches: vi.fn(),
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
      findAll: () => Effect.succeed([]),
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
      findAll: () => Effect.die("not used by this suite"),
      findUpcomingForList: () => Effect.succeed([]),
      findNextFeatured: () => Effect.die("not used by this suite"),
      findBySlug: () => Effect.die("not used by this suite"),
    }),
  };
});

const { default: CalendarPage } = await import("../page");

const renderPage = async () =>
  render(await CalendarPage({ searchParams: Promise.resolve({}) }));

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
