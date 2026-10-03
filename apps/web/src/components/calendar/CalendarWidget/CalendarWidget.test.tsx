/**
 * CalendarWidget Component Tests (Phase 6.D — #1994).
 *
 * Covers the 3-way view toggle (Maand / Week / Agenda), the shared period nav
 * (one cursor, month/week stepping per view), the by-type filter + dedup guard,
 * and the subscribe toggle.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { CalendarWidget } from "./CalendarWidget";
import type {
  CalendarMatchFixture,
  CalendarTeamInfo,
} from "@/app/(main)/kalender/utils";
import { buildCalendarFeed } from "@/app/(main)/kalender/utils";
import type { EventListItemVM } from "@/lib/repositories/event.repository";
import { trackEvent } from "@/lib/analytics/track-event";
import { getScoreDisplay } from "@/lib/utils/match-display";
import { DateTime } from "luxon";

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  useLinkStatus: () => ({ pending: false }),
  default: ({
    children,
    href,
    className,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

// The widget writes `?type=` / `?view=` through `history.pushState` (#3382),
// never the router — `useSearchParams` is deliberately absent from this mock so
// a regression to it throws, and `mockPush` proves `router.push` is never hit.
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/kalender",
}));

/** Sets the live URL the widget's history hooks read on mount. */
function setUrl(search = "") {
  window.history.replaceState({}, "", `/kalender${search}`);
}

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeMatch(
  overrides: Partial<CalendarMatchFixture> & { id: number },
): CalendarMatchFixture {
  const merged = {
    date: "2026-03-15T15:00:00",
    homeTeam: { id: 1, name: "KCVV Elewijt A", logo: "/kcvv.png" },
    awayTeam: { id: 2, name: "Racing Mechelen" },
    status: "scheduled" as CalendarMatchFixture["status"],
    team: "A-ploeg",
    isHome: true,
    kind: "match" as const,
    ...overrides,
  };
  return {
    ...merged,
    scoreDisplay:
      merged.scoreDisplay ??
      getScoreDisplay({
        home_team: { score: merged.homeScore },
        away_team: { score: merged.awayScore },
        status: merged.status,
      }),
  };
}

function makeEventVM(
  overrides: Partial<EventListItemVM> & { id: string },
): EventListItemVM {
  return {
    title: "Paastoernooi",
    href: "/evenementen/paastoernooi",
    dateStart: "2026-03-20T10:00:00",
    dateEnd: null,
    eventType: "Clubevent",
    location: null,
    source: "event",
    ...overrides,
  };
}

const teams: CalendarTeamInfo[] = [
  { id: "t1", name: "A-ploeg", psdId: 101, label: "A-ploeg" },
  { id: "t2", name: "B-ploeg", psdId: 102, label: "B-ploeg" },
];

