import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpcomingMatches } from "./UpcomingMatches";
import {
  mockUpcomingFive,
  mockUpcomingThree,
  mockUpcomingTwelve,
  mockUpcomingSingleTeam,
  mockUpcomingWithReservation,
  mockUpcomingWithTournament,
} from "./UpcomingMatches.mocks";
import { trackEvent } from "@/lib/analytics/track-event";
import type { UpcomingMatch } from "@/components/match/types";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

/** Row links only — excludes the `/kalender` link revealed on expand. */
const rowLinks = () =>
  screen.getAllByRole("link", { name: /^(?!Volledige).*/i });

const chip = (name: RegExp) => screen.getByRole("button", { name });

beforeEach(() => vi.clearAllMocks());

describe("UpcomingMatches", () => {
  it("returns null when matches list is empty", () => {
    const { container } = render(<UpcomingMatches matches={[]} />);
    expect(container.firstChild).toBeNull();
  });

  // #2505/#2844 — the neighbouring bug: a genuinely empty feed still
  // collapses (above), but a failed read now holds the band's shape.
  describe("unavailable", () => {
    it("holds the band's shape and shows the failure notice when the read failed", () => {
      render(<UpcomingMatches matches={[]} unavailable />);
      expect(
        screen.getByRole("region", { name: "Komende wedstrijden" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Komende wedstrijden zijn/).closest("p"),
      ).toHaveTextContent(
        "Komende wedstrijden zijn even niet beschikbaar. Probeer het later opnieuw.",
      );
    });

    it("renders the normal list, ignoring `unavailable`, when rows are present", () => {
      render(<UpcomingMatches matches={mockUpcomingThree} unavailable />);
      expect(rowLinks()).toHaveLength(mockUpcomingThree.length);
      expect(
        screen.queryByText(/even niet beschikbaar/),
      ).not.toBeInTheDocument();
    });
  });

  it("renders the first 5 rows collapsed when total > 5", () => {
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    expect(rowLinks()).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: /toon alle 12 wedstrijden/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/volledige kalender/i)).not.toBeInTheDocument();
  });

  it("sorts unsorted input chronologically before slicing", () => {
    const shuffled = [
      mockUpcomingTwelve[6]!,
      mockUpcomingTwelve[0]!,
      mockUpcomingTwelve[9]!,
      mockUpcomingTwelve[3]!,
      mockUpcomingTwelve[1]!,
      mockUpcomingTwelve[11]!,
      mockUpcomingTwelve[2]!,
      mockUpcomingTwelve[8]!,
      mockUpcomingTwelve[4]!,
      mockUpcomingTwelve[5]!,
      mockUpcomingTwelve[7]!,
      mockUpcomingTwelve[10]!,
    ];
    render(<UpcomingMatches matches={shuffled} />);
    const renderedHrefs = rowLinks().map((el) => el.getAttribute("href"));
    const expected = mockUpcomingTwelve
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
      .map((m) => `/wedstrijd/${m.id}`);
    expect(renderedHrefs).toEqual(expected);
  });

  it("hides the expand button when exactly 5 upcoming matches", () => {
    render(<UpcomingMatches matches={mockUpcomingFive} />);
    expect(
      screen.queryByRole("button", { name: /toon alle/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/volledige kalender/i)).not.toBeInTheDocument();
  });

  it("hides the expand button when fewer than 5 upcoming matches", () => {
    render(<UpcomingMatches matches={mockUpcomingThree} />);
    expect(
      screen.queryByRole("button", { name: /toon alle/i }),
    ).not.toBeInTheDocument();
  });

  it("links each row to /wedstrijd/{id}", () => {
    render(<UpcomingMatches matches={mockUpcomingThree} />);
    const links = rowLinks();
    expect(links).toHaveLength(mockUpcomingThree.length);
    mockUpcomingThree.forEach((m, i) => {
      expect(links[i]).toHaveAttribute("href", `/wedstrijd/${m.id}`);
    });
  });

  // ── AC4 · one home/away vocabulary (drill 2398-1, variant B) ──────────────

  it("renders the Thuis badge when KCVV is the home team", () => {
    render(<UpcomingMatches matches={[mockUpcomingFive[0]!]} />);
    expect(screen.getByText("Thuis")).toBeInTheDocument();
    expect(screen.queryByText("Uit")).not.toBeInTheDocument();
  });

  it("renders the Uit badge when KCVV is the away team", () => {
    render(<UpcomingMatches matches={[mockUpcomingFive[1]!]} />);
    expect(screen.getByText("Uit")).toBeInTheDocument();
    expect(screen.queryByText("Thuis")).not.toBeInTheDocument();
  });

  // Variant B: where the word is present the glyph is decoration, so the fact
  // is announced once. The dense TeamAgendaRow, which has no word, keeps its
  // labelled glyph — that asymmetry is the lock, not an oversight.
  it("keeps the badge glyph decorative so the fact is announced once", () => {
    render(<UpcomingMatches matches={[mockUpcomingFive[0]!]} />);
    expect(screen.queryByLabelText("Thuiswedstrijd")).not.toBeInTheDocument();
  });

  // Regression: the badge used to take `isHome={homeIsKcvv}`, so a fixture
  // where neither id matched fell into the falsy branch and claimed "Uit".
  it("renders no badge when neither team is KCVV, rather than claiming Uit", () => {
    const neitherIsKcvv: UpcomingMatch = {
      ...mockUpcomingFive[0]!,
      homeTeam: { id: 59, name: "KVC Wilrijk" },
      awayTeam: { id: 628, name: "City Pirates" },
    };
    render(<UpcomingMatches matches={[neitherIsKcvv]} />);
    expect(screen.queryByText("Uit")).not.toBeInTheDocument();
    expect(screen.queryByText("Thuis")).not.toBeInTheDocument();
    // The row itself still renders — an unplaceable fixture is not a broken one.
    expect(rowLinks()).toHaveLength(1);
  });

  // KCVV vs KCVV is real data (pitch-reservation placeholders). It reads as a
  // home fixture, and both names stay emphasised.
  it("treats a KCVV-vs-KCVV fixture as home", () => {
    const bothAreKcvv: UpcomingMatch = {
      ...mockUpcomingFive[0]!,
      homeTeam: { id: 1235, name: "KCVV Elewijt" },
      awayTeam: { id: 1235, name: "KCVV Elewijt B" },
    };
    render(<UpcomingMatches matches={[bothAreKcvv]} />);
    expect(screen.getByText("Thuis")).toBeInTheDocument();
    expect(screen.queryByText("Uit")).not.toBeInTheDocument();
  });

  // ── AC1 · venue in the caption line ───────────────────────────────────────

  it("renders the venue in the caption alongside team and competition", () => {
    render(<UpcomingMatches matches={[mockUpcomingFive[0]!]} />);
    expect(
      screen.getByText(
        /A-Ploeg · 3e Afdeling VV · Driesstraat 32, 1982 Elewijt/,
      ),
    ).toBeInTheDocument();
  });

  it("omits the venue separator when PSD supplies no venue", () => {
    render(<UpcomingMatches matches={[mockUpcomingFive[1]!]} />);
    const caption = screen.getByText(/U21 · Provinciaal U21/);
    expect(caption.textContent).toBe("U21 · Provinciaal U21");
  });

  // ── AC2 · team-chip filter ────────────────────────────────────────────────

  // Chips are label-sorted, not chronological or count-ranked, so a chip keeps
  // the same position from week to week as fixtures come and go.
  it("renders one label-sorted chip per distinct team plus an Alles reset", () => {
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    const filterGroup = screen.getByRole("group", {
      name: /filter wedstrijden op ploeg/i,
    });
    const tabs = within(filterGroup).getAllByRole("button");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Alles12",
      "A-Ploeg6",
      "B-Ploeg1",
      "U131",
      "U151",
      "U171",
      "U212",
    ]);
  });

  it("hides the filter entirely when every match is the same team", () => {
    render(<UpcomingMatches matches={mockUpcomingSingleTeam} />);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("narrows the visible rows to the selected team", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(chip(/U21/));
    const hrefs = rowLinks().map((el) => el.getAttribute("href"));
    expect(hrefs).toEqual(["/wedstrijd/502", "/wedstrijd/511"]);
  });

  it("restores the full list when Alles is reselected", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(chip(/U21/));
    expect(rowLinks()).toHaveLength(2);
    await user.click(chip(/Alles/));
    expect(rowLinks()).toHaveLength(5);
  });

  it("drops the expand control when the filtered set fits in one page", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(chip(/U21/));
    expect(
      screen.queryByRole("button", { name: /toon (alle|minder)/i }),
    ).not.toBeInTheDocument();
  });

  it("re-collapses when a filter change shrinks an expanded list", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(
      screen.getByRole("button", { name: /toon alle 12 wedstrijden/i }),
    );
    expect(rowLinks()).toHaveLength(12);
    await user.click(chip(/A-Ploeg/));
    expect(rowLinks()).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: /toon alle 6 wedstrijden/i }),
    ).toBeInTheDocument();
  });

  // ── AC3 · reversible expand ───────────────────────────────────────────────

  it("expands to show all matches and reveals the /kalender link", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(
      screen.getByRole("button", { name: /toon alle 12 wedstrijden/i }),
    );
    expect(rowLinks()).toHaveLength(12);
    expect(
      screen.getByRole("link", { name: /volledige kalender/i }),
    ).toHaveAttribute("href", "/kalender");
  });

  it("collapses back to 5 rows via Toon minder", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(
      screen.getByRole("button", { name: /toon alle 12 wedstrijden/i }),
    );
    await user.click(screen.getByRole("button", { name: /toon minder/i }));
    expect(rowLinks()).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: /toon alle 12 wedstrijden/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/volledige kalender/i)).not.toBeInTheDocument();
  });

  it("starts expanded when initialExpanded=true", () => {
    render(<UpcomingMatches matches={mockUpcomingTwelve} initialExpanded />);
    expect(rowLinks()).toHaveLength(12);
    expect(
      screen.getByRole("link", { name: /volledige kalender/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /toon minder/i }),
    ).toBeInTheDocument();
  });

  // ── AC5 · analytics ───────────────────────────────────────────────────────

  it("fires match_agenda_filter with the facet and the resulting count", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(chip(/U21/));
    expect(trackEvent).toHaveBeenCalledWith("match_agenda_filter", {
      filter_type: "U21",
      count: 2,
    });
  });

  it("does not re-fire match_agenda_filter when the active chip is reselected", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(chip(/U21/));
    vi.mocked(trackEvent).mockClear();
    await user.click(chip(/U21/));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  // The direction is in the event name, not an `action` param — the only
  // registered dimension that fit is GA4's "Error action".
  it("fires a distinct event for each expand direction", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingTwelve} />);
    await user.click(
      screen.getByRole("button", { name: /toon alle 12 wedstrijden/i }),
    );
    expect(trackEvent).toHaveBeenCalledWith("match_agenda_expand", {
      count: 12,
    });
    await user.click(screen.getByRole("button", { name: /toon minder/i }));
    expect(trackEvent).toHaveBeenCalledWith("match_agenda_collapse", {
      count: 12,
    });
  });

  it("fires match_card_click carrying the row's match id and surface", async () => {
    const user = userEvent.setup();
    render(<UpcomingMatches matches={mockUpcomingThree} />);
    await user.click(within(rowLinks()[0]!).getByText(/KVC Wilrijk/));
    expect(trackEvent).toHaveBeenCalledWith("match_card_click", {
      match_id: 501,
      source: "home_agenda",
    });
  });

  // #2606, #2688 — the other-teams agenda is the surface most likely to carry
  // a pitch-reservation placeholder: it renders exactly the non-senior/youth
  // matches, and youth tournaments are where reservations come from. Before
  // #2688 this row rendered as an ordinary linked "KCVV Elewijt — KCVV
  // Elewijt" fixture with a home badge — nothing pinned it.
  describe("pitch-reservation placeholder (#2606, #2688)", () => {
    it("renders the reservation as a reduced, non-linking row — no opponent, no home/away badge", () => {
      const { container } = render(
        <UpcomingMatches matches={mockUpcomingWithReservation} />,
      );
      // The reservation is dated earliest, so it takes one of the 5 visible
      // (collapsed) slots — 4 real fixtures link, the reservation does not.
      expect(rowLinks()).toHaveLength(4);
      expect(container).toHaveTextContent("Tornooi");
      expect(screen.queryByText(/KCVV Elewijt.*KCVV Elewijt/)).toBeNull();
    });

    it("gives the reservation row its own accessible name via <article>, not an unlabelled <div>", () => {
      render(<UpcomingMatches matches={mockUpcomingWithReservation} />);
      const article = screen.getByRole("article", { name: /Tornooi/ });
      expect(article).toBeInTheDocument();
      // The one marker every reservation renderer carries (#2688).
      expect(article).toHaveAttribute("data-row-kind", "reservation");
    });

    it("prints the status wording on a cancelled reservation — a dead slot must not read as live", () => {
      const cancelled = mockUpcomingWithReservation.map((m) =>
        m.isPlaceholder ? { ...m, status: "cancelled" as const } : m,
      );
      render(<UpcomingMatches matches={cancelled} />);
      const article = screen.getByRole("article", { name: /Tornooi/ });
      expect(article).toHaveTextContent("Geannuleerd");
    });

    it("still buckets the reservation under its own squad's filter chip", () => {
      render(<UpcomingMatches matches={mockUpcomingWithReservation} />);
      expect(chip(/U13/)).toBeInTheDocument();
    });
  });

  // #2696/#2802 — the gap this ticket closes: `<UpcomingMatchesClient>`
  // never called `isReducedMatchRow`, so a not-yet-played tournament
  // fixture for a non-senior team rendered the ordinary linked two-crest
  // scoreboard here, even though every other reservation-aware renderer
  // already reduced it.
  describe("tournament fixture with no result yet (#2696/#2802)", () => {
    it("renders the tournament fixture as a reduced, non-linking row naming the other club", () => {
      const { container } = render(
        <UpcomingMatches matches={mockUpcomingWithTournament} />,
      );
      expect(rowLinks()).toHaveLength(4);
      expect(container).toHaveTextContent("Tornooi");
      expect(container).toHaveTextContent("FC Zemst Sportief");
    });

    it("gives the tournament row its own accessible name, marked data-row-kind=reduced not reservation", () => {
      render(<UpcomingMatches matches={mockUpcomingWithTournament} />);
      const article = screen.getByRole("article", { name: /Tornooi/ });
      expect(article).toHaveAttribute("data-row-kind", "reduced");
      expect(article).not.toHaveAttribute("data-row-kind", "reservation");
    });

    it("still buckets the tournament fixture under its own squad's filter chip", () => {
      render(<UpcomingMatches matches={mockUpcomingWithTournament} />);
      expect(chip(/U9/)).toBeInTheDocument();
    });
  });
});
