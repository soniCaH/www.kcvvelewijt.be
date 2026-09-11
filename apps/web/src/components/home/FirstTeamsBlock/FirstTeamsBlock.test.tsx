import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { trackEvent } from "@/lib/analytics/track-event";
import { FirstTeamsBlock } from "./FirstTeamsBlock";
import type { FirstTeamVM } from "./first-teams";
import type {
  ScheduleMatch,
  ScheduleReservation,
} from "@/components/match/types";
import type { MatchesSliderPlaceholderVM } from "@/lib/repositories/homepage.repository";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

const aResult: ScheduleMatch = {
  isPlaceholder: false,
  kind: "match",
  id: 101,
  date: new Date("2026-06-21T15:00:00Z"),
  homeTeam: { id: 1235, name: "KCVV Elewijt" },
  awayTeam: { id: 42, name: "SK Londerzeel" },
  homeScore: 3,
  awayScore: 1,
  isHome: true,
  status: "finished",
  competition: "3de Nationale",
};

const aFixture: ScheduleMatch = {
  isPlaceholder: false,
  kind: "match",
  id: 102,
  date: new Date("2026-06-29T13:00:00Z"),
  time: "15:00",
  homeTeam: { id: 77, name: "Sporting Hasselt" },
  awayTeam: { id: 1235, name: "KCVV Elewijt" },
  isHome: false,
  status: "scheduled",
  competition: "3de Nationale",
};

const aTeam: FirstTeamVM = {
  label: "A-ploeg",
  slug: "a-ploeg",
  division: "3de Nationale",
  result: aResult,
  fixture: aFixture,
};

const aTeamResultOnly: FirstTeamVM = {
  label: "A-ploeg",
  slug: "a-ploeg",
  division: "3de Nationale",
  result: aResult,
};

const bTeamFixtureOnly: FirstTeamVM = {
  label: "B-ploeg",
  slug: "b-ploeg",
  division: "2de Provinciale",
  fixture: {
    isPlaceholder: false,
    kind: "match",
    id: 202,
    date: new Date("2026-06-28T17:30:00Z"),
    time: "19:30",
    homeTeam: { id: 1236, name: "KCVV Elewijt B" },
    awayTeam: { id: 99, name: "VK Liedekerke" },
    isHome: true,
    status: "scheduled",
    competition: "2de Provinciale",
  },
};

