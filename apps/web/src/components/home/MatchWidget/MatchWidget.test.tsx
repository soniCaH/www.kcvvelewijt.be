import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchWidget } from "./MatchWidget";
import {
  mockUpcomingMatch,
  mockFinishedMatchWin,
  mockFinishedMatchDraw,
  mockPostponedMatch,
  mockForfeitedMatch,
  mockLongTeamNames,
} from "./MatchWidget.mocks";

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
  });

  describe("Accessibility", () => {
    it("renders as a section landmark", () => {
      render(<MatchWidget match={mockUpcomingMatch} />);
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });
});
