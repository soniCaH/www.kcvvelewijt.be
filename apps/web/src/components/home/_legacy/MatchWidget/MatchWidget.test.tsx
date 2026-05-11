import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchWidget } from "./MatchWidget";
import {
  mockUpcomingMatch,
  mockFinishedMatchWin,
  mockFinishedMatchDraw,
  mockPostponedMatch,
  mockStoppedMatch,
  mockForfeitedMatch,
  mockLongTeamNames,
} from "./MatchWidget.mocks";
import { trackEvent } from "@/lib/analytics/track-event";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} {...props} />,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

const trackEventMock = vi.mocked(trackEvent);

describe("MatchWidget", () => {
  describe("Overline label", () => {
    it("renders default teamLabel", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText(/A-Ploeg/i)).toBeInTheDocument();
    });

    it("renders custom teamLabel", () => {
      render(<MatchWidget match={mockUpcomingMatch} teamLabel="B-Ploeg" />);
      expect(screen.getByText(/B-Ploeg/i)).toBeInTheDocument();
    });

    it("renders overline prefix text", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText(/VOLGENDE WEDSTRIJD/i)).toBeInTheDocument();
    });
  });

  describe("Team names", () => {
    it("renders home team name", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getAllByText(/KCVV Elewijt/i).length).toBeGreaterThan(0);
    });

    it("renders away team name", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText(/KVC Wilrijk/i)).toBeInTheDocument();
    });
  });

  describe("Scheduled match", () => {
    it("shows VS for scheduled match", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText("VS")).toBeInTheDocument();
    });

    it("shows match time", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText(/15:00/)).toBeInTheDocument();
    });

    it("shows competition name", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByText(/3e Afdeling VV/i)).toBeInTheDocument();
    });
  });

  describe("Finished match", () => {
    it("shows score for finished match", () => {
      render(<MatchWidget match={mockFinishedMatchWin} />);
      expect(screen.getByText("3 – 1")).toBeInTheDocument();
    });

    it("shows draw score correctly", () => {
      render(<MatchWidget match={mockFinishedMatchDraw} />);
      expect(screen.getByText("2 – 2")).toBeInTheDocument();
    });

    it("does not show VS for finished match", () => {
      render(<MatchWidget match={mockFinishedMatchWin} />);
      expect(screen.queryByText("VS")).not.toBeInTheDocument();
    });
  });

  describe("Special states", () => {
    it("shows UITGESTELD badge for postponed match", () => {
      render(<MatchWidget match={mockPostponedMatch} />);
      expect(screen.getByText(/UITGESTELD/i)).toBeInTheDocument();
    });

    it("shows FORFAIT badge for forfeited match", () => {
      render(<MatchWidget match={mockForfeitedMatch} />);
      expect(screen.getByText("FORFAIT")).toBeInTheDocument();
    });

    it("shows FT fallback for finished match without scores", () => {
      const noScoreMatch = {
        ...mockFinishedMatchWin,
        homeTeam: { ...mockFinishedMatchWin.homeTeam, score: undefined },
        awayTeam: { ...mockFinishedMatchWin.awayTeam, score: undefined },
      };
      render(<MatchWidget match={noScoreMatch} />);
      expect(screen.getByText("FT")).toBeInTheDocument();
    });

    it("renders long team names without crashing", () => {
      render(<MatchWidget match={mockLongTeamNames} />);
      expect(screen.getByText(/Verbroedering Hofstade/i)).toBeInTheDocument();
    });

    it("score element uses font-mono without conflicting font-title", () => {
      render(<MatchWidget match={mockFinishedMatchWin} />);
      const scoreEl = screen.getByText("3 – 1");
      expect(scoreEl.className).toContain("font-mono");
      expect(scoreEl.className).not.toContain("font-title");
    });

    it("FT element uses font-mono without conflicting font-title", () => {
      const noScoreMatch = {
        ...mockFinishedMatchWin,
        homeTeam: { ...mockFinishedMatchWin.homeTeam, score: undefined },
        awayTeam: { ...mockFinishedMatchWin.awayTeam, score: undefined },
      };
      render(<MatchWidget match={noScoreMatch} />);
      const ftEl = screen.getByText("FT");
      expect(ftEl.className).toContain("font-mono");
      expect(ftEl.className).not.toContain("font-title");
    });
  });

  describe("Accessibility", () => {
    it("renders as a section landmark", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });

  describe("Link wrapping", () => {
    it("links finished match to /wedstrijd/:id", () => {
      render(<MatchWidget match={mockFinishedMatchWin} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `/wedstrijd/${mockFinishedMatchWin.id}`,
      );
    });

    it("links forfeited match to /wedstrijd/:id", () => {
      render(<MatchWidget match={mockForfeitedMatch} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `/wedstrijd/${mockForfeitedMatch.id}`,
      );
    });

    it("links upcoming match to match detail page", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `/wedstrijd/${mockUpcomingMatch.id}`,
      );
    });

    it("links postponed match to calendar page", () => {
      render(<MatchWidget match={mockPostponedMatch} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/kalender");
    });

    it("links stopped match to calendar page", () => {
      render(<MatchWidget match={mockStoppedMatch} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/kalender");
    });

    it("wraps entire card content in one link", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      const link = screen.getByRole("link");
      expect(link).toContainElement(screen.getByText(/KCVV Elewijt/i));
      expect(link).toContainElement(screen.getByText(/KVC Wilrijk/i));
    });

    it("link has visible focus state", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      const link = screen.getByRole("link");
      expect(link.className).toMatch(/focus-visible/);
    });
  });

  describe("Analytics", () => {
    beforeEach(() => {
      trackEventMock.mockClear();
    });

    it("fires homepage_match_widget_clicked on click for finished match", async () => {
      const user = userEvent.setup();
      render(<MatchWidget match={mockFinishedMatchWin} />);
      const link = screen.getByRole("link");
      await user.click(link);
      expect(trackEventMock).toHaveBeenCalledTimes(1);
      expect(trackEventMock).toHaveBeenCalledWith(
        "homepage_match_widget_clicked",
        {
          match_id: mockFinishedMatchWin.id,
          match_status: "finished",
          destination: `/wedstrijd/${mockFinishedMatchWin.id}`,
        },
      );
    });

    it("fires homepage_match_widget_clicked on click for upcoming match", async () => {
      const user = userEvent.setup();
      render(<MatchWidget match={mockUpcomingMatch} />);
      const link = screen.getByRole("link");
      await user.click(link);
      expect(trackEventMock).toHaveBeenCalledTimes(1);
      expect(trackEventMock).toHaveBeenCalledWith(
        "homepage_match_widget_clicked",
        {
          match_id: mockUpcomingMatch.id,
          match_status: "scheduled",
          destination: `/wedstrijd/${mockUpcomingMatch.id}`,
        },
      );
    });
  });
});
