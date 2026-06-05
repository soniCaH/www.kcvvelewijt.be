/**
 * CalendarWidget Component Tests (Phase 6.D — #1994).
 *
 * Covers the 3-way view toggle (Maand / Week / Agenda), the shared period nav
 * (one cursor, month/week stepping per view), the by-type filter + dedup guard,
 * and the subscribe toggle.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarWidget } from "./CalendarWidget";
import type {
  CalendarMatch,
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

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeMatch(
  overrides: Partial<CalendarMatch> & { id: number },
): CalendarMatch {
  const merged = {
    date: "2026-03-15T15:00:00",
    homeTeam: { id: 1, name: "KCVV Elewijt A", logo: "/kcvv.png" },
    awayTeam: { id: 2, name: "Racing Mechelen" },
    status: "scheduled" as CalendarMatch["status"],
    team: "A-ploeg",
    isHome: true,
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
    mockSearchParams = new URLSearchParams();
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

    it("shows week view when ?view=week", () => {
      mockSearchParams = new URLSearchParams("view=week");
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByTestId("week-grid")).toBeInTheDocument();
    });

    it("shows agenda view when ?view=agenda", () => {
      mockSearchParams = new URLSearchParams("view=agenda");
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByTestId("calendar-agenda")).toBeInTheDocument();
    });

    it("clicking a tab updates URL to ?view=X", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Agenda" }));
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("view=agenda"),
        expect.anything(),
      );
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
      render(<CalendarWidget {...defaultProps} />);
      // Default view is month — clicking Maand again is a no-op.
      await user.click(screen.getByRole("button", { name: "Maand" }));
      expect(mockPush).not.toHaveBeenCalled();
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
      mockSearchParams = new URLSearchParams("view=week");
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
      mockSearchParams = new URLSearchParams("view=week");
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
      mockSearchParams = new URLSearchParams("type=Wedstrijden");
      render(<CalendarWidget {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Wedstrijden" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("pushes ?type= and fires kalender_filter on a new selection", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Wedstrijden" }));
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("type=Wedstrijden"),
        expect.anything(),
      );
      expect(trackEvent).toHaveBeenCalledWith("kalender_filter", {
        kalender_type: "Wedstrijden",
      });
    });

    it("dedup guard: re-pressing the active chip pushes nothing and fires no analytics", async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams("type=Wedstrijden");
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Wedstrijden" }));
      expect(mockPush).not.toHaveBeenCalled();
      expect(trackEvent).not.toHaveBeenCalled();
    });

    it("renders the filtered-to-zero state + reset when a type has no items", () => {
      mockSearchParams = new URLSearchParams("type=Supportersactiviteit");
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
      mockSearchParams = new URLSearchParams("type=Supportersactiviteit");
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Toon alles" }));
      expect(mockPush).toHaveBeenCalledWith("/kalender", expect.anything());
    });
  });
});
