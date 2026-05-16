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

  it("renders the compressed event strip below the hero with location · date · time", () => {
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
    const strip = screen.getByTestId("hero-compressed-event-strip");
    expect(strip).toHaveTextContent("Sportpark Elewijt");
    expect(strip).toHaveTextContent("09:00–17:00");
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
