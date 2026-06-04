/**
 * CalendarWidget Component Tests
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
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
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

// One match + one Clubevent event → the feed the widget filters by type.
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

  describe("view tabs", () => {
    it("renders two view tabs: Maand, Week", () => {
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Maand" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Week" })).toBeInTheDocument();
    });

    it("defaults to month view when no ?view param", () => {
      render(<CalendarWidget {...defaultProps} />);
      // Month view should show the month/year label
      expect(screen.getByText("maart 2026")).toBeInTheDocument();
    });

    it("shows month view when ?view=month", () => {
      mockSearchParams = new URLSearchParams("view=month");
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByText("maart 2026")).toBeInTheDocument();
    });

    it("shows week view when ?view=week", () => {
      mockSearchParams = new URLSearchParams("view=week");
      render(<CalendarWidget {...defaultProps} />);
      // Week view shows day range
      expect(screen.getByText(/9 - 15 maart 2026/)).toBeInTheDocument();
    });

    it("clicking a tab updates URL to ?view=X", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Week" }));
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("view=week"),
        expect.anything(),
      );
    });

    it("week tab has hidden md:inline-flex class for mobile", () => {
      render(<CalendarWidget {...defaultProps} />);
      const weekTab = screen.getByRole("button", { name: "Week" });
      expect(weekTab.className).toContain("hidden");
      expect(weekTab.className).toContain("md:inline-flex");
    });
  });

  describe("subscribe panel", () => {
    it("renders Abonneer button in toolbar", () => {
      render(<CalendarWidget {...defaultProps} />);
      expect(screen.getByText("Abonneer")).toBeInTheDocument();
    });

    it("toggles subscribe panel when clicking Abonneer", async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);

      expect(screen.queryByTestId("subscribe-panel")).not.toBeInTheDocument();
      await user.click(screen.getByText("Abonneer"));
      expect(screen.getByTestId("subscribe-panel")).toBeInTheDocument();
    });
  });

  describe("by-type filter", () => {
    it("renders the by-type chips (Alles + Wedstrijden + event types)", () => {
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

    it("pushes ?type= and fires kalender_filter when selecting a new type", async () => {
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

    it("clicking 'Toon alles' from a filtered-to-zero state resets the URL to /kalender", async () => {
      const user = userEvent.setup();
      mockSearchParams = new URLSearchParams("type=Supportersactiviteit");
      render(<CalendarWidget {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Toon alles" }));

      expect(mockPush).toHaveBeenCalledWith("/kalender", expect.anything());
    });
  });
});
