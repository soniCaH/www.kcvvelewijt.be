import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatchTeaser } from "./MatchTeaser";

// Mock next/image so we can assert on alt + src without going through the
// Next image-optimisation pipeline.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    return <img src={src} alt={alt} {...rest} />;
  },
}));

const kcvv = {
  id: 1235,
  name: "KCVV Elewijt",
  logo: "https://example.com/kcvv.png",
};
const opponent = {
  id: 59,
  name: "RC Mechelen",
  logo: "https://example.com/rc.png",
};

const baseProps = {
  homeTeam: kcvv,
  awayTeam: opponent,
  date: "2025-09-13",
  time: "14:30",
  venue: "Sportpark Elewijt",
  highlightTeamId: 1235,
  status: "upcoming" as const,
};

describe("MatchTeaser", () => {
  describe("stub date", () => {
    it("renders day + Dutch lowercase month label", () => {
      render(<MatchTeaser {...baseProps} />);
      // 2025-09-13 → day 13, month "september"
      expect(screen.getByText("13")).toBeInTheDocument();
      expect(screen.getByText("september")).toBeInTheDocument();
    });

    it("falls back to a dash when the date string is invalid", () => {
      render(<MatchTeaser {...baseProps} date="not-a-date" />);
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("kicker", () => {
    it("renders weekday · time · venue (uppercase) joined by middots", () => {
      render(<MatchTeaser {...baseProps} />);
      // 2025-09-13 is a Saturday → "ZA"
      expect(screen.getByText("ZA")).toBeInTheDocument();
      expect(screen.getByText("14:30")).toBeInTheDocument();
      expect(screen.getByText("SPORTPARK ELEWIJT")).toBeInTheDocument();
    });

    it("omits missing kicker parts gracefully", () => {
      render(<MatchTeaser {...baseProps} time={undefined} venue={undefined} />);
      expect(screen.getByText("ZA")).toBeInTheDocument();
      expect(screen.queryByText("14:30")).not.toBeInTheDocument();
      expect(screen.queryByText("SPORTPARK ELEWIJT")).not.toBeInTheDocument();
    });
  });

  describe("score region", () => {
    it("renders italic 'vs' for upcoming matches", () => {
      render(<MatchTeaser {...baseProps} />);
      expect(screen.getByText("vs")).toBeInTheDocument();
    });

    it("renders numeric score for finished matches", () => {
      render(
        <MatchTeaser
          {...baseProps}
          status="finished"
          score={{ home: 3, away: 1 }}
        />,
      );
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("highlighted team", () => {
    it("applies font-semibold to the home team when highlightTeamId matches", () => {
      render(<MatchTeaser {...baseProps} />);
      const homeName = screen.getByText("KCVV Elewijt");
      expect(homeName).toHaveClass("font-semibold");
    });

    it("applies font-semibold to the away team when highlightTeamId matches", () => {
      render(
        <MatchTeaser {...baseProps} homeTeam={opponent} awayTeam={kcvv} />,
      );
      const awayName = screen.getByText("KCVV Elewijt");
      expect(awayName).toHaveClass("font-semibold");
    });

    it("does not highlight when no highlightTeamId is provided", () => {
      render(<MatchTeaser {...baseProps} highlightTeamId={undefined} />);
      const homeName = screen.getByText("KCVV Elewijt");
      expect(homeName).not.toHaveClass("font-semibold");
    });
  });

  describe("status badge integration", () => {
    it("does not render a badge for upcoming matches", () => {
      render(<MatchTeaser {...baseProps} />);
      expect(screen.queryByText("FT")).not.toBeInTheDocument();
      expect(screen.queryByText("CANC")).not.toBeInTheDocument();
    });

    it("renders the CANC badge for cancelled matches", () => {
      render(<MatchTeaser {...baseProps} status="cancelled" />);
      const badge = screen.getByText("CANC");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("title", "Geannuleerd");
    });

    it("renders the FT badge for finished matches", () => {
      render(
        <MatchTeaser
          {...baseProps}
          status="finished"
          score={{ home: 2, away: 0 }}
        />,
      );
      expect(screen.getByText("FT")).toBeInTheDocument();
    });
  });

  describe("link wrapper", () => {
    it("wraps the card in an anchor when href is provided", () => {
      render(<MatchTeaser {...baseProps} href="/wedstrijd/12345" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/wedstrijd/12345");
      expect(link).toHaveAttribute("aria-label", "KCVV Elewijt — RC Mechelen");
    });

    it("renders no anchor when href is omitted", () => {
      render(<MatchTeaser {...baseProps} href={undefined} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("applies the canonical press-down hover classes when linked", () => {
      const { container } = render(
        <MatchTeaser {...baseProps} href="/wedstrijd/12345" />,
      );
      const card = container.querySelector('[data-component="match-teaser"]');
      expect(card?.className).toContain("motion-safe:hover:translate-x-1");
      expect(card?.className).toContain("motion-safe:hover:translate-y-1");
      expect(card?.className).toContain("motion-safe:hover:shadow-none");
    });
  });

  describe("team label", () => {
    it("renders the optional teamLabel above the card", () => {
      render(<MatchTeaser {...baseProps} teamLabel="A-Ploeg" />);
      expect(screen.getByText("A-Ploeg")).toBeInTheDocument();
    });
  });

  describe("loading skeleton", () => {
    it("renders a skeleton when isLoading is true", () => {
      const { container } = render(<MatchTeaser {...baseProps} isLoading />);
      expect(
        container.querySelectorAll(".animate-pulse").length,
      ).toBeGreaterThan(0);
      // The card body content should not render in the skeleton.
      expect(screen.queryByText("13")).not.toBeInTheDocument();
      expect(screen.queryByText("KCVV Elewijt")).not.toBeInTheDocument();
    });
  });

  describe("logo fallback", () => {
    it("renders an initial chip when no logo URL is supplied", () => {
      render(
        <MatchTeaser
          {...baseProps}
          homeTeam={{ id: 1235, name: "KCVV Elewijt" }}
          awayTeam={{ id: 59, name: "RC Mechelen" }}
        />,
      );
      expect(
        screen.getByText("K", { selector: "[aria-hidden='true']" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("R", { selector: "[aria-hidden='true']" }),
      ).toBeInTheDocument();
    });
  });
});