describe("FirstTeamsBlock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the team label and division", () => {
    render(<FirstTeamsBlock teams={[aTeam]} />);
    expect(screen.getByText("A-ploeg")).toBeInTheDocument();
    // Division appears in the row header (and in each agenda-row caption).
    expect(screen.getAllByText("3de Nationale").length).toBeGreaterThan(0);
  });

  it("renders the result state via the shared match row (scoreline + opponent)", () => {
    render(<FirstTeamsBlock teams={[aTeamResultOnly]} />);
    // <TeamAgendaRow> renders "3 – 1" in both the desktop and mobile layouts.
    // The dash class tolerates en-/em-dash or hyphen without locking the glyph.
    expect(screen.getAllByText(/3\s*[–—-]\s*1/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("SK Londerzeel").length).toBeGreaterThan(0);
    // No fixture → the upcoming side shows the skip placeholder.
    expect(screen.getByText("Geen geplande wedstrijd")).toBeInTheDocument();
  });

  it("renders the upcoming state via the shared match row (kickoff + opponent)", () => {
    render(<FirstTeamsBlock teams={[bTeamFixtureOnly]} />);
    expect(screen.getAllByText("19:30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("VK Liedekerke").length).toBeGreaterThan(0);
    // No result → the result side shows the skip placeholder.
    expect(screen.getByText("Nog geen uitslag")).toBeInTheDocument();
  });

  // #2390 — a kicked-off match takes the result slot before its score is
  // published. <TeamAgendaRow> was expected to degrade on its own here rather
  // than be changed, so this pins that: kickoff time, and no invented score.
  it("renders a kicked-off match in the result slot as a kickoff time, not a score", () => {
    render(
      <FirstTeamsBlock
        teams={[
          {
            label: "B-ploeg",
            slug: "b-ploeg",
            division: "2de Provinciale",
            result: {
              isPlaceholder: false,
              kind: "match",
              id: 203,
              date: new Date("2026-06-25T17:30:00Z"),
              time: "19:30",
              homeTeam: { id: 1236, name: "KCVV Elewijt B" },
              awayTeam: { id: 91, name: "FC Zemst Sportief" },
              isHome: true,
              status: "scheduled",
              competition: "2de Provinciale",
            },
          },
        ]}
      />,
    );
    expect(screen.getAllByText("19:30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("FC Zemst Sportief").length).toBeGreaterThan(0);
    // It occupies the result slot, so the fixture side is the one left empty.
    expect(screen.getByText("Geen geplande wedstrijd")).toBeInTheDocument();
    expect(screen.queryByText("Nog geen uitslag")).not.toBeInTheDocument();
    // Nothing dash-separated: no scoreline may be conjured from absent scores.
    expect(screen.queryByText(/\d\s*[–—-]\s*\d/)).not.toBeInTheDocument();
    // #2404 — and the column still calls itself the result column. PSD has not
    // flipped this match off `scheduled` yet, so a row deriving its own word
    // from status would label the result card "Volgende" — the fixture card's
    // word, on the wrong side of the row.
    expect(screen.getAllByText(/Uitslag/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Volgende/)).not.toBeInTheDocument();
  });

  it("names each column on the row itself, not by cream-vs-green alone (#2404)", () => {
    render(<FirstTeamsBlock teams={[aTeam]} />);
    // The result card carries the outcome, which also de-colours the win tint;
    // the fixture card carries the slot word.
    expect(screen.getAllByText(/Winst/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Volgende/).length).toBeGreaterThan(0);
  });

  it("deep-links each row to its own match detail", () => {
    render(<FirstTeamsBlock teams={[aTeam]} />);
    expect(screen.getByRole("link", { name: /SK Londerzeel/ })).toHaveAttribute(
      "href",
      "/wedstrijd/101",
    );
    expect(
      screen.getByRole("link", { name: /Sporting Hasselt/ }),
    ).toHaveAttribute("href", "/wedstrijd/102");
  });

  it("fires match_card_click with the result source on a result-row click", () => {
    render(<FirstTeamsBlock teams={[aTeamResultOnly]} />);
    fireEvent.click(screen.getByRole("link", { name: /SK Londerzeel/ }));
    expect(trackEvent).toHaveBeenCalledWith("match_card_click", {
      team_slug: "a-ploeg",
      match_id: 101,
      source: "first_teams_result",
    });
  });

  it("fires match_card_click with the fixture source on a fixture-row click", () => {
    render(<FirstTeamsBlock teams={[bTeamFixtureOnly]} />);
    fireEvent.click(screen.getByRole("link", { name: /VK Liedekerke/ }));
    expect(trackEvent).toHaveBeenCalledWith("match_card_click", {
      team_slug: "b-ploeg",
      match_id: 202,
      source: "first_teams_fixture",
    });
  });

  // #2688 — deliberate coverage for a pitch-reservation placeholder (#2606)
  // in either slot. Before this ticket, the homepage only rendered a
  // placeholder correctly as an incidental side effect of #2632's shared
  // `<TeamAgendaRow>` fix — nothing here pinned it, so a future refactor of
  // <FirstTeamAgendaRow> could silently re-break it without a failing test.
  describe("pitch-reservation placeholder (#2606, #2688)", () => {
    const reservation: ScheduleReservation = {
      isPlaceholder: true,
      kind: "reservation",
      id: 90,
      date: new Date("2026-05-09T09:30:00Z"),
      time: "09:30",
      team: { id: 1235, name: "KCVV Elewijt" },
      status: "scheduled",
      competition: "Tornooi",
    };

    it("renders the reservation as the reduced row in the fixture slot — no opponent, no link", () => {
      const { container } = render(
        <FirstTeamsBlock
          teams={[{ ...aTeamResultOnly, fixture: reservation }]}
        />,
      );
      // The subject renders alongside the homepage's "Volgende" kind word
      // (#2632 review finding 1 — the placeholder branch honours `kind`), so
      // it is not its own standalone text node; scope to the placeholder row.
      const row = container.querySelector('[data-row-kind="reservation"]');
      expect(row).not.toBeNull();
      expect(row).toHaveTextContent("Tornooi");
      expect(row).toHaveTextContent("09:30");
      expect(
        screen.queryByRole("link", { name: /Tornooi/ }),
      ).not.toBeInTheDocument();
      // The result slot's real opponent is untouched.
      expect(screen.getAllByText("SK Londerzeel").length).toBeGreaterThan(0);
    });

    it("renders the reservation as the reduced row in the result slot too", () => {
      const { container } = render(
        <FirstTeamsBlock teams={[{ ...aTeam, result: reservation }]} />,
      );
      const row = container.querySelector('[data-row-kind="reservation"]');
      expect(row).not.toBeNull();
      expect(row).toHaveTextContent("Tornooi");
      expect(screen.getAllByText("Sporting Hasselt").length).toBeGreaterThan(0);
    });

    it("never fires match_card_click for a reservation row — nothing was clicked through to", () => {
      const { container } = render(
        <FirstTeamsBlock
          teams={[{ ...aTeamResultOnly, fixture: reservation }]}
        />,
      );
      const row = container.querySelector('[data-row-kind="reservation"]');
      expect(row).not.toBeNull();
      expect(row?.tagName).toBe("ARTICLE");
      if (row) fireEvent.click(row);
      expect(trackEvent).not.toHaveBeenCalledWith(
        "match_card_click",
        expect.anything(),
      );
    });
  });

  // #2399 — the band used to return null here, which is what made a BFF outage
  // look like a finished page. It now holds its shape and names the reason.
  describe("with nothing to show", () => {
    const noMatches = [
      { label: "A-ploeg", slug: "a-ploeg", division: "3de Nationale" },
    ];

    it("keeps the band, drops the rows, and says the feed is empty", () => {
      render(<FirstTeamsBlock teams={noMatches} />);
      expect(
        screen.getByRole("region", { name: "Eerste ploegen" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Volledige kalender/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Nog geen wedstrijden ingepland."),
      ).toBeInTheDocument();
      // The row itself is still dropped — no team label, no skip cards.
      expect(screen.queryByText("A-ploeg")).not.toBeInTheDocument();
      expect(screen.queryByText("Nog geen uitslag")).not.toBeInTheDocument();
    });

    it("says the feed is unavailable when the read failed", () => {
      render(<FirstTeamsBlock teams={noMatches} unavailable />);
      expect(
        screen.getByText(
          "Uitslagen en wedstrijden zijn even niet beschikbaar. Probeer het later opnieuw.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Nog geen wedstrijden ingepland."),
      ).not.toBeInTheDocument();
    });

    it("never shows the notice while a row still has a match", () => {
      render(<FirstTeamsBlock teams={[aTeamResultOnly]} unavailable />);
      expect(
        screen.queryByText("Nog geen wedstrijden ingepland."),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/even niet beschikbaar/),
      ).not.toBeInTheDocument();
    });

    // #2505/#2844 — the Studio-authored off-season notice. `now` is fixed so
    // the countdown state is deterministic.
    describe("the authored placeholder", () => {
      const now = new Date("2026-07-10T12:00:00Z");

      // #2505 round-3 review finding S9 — the render call itself carried no
      // assertion, so factoring it out costs nothing every one of these
      // tests was already checking.
      function renderNoRows(
        placeholder: MatchesSliderPlaceholderVM | null,
        extra?: { unavailable?: boolean },
      ) {
        return render(
          <FirstTeamsBlock
            teams={noMatches}
            placeholder={placeholder}
            now={now}
            {...extra}
          />,
        );
      }

      it("shows the countdown when the kickoff is in the future", () => {
        renderNoRows({ nextSeasonKickoff: new Date("2026-08-02T00:00:00Z") });
        expect(
          screen.getByText("Nog 23 dagen tot de aftrap."),
        ).toBeInTheDocument();
      });

      it("appends the mededeling to the countdown when both are authored", () => {
        renderNoRows({
          nextSeasonKickoff: new Date("2026-08-02T00:00:00Z"),
          announcementText: "Kalender 25-26 volgende week online.",
        });
        expect(
          screen.getByText(
            "Nog 23 dagen tot de aftrap. Kalender 25-26 volgende week online.",
          ),
        ).toBeInTheDocument();
      });

      it("shows the today copy when the kickoff is the current calendar day", () => {
        renderNoRows({ nextSeasonKickoff: new Date("2026-07-10T18:00:00Z") });
        expect(
          screen.getByText("Vandaag de aftrap van het nieuwe seizoen."),
        ).toBeInTheDocument();
      });

      it("falls through a past kickoff to the mededeling", () => {
        renderNoRows({
          nextSeasonKickoff: new Date("2026-07-01T00:00:00Z"),
          announcementText:
            "Groenwit maakt zich klaar voor seizoen 2026-2027 in 3e Nationale.",
        });
        expect(
          screen.getByText(
            "Groenwit maakt zich klaar voor seizoen 2026-2027 in 3e Nationale.",
          ),
        ).toBeInTheDocument();
      });

      it("renders the mededeling as a link when announcementHref is authored", () => {
        renderNoRows({
          announcementText: "Groenwit maakt zich klaar voor seizoen 2026-2027.",
          announcementHref: "/kalender",
        });
        const link = screen.getByRole("link", {
          name: "Groenwit maakt zich klaar voor seizoen 2026-2027.",
        });
        expect(link).toHaveAttribute("href", "/kalender");
        // Internal route — no target/rel, `next/link` handles it natively.
        expect(link).not.toHaveAttribute("target");
        expect(link).not.toHaveAttribute("rel");
      });

      // #2505 review finding 6 — the schema admits absolute http(s) URLs
      // too (`rule.uri({ scheme: ["http", "https"], allowRelative: true })`),
      // and an authored external one must get the same treatment every
      // other CMS-authored link in the app applies.
      it("opens an external announcementHref in a new tab with rel=noopener noreferrer", () => {
        renderNoRows({
          announcementText: "Lees het volledige verhaal op onze partnerpagina.",
          announcementHref: "https://example.org/nieuws",
        });
        const link = screen.getByRole("link", {
          name: "Lees het volledige verhaal op onze partnerpagina.",
        });
        expect(link).toHaveAttribute("href", "https://example.org/nieuws");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });

      it("renders the mededeling as plain text when no href is authored", () => {
        renderNoRows({
          announcementText: "Groenwit maakt zich klaar voor seizoen 2026-2027.",
        });
        expect(
          screen.queryByRole("link", {
            name: "Groenwit maakt zich klaar voor seizoen 2026-2027.",
          }),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText("Groenwit maakt zich klaar voor seizoen 2026-2027."),
        ).toBeInTheDocument();
      });

      it("falls back to the unchanged empty copy when nothing is authored", () => {
        renderNoRows(null);
        expect(
          screen.getByText("Nog geen wedstrijden ingepland."),
        ).toBeInTheDocument();
      });

      it("renders the highlight image above the sentence, at a capped height", () => {
        renderNoRows({
          announcementText: "Groenwit maakt zich klaar voor seizoen 2026-2027.",
          highlightImage: {
            alt: "Ploegfoto zomerstage",
            url: "https://example.com/zomer.jpg",
          },
        });
        const image = screen.getByAltText("Ploegfoto zomerstage");
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute("src", "https://example.com/zomer.jpg");
        // The image sits in a height-capped container, not the frame itself —
        // the frame's own height still comes from its content.
        expect(image.parentElement).toHaveClass("h-40");
      });

      it("suppresses the placeholder image when the read is unavailable", () => {
        renderNoRows(
          {
            announcementText:
              "Groenwit maakt zich klaar voor seizoen 2026-2027.",
            highlightImage: {
              alt: "Ploegfoto zomerstage",
              url: "https://example.com/zomer.jpg",
            },
          },
          { unavailable: true },
        );
        expect(
          screen.queryByAltText("Ploegfoto zomerstage"),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText(
            "Uitslagen en wedstrijden zijn even niet beschikbaar. Probeer het later opnieuw.",
          ),
        ).toBeInTheDocument();
      });
    });
  });
});
