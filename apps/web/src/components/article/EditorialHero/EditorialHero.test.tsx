import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialHero } from "./EditorialHero";

// Shared shell args. `variant` is part of the discriminated union —
// each test provides it explicitly.
const SHARED = {
  title: "De zomer van 2026 begint nu.",
  lead: "Een rustige editorial lead die de toon zet.",
  author: "Tom Janssens",
  date: "6 mei 2026",
} as const;

describe("EditorialHero — shell + placement", () => {
  it("renders the headline title as an <h1>", () => {
    render(<EditorialHero variant="announcement" {...SHARED} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("De zomer van 2026 begint nu.");
  });

  it("renders the lead paragraph when supplied", () => {
    render(<EditorialHero variant="announcement" {...SHARED} />);
    expect(
      screen.getByText("Een rustige editorial lead die de toon zet."),
    ).toBeInTheDocument();
  });

  it("drops the lead block when the prop is empty after trim", () => {
    render(<EditorialHero variant="announcement" {...SHARED} lead="   " />);
    expect(document.querySelector("p.italic")).toBeNull();
  });

  it("falls back to 'Door redactie' when no author is supplied", () => {
    const { author: _author, ...withoutAuthor } = SHARED;
    render(<EditorialHero variant="announcement" {...withoutAuthor} />);
    expect(screen.getByText("Door redactie")).toBeInTheDocument();
  });

  it("renders the supplied author with a 'Door' prefix", () => {
    render(<EditorialHero variant="announcement" {...SHARED} />);
    expect(screen.getByText("Door Tom Janssens")).toBeInTheDocument();
  });

  it("omits the cover column when coverImage is missing", () => {
    const { container } = render(
      <EditorialHero variant="announcement" {...SHARED} />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders the cover image artefact when supplied", () => {
    render(
      <EditorialHero
        variant="announcement"
        {...SHARED}
        coverImage={{
          url: "https://example.com/cover.jpg",
          alt: "Spelers vieren een doelpunt",
        }}
      />,
    );
    expect(
      screen.getByAltText("Spelers vieren een doelpunt"),
    ).toBeInTheDocument();
  });

  it("eager-loads the cover image when priority is set (PERF-1), else lazy-loads", () => {
    const cover = {
      url: "https://example.com/cover.jpg",
      alt: "Cover",
    };
    const { rerender } = render(
      <EditorialHero variant="announcement" {...SHARED} coverImage={cover} />,
    );
    // Default: below-fold consumers keep next/image's lazy-loading.
    expect(screen.getByAltText("Cover")).toHaveAttribute("loading", "lazy");

    rerender(
      <EditorialHero
        variant="announcement"
        {...SHARED}
        coverImage={cover}
        priority
      />,
    );
    // priority → next/image drops lazy-loading for the LCP hero.
    expect(screen.getByAltText("Cover")).not.toHaveAttribute("loading", "lazy");
  });

  it("wraps the hero in an <a href='/nieuws/{slug}'> for placement='homepage'", () => {
    const { container } = render(
      <EditorialHero
        variant="announcement"
        {...SHARED}
        placement="homepage"
        slug="zomer-2026"
      />,
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/nieuws/zomer-2026");
    expect(link?.getAttribute("aria-label")).toBe(
      "De zomer van 2026 begint nu.",
    );
  });

  it("presses the wrapping link down with the canonical PRESS_DOWN_CLASSES (translate motion-safe-gated, shadow always collapses)", () => {
    const { container } = render(
      <EditorialHero
        variant="announcement"
        {...SHARED}
        placement="homepage"
        slug="zomer-2026"
      />,
    );
    const link = container.querySelector("a");
    // Canonical press-down — same as /jeugd's cards, no bespoke lift/tilt.
    expect(link?.className).toContain("motion-safe:hover:translate-x-1");
    expect(link?.className).toContain("motion-safe:hover:translate-y-1");
    expect(link?.className).toContain("hover:shadow-none");
    // The old bespoke lift (negative translate + shadow grow) is gone.
    expect(link?.className).not.toContain("hover:-translate-x-[2px]");
  });

  it("collapses the cover figure's offset shadow on group-hover so it presses with the link", () => {
    const { container } = render(
      <EditorialHero
        variant="announcement"
        {...SHARED}
        placement="homepage"
        slug="zomer-2026"
        coverImage={{
          url: "/test-cover.jpg",
          alt: "Spelers vieren een doelpunt",
        }}
      />,
    );
    const figure = container.querySelector("figure");
    expect(figure).not.toBeNull();
    expect(figure?.className).toContain("group-hover:shadow-none");
    expect(figure?.className).toContain("group-focus-visible:shadow-none");
    // The old tilt+scale treatment is gone.
    expect(figure?.className).not.toContain("group-hover:scale-[1.02]");
    expect(figure?.className).not.toContain("group-hover:-rotate-1");
  });
});

// ─── Announcement variant ────────────────────────────────────────────────────

describe("EditorialHero — announcement variant", () => {
  it("renders the canonical `Aankondiging · ${category} · ${date}` kicker", () => {
    render(
      <EditorialHero
        variant="announcement"
        {...SHARED}
        category="Clubnieuws"
      />,
    );
    expect(screen.getByText("Aankondiging")).toBeInTheDocument();
    expect(screen.getByText("Clubnieuws")).toBeInTheDocument();
    expect(screen.getByText("6 mei 2026")).toBeInTheDocument();
  });

  it("omits the category segment when empty (graceful)", () => {
    render(<EditorialHero variant="announcement" {...SHARED} />);
    expect(screen.getByText("Aankondiging")).toBeInTheDocument();
    expect(screen.getByText("6 mei 2026")).toBeInTheDocument();
  });
});

// ─── Interview variant ─────────────────────────────────────────────────────

describe("EditorialHero — interview variant", () => {
  const player = (
    over: Partial<{
      firstName: string;
      lastName: string;
      jerseyNumber: number;
      position: string;
    }> = {},
  ) => ({
    kind: "player" as const,
    playerRef: {
      firstName: "Jens",
      lastName: "De Smet",
      jerseyNumber: 10,
      position: "Middenvelder",
      ...over,
    },
  });

  it("renders one credit chip per subject", () => {
    render(
      <EditorialHero
        variant="interview"
        {...SHARED}
        subjects={[
          player(),
          player({ firstName: "Lars", lastName: "Peeters", jerseyNumber: 7 }),
        ]}
      />,
    );
    const chips = screen.getAllByTestId("hero-credit-chip");
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveTextContent("Jens De Smet");
    expect(chips[1]).toHaveTextContent("Lars Peeters");
  });

  it("populates kicker meta `#${jersey} · POSITION` only when N=1 player", () => {
    render(
      <EditorialHero variant="interview" {...SHARED} subjects={[player()]} />,
    );
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText("MIDDENVELDER")).toBeInTheDocument();
  });

  it("renders bare 'Interview' kicker for N≥2 subjects", () => {
    render(
      <EditorialHero
        variant="interview"
        {...SHARED}
        subjects={[player(), player({ firstName: "Lars", jerseyNumber: 7 })]}
      />,
    );
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.queryByText("#10")).not.toBeInTheDocument();
  });
});

// ─── Event variant ─────────────────────────────────────────────────────────

describe("EditorialHero — event variant", () => {
  it("renders the kicker `Event · ${ageGroup||competitionTag}` + date", () => {
    render(
      <EditorialHero
        variant="event"
        {...SHARED}
        feature={{ ageGroup: "U13", title: "Tornooi" }}
      />,
    );
    expect(screen.getByText("Event")).toBeInTheDocument();
    expect(screen.getByText("U13")).toBeInTheDocument();
    // Date is intentionally rendered twice — kicker AND the
    // compressed event strip below the hero — so use getAllByText.
    expect(screen.getAllByText("6 mei 2026").length).toBeGreaterThan(0);
  });

  it("renders the day-block overlay on the cover when feature.date is parseable", () => {
    render(
      <EditorialHero
        variant="event"
        {...SHARED}
        coverImage={{ url: "https://x.com/cover.jpg", alt: "Cover" }}
        feature={{ date: "2026-06-15", title: "Tornooi" }}
      />,
    );
    const overlay = screen.getByTestId("hero-day-block");
    // 15 June 2026 = Monday, so weekday short label is MA.
    expect(overlay).toHaveTextContent("MA");
    expect(overlay).toHaveTextContent("15/6");
  });

  it("renders the compressed event strip below the homepage teaser card with location · date · time", () => {
    render(
      <EditorialHero
        variant="event"
        {...SHARED}
        placement="homepage"
        slug="zomertornooi-2026"
        feature={{
          location: "Sportpark Elewijt",
          startTime: "09:00",
          endTime: "17:00",
          title: "Tornooi",
        }}
      />,
    );
    const strip = screen.getByTestId("hero-compressed-event-strip");
    expect(strip).toHaveTextContent("Sportpark Elewijt");
    expect(strip).toHaveTextContent("09:00–17:00");
  });

  it("derives the homepage strip date + time from the session schedule when top-level times are absent", () => {
    render(
      <EditorialHero
        variant="event"
        {...SHARED}
        placement="homepage"
        slug="steakfestijn-2026"
        feature={{
          title: "Steakfestijn",
          location: "Sportpark Elewijt",
          sessions: [
            // Deliberately out of chronological order — the strip must pick
            // the EARLIEST session (25 Sep) for both the date and the hours.
            { date: "2026-09-27", startTime: "11:30", endTime: "15:00" },
            { date: "2026-09-25", startTime: "18:00", endTime: "22:00" },
          ],
        }}
      />,
    );
    const strip = screen.getByTestId("hero-compressed-event-strip");
    expect(strip).toHaveTextContent("25 september 2026");
    expect(strip).toHaveTextContent("18:00–22:00");
  });

  it("omits the compressed event strip on the detail placement (the contained panel renders instead, #2237)", () => {
    render(
      <EditorialHero
        variant="event"
        {...SHARED}
        feature={{
          location: "Sportpark Elewijt",
          startTime: "09:00",
          endTime: "17:00",
          title: "Tornooi",
        }}
      />,
    );
    expect(
      screen.queryByTestId("hero-compressed-event-strip"),
    ).not.toBeInTheDocument();
  });
});

// ─── Transfer variant ──────────────────────────────────────────────────────

describe("EditorialHero — transfer variant", () => {
  it("renders the club row with logos + arrow for incoming direction", () => {
    render(
      <EditorialHero
        variant="transfer"
        {...SHARED}
        feature={{
          direction: "incoming",
          playerName: "Bocar Sarr",
          otherClubName: "KV Mechelen B",
        }}
      />,
    );
    const row = screen.getByTestId("hero-transfer-club-row");
    expect(row).toHaveAttribute("data-direction", "incoming");
    expect(row).toHaveTextContent("KV Mechelen B");
    expect(row).toHaveTextContent("KCVV Elewijt");
  });

  it("uses `transferFact.playerName` as the H1 when set", () => {
    render(
      <EditorialHero
        variant="transfer"
        {...SHARED}
        feature={{
          direction: "outgoing",
          playerName: "Tom De Bie",
          otherClubName: "Sporting Mechelen",
        }}
      />,
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Tom De Bie");
  });

  it("renders the compact meta line below the H1 (age · position only)", () => {
    render(
      <EditorialHero
        variant="transfer"
        {...SHARED}
        feature={{
          direction: "incoming",
          playerName: "Bocar Sarr",
          age: 24,
          position: "Aanvaller",
          otherClubName: "KV Mechelen B",
        }}
      />,
    );
    const meta = screen.getByTestId("hero-transfer-meta-line");
    expect(meta).toHaveTextContent("24 jaar");
    expect(meta).toHaveTextContent("Aanvaller");
    // Club tail removed — that signal lives in the club row above.
    expect(meta).not.toHaveTextContent("van KV Mechelen B");
  });

  it("renders the 'verlengd tot' tail inside the club row (extension)", () => {
    render(
      <EditorialHero
        variant="transfer"
        {...SHARED}
        feature={{
          direction: "extension",
          playerName: "Frédéric Maes",
          age: 28,
          position: "Verdediger",
          until: "2028",
        }}
      />,
    );
    const row = screen.getByTestId("hero-transfer-club-row");
    expect(row).toHaveAttribute("data-direction", "extension");
    expect(row).toHaveTextContent("verlengd tot 2028");
  });

  it("omits the meta line entirely when age + position are missing", () => {
    render(
      <EditorialHero
        variant="transfer"
        {...SHARED}
        feature={{
          direction: "incoming",
          playerName: "Bocar Sarr",
          otherClubName: "KV Mechelen B",
        }}
      />,
    );
    expect(
      screen.queryByTestId("hero-transfer-meta-line"),
    ).not.toBeInTheDocument();
  });
});

// ─── Match variant (5.d-mat H3 score-forward hero) ──────────────────────────

describe("EditorialHero — match variant", () => {
  const COVER = { url: "/cover.jpg", alt: "Cover" };
  const RECAP_MATCH = {
    homeTeam: { name: "KCVV Elewijt" },
    awayTeam: { name: "Racing Mechelen" },
    kcvvSide: "home" as const,
    homeScore: 2,
    awayScore: 1,
    status: "finished" as const,
    competition: "3e Provinciale",
    matchDate: "Za 13 september",
  };
  const PREVIEW_MATCH = {
    homeTeam: { name: "KCVV Elewijt" },
    awayTeam: { name: "Racing Mechelen" },
    kcvvSide: "home" as const,
    kickoffTime: "15:00",
    status: "scheduled" as const,
    competition: "3e Provinciale",
    matchDate: "Za 13 september",
  };

  it("recap: MATCHVERSLAG kicker; bar carries score + FT + competition + date", () => {
    render(
      <EditorialHero
        variant="matchRecap"
        {...SHARED}
        coverImage={COVER}
        match={RECAP_MATCH}
      />,
    );
    expect(screen.getByText("Matchverslag")).toBeInTheDocument();
    // Competition + match date live in the bar subline, not the kicker.
    const bar = screen.getByTestId("hero-match-score-bar");
    expect(bar).toHaveTextContent(/2\s*–\s*1/);
    expect(bar).toHaveTextContent("FT");
    expect(bar).toHaveTextContent("3e Provinciale");
    expect(bar).toHaveTextContent("Za 13 september");
    // Article date is not duplicated into the kicker when the bar is present.
    expect(screen.queryByText("6 mei 2026")).not.toBeInTheDocument();
  });

  it("preview: VOORBESCHOUWING kicker; bar shows kickoff time + competition, no FT", () => {
    render(
      <EditorialHero
        variant="matchPreview"
        {...SHARED}
        coverImage={COVER}
        match={PREVIEW_MATCH}
      />,
    );
    expect(screen.getByText("Voorbeschouwing")).toBeInTheDocument();
    const bar = screen.getByTestId("hero-match-score-bar");
    expect(bar).toHaveTextContent("15:00");
    expect(bar).toHaveTextContent("3e Provinciale");
    expect(bar).not.toHaveTextContent("FT");
  });

  it("falls back to the kicker-only hero (no score bar) when match is null", () => {
    render(
      <EditorialHero
        variant="matchRecap"
        {...SHARED}
        coverImage={COVER}
        match={null}
      />,
    );
    expect(screen.getByText("Matchverslag")).toBeInTheDocument();
    expect(
      screen.queryByTestId("hero-match-score-bar"),
    ).not.toBeInTheDocument();
  });

  it("uses the article date in the kicker when no match data is supplied", () => {
    render(<EditorialHero variant="matchPreview" {...SHARED} />);
    expect(screen.getByText("Voorbeschouwing")).toBeInTheDocument();
    expect(screen.getByText("6 mei 2026")).toBeInTheDocument();
  });
});