const defaultProps = {
  feed: buildCalendarFeed([makeMatch({ id: 1 })], [makeEventVM({ id: "e1" })]),
  teams,
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CalendarWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A spy left un-restored by an earlier test would keep recording calls.
    vi.restoreAllMocks();
    setUrl();
    vi.spyOn(DateTime, "now").mockReturnValue(
      DateTime.fromISO("2026-03-15T12:00:00") as DateTime<true>,
    );
  });

  describe("view toggle", () => {
    it("renders three view tabs: Maand, Week, Agenda", () => {
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Maand" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Week" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Agenda" }),
      ).toBeInTheDocument();
    });

    it("defaults to month view", () => {
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByTestId("month-grid")).toBeInTheDocument();
    });

    it("defaults to agenda view on phone viewports (no ?view=)", () => {
      // Stub the md-breakpoint media query as matching (phone). The default
      // (no ?view=) must then resolve to agenda, not month. An effect flips the
      // view after mount, so render() (wrapped in act) settles on agenda.
      const original = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList);
      try {
        render(<CalendarWidget {...defaultProps} />);
        expect(screen.getByTestId("calendar-agenda")).toBeInTheDocument();
        expect(screen.queryByTestId("month-grid")).not.toBeInTheDocument();
      } finally {
        window.matchMedia = original;
      }
    });

    it("explicit ?view=month wins over the phone agenda default", () => {
      setUrl("?view=month");
      const original = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList);
      try {
        render(<CalendarWidget {...defaultProps} />);
        expect(screen.getByTestId("month-grid")).toBeInTheDocument();
      } finally {
        window.matchMedia = original;
      }
    });

    it("shows week view when ?view=week", () => {
      setUrl("?view=week");
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByTestId("week-grid")).toBeInTheDocument();
    });

    it("shows agenda view when ?view=agenda", () => {
      setUrl("?view=agenda");
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByTestId("calendar-agenda")).toBeInTheDocument();
    });

    it("clicking a tab updates URL to ?view=X", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Agenda" }));
      expect(window.location.search).toBe("?view=agenda");
    });

    it("week tab is hidden on mobile (hidden md:inline-flex)", () => {
      render(<CalendarWidget {...defaultProps} />);
      const weekTab = screen.getByRole("button", { name: "Week" });
      expect(weekTab.className).toContain("hidden");
      expect(weekTab.className).toContain("md:inline-flex");
    });

    it("fires kalender_view_toggle with the new view on a tab change", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Agenda" }));
      expect(trackEvent).toHaveBeenCalledWith("kalender_view_toggle", {
        view: "agenda",
      });
    });

    it("dedup guard: re-selecting the active view pushes nothing and fires no analytics", async () => {
      const user = userEvent.setup();
      const pushStateSpy = vi.spyOn(window.history, "pushState");
      render(<CalendarWidget {...defaultProps} />);
      // Default view is month — clicking Maand again is a no-op.
      await user.click(screen.getByRole("button", { name: "Maand" }));
      expect(pushStateSpy).not.toHaveBeenCalled();
      expect(trackEvent).not.toHaveBeenCalled();
    });
  });

  describe("shared period nav", () => {
    it("labels the period with the month for month/agenda view", () => {
      render(<CalendarWidget {...defaultProps} />);
      const label = screen.getByTestId("period-label");
      expect(label.textContent).toContain("Maart");
      expect(label.textContent).toContain("'26");
    });

    it("labels the period with a week range for week view", () => {
      setUrl("?view=week");
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByTestId("period-label")).toHaveTextContent(
        "9 - 15 maart 2026",
      );
    });

    it("steps by month in month view", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByLabelText("Vorige maand"));
      expect(screen.getByTestId("period-label").textContent).toContain(
        "Februari",
      );
    });

    it("steps by week in week view", async () => {
      const user = userEvent.setup();
      setUrl("?view=week");
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByLabelText("Volgende week"));
      expect(screen.getByTestId("period-label")).toHaveTextContent(
        "16 - 22 maart 2026",
      );
    });

    it("snaps the selected-day detail into the navigated month when paging months", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      // Defaults to the selected day = today (15 maart).
      expect(screen.getByTestId("day-panel-heading")).toHaveTextContent(
        /maart/i,
      );
      await user.click(screen.getByLabelText("Volgende maand"));
      // Detail now reflects the new month (snapped to 1 april), not a stale
      // March day outside the visible grid.
      expect(screen.getByTestId("day-panel-heading")).toHaveTextContent(
        /april/i,
      );
    });
  });

  describe("subscribe panel", () => {
    it("renders the Abonneer button", () => {
      render(<CalendarWidget {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /Abonneer/ }),
      ).toBeInTheDocument();
    });

    it("toggles the subscribe panel", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.queryByTestId("subscribe-panel")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Abonneer/ }));
      expect(screen.getByTestId("subscribe-panel")).toBeInTheDocument();
    });

    it("fires kalender_subscribe_open on open only (not on collapse)", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      const btn = screen.getByRole("button", { name: /Abonneer/ });
      await user.click(btn); // open
      expect(trackEvent).toHaveBeenCalledWith("kalender_subscribe_open");
      vi.mocked(trackEvent).mockClear();
      await user.click(btn); // collapse — no event
      expect(trackEvent).not.toHaveBeenCalled();
    });
  });

  describe("history-backed URL state (#3382)", () => {
    it("a chip tap and a view-tab tap each pushState and never router.push", async () => {
      const user = userEvent.setup();
      const pushStateSpy = vi.spyOn(window.history, "pushState");
      render(<CalendarWidget {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Wedstrijden" }));
      expect(pushStateSpy).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole("button", { name: "Agenda" }));
      expect(pushStateSpy).toHaveBeenCalledTimes(2);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("writing type keeps an existing view param, and the reverse", async () => {
      const user = userEvent.setup();
      setUrl("?view=agenda");
      render(<CalendarWidget {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Wedstrijden" }));
      expect(window.location.search).toBe("?view=agenda&type=Wedstrijden");

      await user.click(screen.getByRole("button", { name: "Week" }));
      expect(window.location.search).toBe("?view=week&type=Wedstrijden");
    });

    it("selecting the default chip drops type from the URL and keeps view", async () => {
      const user = userEvent.setup();
      setUrl("?view=agenda&type=Wedstrijden");
      render(<CalendarWidget {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Alles" }));
      expect(window.location.search).toBe("?view=agenda");
    });

    it("a popstate back to an earlier URL restores both the chip and the view", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Wedstrijden" }));
      await user.click(screen.getByRole("button", { name: "Agenda" }));
      expect(screen.getByRole("button", { name: "Agenda" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      // What the browser does on Back: the URL moves, then `popstate` fires.
      window.history.replaceState({}, "", "/kalender?view=week&type=Clubevent");
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(screen.getByRole("button", { name: "Clubevent" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      window.history.replaceState({}, "", "/kalender");
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(screen.getByRole("button", { name: "Alles" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: "Maand" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  describe("server-seeded first render (#3382)", () => {
    // `renderToString` runs no effects, so this is exactly the HTML the
    // `force-dynamic` page ships — a deep link must not paint month / "all".
    it("renders the deep-linked chip and view before any effect runs", () => {
      const html = renderToString(
        <CalendarWidget
          {...defaultProps}
          initialView="agenda"
          initialType="Wedstrijden"
        />,
      );
      expect(html).toContain('data-testid="calendar-agenda"');
      expect(html).not.toContain('data-testid="month-grid"');
      expect(html).toMatch(/aria-pressed="true"[^>]*><span>Wedstrijden</);
    });

    it("narrows an untrusted initial value and keeps the month default", () => {
      const html = renderToString(
        <CalendarWidget
          {...defaultProps}
          initialView="<script>"
          initialType="nope"
        />,
      );
      expect(html).toContain('data-testid="month-grid"');
      expect(html).toMatch(/aria-pressed="true"[^>]*><span>Alles</);
    });

    it("lets the phone default apply when the URL carries no view", () => {
      const original = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList);
      try {
        setUrl("?type=Wedstrijden");
        render(<CalendarWidget {...defaultProps} initialType="Wedstrijden" />);
        expect(screen.getByTestId("calendar-agenda")).toBeInTheDocument();
      } finally {
        window.matchMedia = original;
      }
    });
  });

  describe("by-type filter", () => {
    it("renders the by-type chips", () => {
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Alles" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Wedstrijden" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Clubevent" }),
      ).toBeInTheDocument();
    });

    it("marks the active ?type= chip as pressed", () => {
      setUrl("?type=Wedstrijden");
      render(<CalendarWidget {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Wedstrijden" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("pushes ?type= and fires kalender_filter on a new selection", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Wedstrijden" }));
      expect(window.location.search).toBe("?type=Wedstrijden");
      expect(trackEvent).toHaveBeenCalledWith("kalender_filter", {
        kalender_type: "Wedstrijden",
      });
    });

    it("dedup guard: re-pressing the active chip pushes nothing and fires no analytics", async () => {
      const user = userEvent.setup();
      setUrl("?type=Wedstrijden");
      const pushStateSpy = vi.spyOn(window.history, "pushState");
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Wedstrijden" }));
      expect(pushStateSpy).not.toHaveBeenCalled();
      expect(trackEvent).not.toHaveBeenCalled();
    });

    it("renders the filtered-to-zero state + reset when a type has no items", () => {
      setUrl("?type=Supportersactiviteit");
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByRole("status")).toHaveTextContent(
        /Geen evenementen in de categorie Supportersactiviteit/i,
      );
      expect(
        screen.getByRole("button", { name: "Toon alles" }),
      ).toBeInTheDocument();
    });

    it("clicking 'Toon alles' resets the URL to /kalender", async () => {
      const user = userEvent.setup();
      setUrl("?type=Supportersactiviteit");
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Toon alles" }));
      expect(window.location.search).toBe("");
    });

    it("marks 'Toon alles' with the kalender source + active facet for the global analytics listener (#2719), and its own setType still fires kalender_filter", async () => {
      // The click-to-`empty_state_undo` wiring is a global listener's job
      // now (`EmptyStateUndoTracker`, tested on its own) — this host's job
      // is only to supply the `analyticsSource`/`analyticsFacet` structural
      // props, rendered as inert `data-*` attributes on the undo button.
      const user = userEvent.setup();
      setUrl("?type=Supportersactiviteit");
      render(<CalendarWidget {...defaultProps} />);
      const undo = screen.getByRole("button", { name: "Toon alles" });
      expect(undo).toHaveAttribute("data-empty-state-undo-source", "kalender");
      expect(undo).toHaveAttribute(
        "data-empty-state-undo-facet",
        "Supportersactiviteit",
      );

      await user.click(undo);
      // The undo's own setType("all") still fires its ordinary
      // kalender_filter — that payload must not regress.
      expect(trackEvent).toHaveBeenCalledWith("kalender_filter", {
        kalender_type: "all",
      });
    });
  });
});
