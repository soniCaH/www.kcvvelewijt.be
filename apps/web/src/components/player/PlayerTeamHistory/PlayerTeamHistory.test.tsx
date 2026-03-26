/**
 * PlayerTeamHistory Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PlayerTeamHistory, type TeamHistoryEntry } from "./PlayerTeamHistory";

const mockEntries: TeamHistoryEntry[] = [
  {
    teamName: "Eerste Ploeg",
    teamSlug: "eerste-ploeg",
    startDate: "2022-07-01",
    isCurrent: true,
  },
  {
    teamName: "Beloften",
    teamSlug: "beloften",
    startDate: "2020-07-01",
    endDate: "2022-06-30",
    isCurrent: false,
  },
  {
    teamName: "U21",
    teamSlug: "u21",
    startDate: "2018-07-01",
    endDate: "2020-06-30",
    isCurrent: false,
  },
];

describe("PlayerTeamHistory", () => {
  describe("rendering", () => {
    it("renders section heading", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      expect(screen.getByText("Teamgeschiedenis")).toBeInTheDocument();
    });

    it("renders all team entries", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      expect(screen.getByText("Eerste Ploeg")).toBeInTheDocument();
      expect(screen.getByText("Beloften")).toBeInTheDocument();
      expect(screen.getByText("U21")).toBeInTheDocument();
    });

    it("renders team names as links", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(3);
      expect(links[0]).toHaveAttribute("href", "/ploegen/eerste-ploeg");
      expect(links[1]).toHaveAttribute("href", "/ploegen/beloften");
      expect(links[2]).toHaveAttribute("href", "/ploegen/u21");
    });

    it("displays current team badge for active entry", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      expect(screen.getByText("Huidig team")).toBeInTheDocument();
    });

    it("does not display current team badge for past entries", () => {
      const pastEntries: TeamHistoryEntry[] = [
        {
          teamName: "Eerste Ploeg",
          teamSlug: "eerste-ploeg",
          startDate: "2020-07-01",
          endDate: "2022-06-30",
          isCurrent: false,
        },
      ];
      render(<PlayerTeamHistory entries={pastEntries} />);

      expect(screen.queryByText("Huidig team")).not.toBeInTheDocument();
    });

    it("formats dates correctly with 'heden' for current entries", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      // Current team should show "heden"
      expect(screen.getByText(/jul\.? 2022 - heden/i)).toBeInTheDocument();
    });

    it("formats date ranges correctly for past entries", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      // Past entries should show end dates
      expect(
        screen.getByText(/jul\.? 2020 - jun\.? 2022/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/jul\.? 2018 - jun\.? 2020/i),
      ).toBeInTheDocument();
    });
  });

  describe("single team", () => {
    it("renders correctly with single entry", () => {
      const singleEntry: TeamHistoryEntry[] = [
        {
          teamName: "Eerste Ploeg",
          teamSlug: "eerste-ploeg",
          startDate: "2020-07-01",
          isCurrent: true,
        },
      ];
      render(<PlayerTeamHistory entries={singleEntry} />);

      expect(screen.getByText("Eerste Ploeg")).toBeInTheDocument();
      expect(screen.getByText("Huidig team")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("renders empty message when no entries", () => {
      render(<PlayerTeamHistory entries={[]} />);

      expect(
        screen.getByText("Geen teamgeschiedenis beschikbaar."),
      ).toBeInTheDocument();
    });

    it("still renders section heading in empty state", () => {
      render(<PlayerTeamHistory entries={[]} />);

      expect(screen.getByText("Teamgeschiedenis")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders loading skeleton when isLoading is true", () => {
      render(<PlayerTeamHistory entries={[]} isLoading />);

      expect(
        screen.getByLabelText("Teamgeschiedenis laden..."),
      ).toBeInTheDocument();
    });

    it("does not render entries in loading state", () => {
      render(<PlayerTeamHistory entries={mockEntries} isLoading />);

      expect(screen.queryByText("Eerste Ploeg")).not.toBeInTheDocument();
    });

    it("shows skeleton placeholders", () => {
      const { container } = render(
        <PlayerTeamHistory entries={[]} isLoading />,
      );

      const skeletons = container.querySelectorAll(".bg-gray-300");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("accessibility", () => {
    it("uses semantic list for entries", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("has aria-hidden on decorative timeline elements", () => {
      const { container } = render(<PlayerTeamHistory entries={mockEntries} />);

      const decorativeElements = container.querySelectorAll(
        '[aria-hidden="true"]',
      );
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it("renders team names as accessible links", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to the root element", () => {
      const ref = { current: null };
      render(<PlayerTeamHistory entries={mockEntries} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("forwards ref in loading state", () => {
      const ref = { current: null };
      render(<PlayerTeamHistory entries={[]} isLoading ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("forwards ref in empty state", () => {
      const ref = { current: null };
      render(<PlayerTeamHistory entries={[]} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("className merging", () => {
    it("applies custom className to root element", () => {
      const { container } = render(
        <PlayerTeamHistory entries={mockEntries} className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("applies custom className in loading state", () => {
      const { container } = render(
        <PlayerTeamHistory entries={[]} isLoading className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("styling", () => {
    it("highlights current team with green color", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      const currentTeamLink = screen.getByText("Eerste Ploeg");
      expect(currentTeamLink).toHaveClass("text-kcvv-green-bright");
    });

    it("uses default color for past teams", () => {
      render(<PlayerTeamHistory entries={mockEntries} />);

      const pastTeamLink = screen.getByText("Beloften");
      expect(pastTeamLink).toHaveClass("text-kcvv-gray-dark");
    });
  });
});
