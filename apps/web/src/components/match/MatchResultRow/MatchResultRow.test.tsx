import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatchResultRow } from "./MatchResultRow";
import type { ScheduleMatch } from "../types";

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

function makeMatch(overrides: Partial<ScheduleMatch> = {}): ScheduleMatch {
  return {
    id: 12345,
    date: new Date("2025-09-13T13:30:00Z"),
    time: "14:30",
    homeTeam: kcvv,
    awayTeam: opponent,
    status: "finished",
    competition: "3e provinciale A",
    isHome: true,
    ...overrides,
  };
}

const baseProps = {
  match: makeMatch(),
  href: "/wedstrijd/12345",
};

describe("MatchResultRow", () => {
  describe("stub date", () => {
    it("renders day + Dutch lowercase month abbreviation", () => {
      render(<MatchResultRow {...baseProps} />);
      // 2025-09-13 → "13" + "sep".
      expect(screen.getByText("13")).toBeInTheDocument();
      expect(screen.getByText("sep")).toBeInTheDocument();
    });
  });

  describe("result pill", () => {
    it("renders a W pill on a KCVV win", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({ homeScore: 3, awayScore: 1, isHome: true })}
        />,
      );
      const pill = screen.getByTitle("Winst");
      expect(pill).toHaveTextContent("W");
      expect(pill.className).toContain("bg-jersey");
    });

    it("renders an L pill on a KCVV loss", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({ homeScore: 0, awayScore: 2, isHome: true })}
        />,
      );
      const pill = screen.getByTitle("Verlies");
      expect(pill).toHaveTextContent("L");
      expect(pill.className).toContain("bg-warm");
      // Dark text (not the lock-spec cream) — cream-on-warm fails AA contrast
      // at the pill size. Same override pattern as MatchStatusBadge.STOP.
      expect(pill.className).toContain("text-ink");
    });

    it("renders a G pill on a draw", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({ homeScore: 1, awayScore: 1, isHome: true })}
        />,
      );
      const pill = screen.getByTitle("Gelijkspel");
      expect(pill).toHaveTextContent("G");
      expect(pill.className).toContain("bg-cream-soft");
      expect(pill.className).toContain("border-ink");
    });

    it("flips W/L when KCVV is the away side", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({
            homeTeam: opponent,
            awayTeam: kcvv,
            homeScore: 0,
            awayScore: 2,
            isHome: false,
          })}
        />,
      );
      // KCVV won as the away side.
      expect(screen.getByTitle("Winst")).toBeInTheDocument();
    });

    it("omits the pill entirely when isHome is undefined", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({
            homeScore: 3,
            awayScore: 1,
            isHome: undefined,
          })}
        />,
      );
      expect(
        screen.queryByTitle(/Winst|Verlies|Gelijkspel/),
      ).not.toBeInTheDocument();
    });

    it("omits the pill when scores are missing (upcoming match)", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({
            status: "scheduled",
            homeScore: undefined,
            awayScore: undefined,
          })}
        />,
      );
      expect(
        screen.queryByTitle(/Winst|Verlies|Gelijkspel/),
      ).not.toBeInTheDocument();
    });
  });

  describe("score region", () => {
    it("renders italic 'vs' when scores are missing", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({
            status: "scheduled",
            homeScore: undefined,
            awayScore: undefined,
          })}
        />,
      );
      expect(screen.getByText("vs")).toBeInTheDocument();
    });

    it("renders numeric score when scores are present", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({ homeScore: 3, awayScore: 1 })}
        />,
      );
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("highlighted team", () => {
    it("emphasises the home team when KCVV is at home", () => {
      render(<MatchResultRow {...baseProps} />);
      expect(screen.getByText("KCVV Elewijt")).toHaveClass("font-semibold");
    });

    it("emphasises the away team when KCVV is the away side", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({
            homeTeam: opponent,
            awayTeam: kcvv,
            isHome: false,
          })}
        />,
      );
      expect(screen.getByText("KCVV Elewijt")).toHaveClass("font-semibold");
    });

    it("does not emphasise either team when isHome is undefined", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({ isHome: undefined })}
        />,
      );
      expect(screen.getByText("KCVV Elewijt")).not.toHaveClass("font-semibold");
    });
  });

  describe("status badge integration", () => {
    it("renders the FT corner stamp for finished matches", () => {
      // The stamp sits high enough (`-top-5`) and left enough (`right-12`)
      // to clear the W/L/G result pill, so both can co-exist on the row.
      render(<MatchResultRow {...baseProps} />);
      expect(screen.getByText("FT")).toBeInTheDocument();
    });

    it("renders the CANC badge for cancelled matches", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({ status: "cancelled" })}
        />,
      );
      const badge = screen.getByText("CANC");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("title", "Geannuleerd");
    });

    it.each([
      ["postponed", "PP"],
      ["stopped", "STOP"],
      ["forfeited", "FF"],
    ] as const)(
      "renders the %s edge-state badge alongside any pill",
      (status, abbreviation) => {
        render(<MatchResultRow {...baseProps} match={makeMatch({ status })} />);
        expect(screen.getByText(abbreviation)).toBeInTheDocument();
      },
    );
  });

  describe("link wrapper", () => {
    it("wraps the row in a Link with the provided href", () => {
      render(<MatchResultRow {...baseProps} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/wedstrijd/12345");
    });

    it("surfaces the result + score in the link's aria-label", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({ homeScore: 3, awayScore: 1 })}
        />,
      );
      expect(screen.getByRole("link")).toHaveAttribute(
        "aria-label",
        "KCVV Elewijt — RC Mechelen, Winst 3-1",
      );
    });

    it("omits the result fragment from aria-label for upcoming matches", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({
            status: "scheduled",
            homeScore: undefined,
            awayScore: undefined,
          })}
        />,
      );
      expect(screen.getByRole("link")).toHaveAttribute(
        "aria-label",
        "KCVV Elewijt — RC Mechelen",
      );
    });

    it("includes the score in aria-label even when isHome is undefined", () => {
      // Archive / opponent-of-the-week views render scores without a tracked
      // side, so `result` is null but the score IS visible. SR users still
      // need access to the score.
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({
            homeScore: 3,
            awayScore: 1,
            isHome: undefined,
          })}
        />,
      );
      expect(screen.getByRole("link")).toHaveAttribute(
        "aria-label",
        "KCVV Elewijt — RC Mechelen, 3-1",
      );
    });

    it("applies the canonical press-down hover classes", () => {
      render(<MatchResultRow {...baseProps} />);
      const link = screen.getByRole("link");
      expect(link.className).toContain("motion-safe:hover:translate-x-1");
      expect(link.className).toContain("motion-safe:hover:translate-y-1");
      expect(link.className).toContain("motion-safe:hover:shadow-none");
    });
  });

  describe("isNext annotation", () => {
    it("renders the Volgende stamp when isNext is true", () => {
      render(<MatchResultRow {...baseProps} isNext />);
      expect(screen.getByText("Volgende")).toBeInTheDocument();
    });

    it("does not render the Volgende stamp by default", () => {
      render(<MatchResultRow {...baseProps} />);
      expect(screen.queryByText("Volgende")).not.toBeInTheDocument();
    });
  });

  describe("logo fallback", () => {
    it("renders a typographic initial chip when no logo URL is provided", () => {
      render(
        <MatchResultRow
          {...baseProps}
          match={makeMatch({
            homeTeam: { id: 1235, name: "KCVV Elewijt" },
            awayTeam: { id: 59, name: "RC Mechelen" },
          })}
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
