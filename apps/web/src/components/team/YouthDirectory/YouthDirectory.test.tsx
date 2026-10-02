/**
 * YouthDirectory unit tests.
 *
 * Covers:
 *  - Auto-hide (null) when no divisions have teams
 *  - Empty groups omitted; only populated divisions render
 *  - Age-code card per team, linking to its detail
 *  - The section heading, which the route supplies (#2641)
 *  - The division sub-line, present only when the club published one (#2641)
 *  - The Reserven group: ranged past the youth ladder, name caption,
 *    initialled jersey
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { YouthDivisionGroup } from "@/lib/utils/group-teams";
import { tapeRotationFor } from "@/components/design-system/TapeStrip";
import { YouthDirectory } from "./YouthDirectory";
import { reservenTeam, youthTeam as team } from "./youth-directory.fixtures";

const divisions: YouthDivisionGroup[] = [
  { label: "Bovenbouw", range: "U17–U21", teams: [team("U17")] },
  { label: "Middenbouw", range: "U12–U16", teams: [] },
  { label: "Onderbouw", range: "U6–U11", teams: [team("U9"), team("U6")] },
];

/** The heading `/jeugd` passes — the directory no longer hard-codes one. */
const HEADING = "Jeugdwerking";

const renderDirectory = (divisions: YouthDivisionGroup[], heading = HEADING) =>
  render(<YouthDirectory heading={heading} divisions={divisions} />);

/** How many `<p>` a card carries: the caption, plus a sub-line if it has one. */
const paragraphsIn = (card: HTMLElement) => card.querySelectorAll("p").length;

describe("YouthDirectory", () => {
  it("returns null when no division has teams", () => {
    const { container } = renderDirectory([
      { label: "Bovenbouw", range: "U17–U21", teams: [] },
      { label: "Middenbouw", range: "U12–U16", teams: [] },
    ]);
    expect(container.firstChild).toBeNull();
  });

  it("omits empty divisions and renders only populated ones", () => {
    renderDirectory(divisions);
    const groups = screen.getAllByTestId("youth-division");
    expect(groups).toHaveLength(2); // Bovenbouw + Onderbouw (Middenbouw empty)
  });

  it("renders an age-code card per team linking to its detail", () => {
    renderDirectory(divisions);
    const cards = screen.getAllByTestId("youth-team-card");
    expect(cards).toHaveLength(3);
    const u17 = cards.find((c) => c.textContent?.includes("U17"));
    expect(u17?.getAttribute("href")).toBe("/ploegen/kcvv-elewijt-u17");
  });

  it("renders the group's range beside its label", () => {
    renderDirectory(divisions);
    const [bovenbouw] = screen.getAllByRole("heading", { level: 3 });
    expect(bovenbouw).toHaveTextContent("Bovenbouw · U17–U21");
  });

  it("renders the squad photo when a team has one", () => {
    renderDirectory([
      {
        label: "Bovenbouw",
        range: "U17–U21",
        teams: [team("U17", "/images/ploeg.jpg")],
      },
    ]);
    // #2559 rule 1: the card title names the team, so the squad photo is
    // decorative — and "ploegfoto" was one of three nouns for one photograph.
    expect(document.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("falls back to the JerseyShirt illustration when a team has no photo", () => {
    renderDirectory([
      { label: "Bovenbouw", range: "U17–U21", teams: [team("U17")] },
    ]);
    // No squad <img>; the JerseyShirt fallback renders in its place and is
    // silent (#2559 rule 4) — the artefact answers to the same rule as the
    // photo it stands in for.
    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector("figure[aria-hidden]")).toBeInTheDocument();
  });

  describe("the section heading (#2641)", () => {
    it("heads and names the section with what the route passed", () => {
      // `/ploegen` renders the same list over every team its two flagships
      // leave out, Reserven included — so the youth heading was a claim the
      // section could not make on one of the two pages that render it.
      renderDirectory(divisions, "Andere");

      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h2).toHaveTextContent("Andere");
      expect(h2.textContent).not.toContain(HEADING);
      expect(screen.getByTestId("youth-directory")).toHaveAttribute(
        "aria-label",
        "Andere",
      );
    });
  });

  describe("the division sub-line (#2641)", () => {
    it("prints the reeks when the club published one", () => {
      renderDirectory([{ label: "Reserven", teams: [reservenTeam()] }]);
      const card = screen.getByTestId("youth-team-card");
      expect(within(card).getByText("Reserven VV AH")).toBeInTheDocument();
      expect(paragraphsIn(card)).toBe(2); // caption + sub-line
    });

    it("stays empty when there is none, rather than echoing the team's own name", () => {
      // `divisionFull` is null on all sixteen youth teams, so the deleted
      // `?? team.name` fallback made every youth card repeat its own caption —
      // five of them with the double space the federation name carries.
      renderDirectory([
        {
          label: "Onderbouw",
          range: "U6–U11",
          teams: [team("U9", null, { name: "KCVVE  U9" })],
        },
      ]);
      const card = screen.getByTestId("youth-team-card");
      expect(card.textContent).not.toContain("KCVVE");
      expect(paragraphsIn(card)).toBe(1); // the caption alone
    });
  });

  describe("the Reserven group", () => {
    const reserven: YouthDivisionGroup[] = [
      { label: "Reserven", teams: [reservenTeam()] },
    ];

    it("renders the heading bare, with no ` · range` separator", () => {
      // It is not an age band, and the owner ruled against a label saying so:
      // no label beats one generic enough to be worth the pixels. The section
      // heading above the groups carries that framing instead (#2641).
      renderDirectory(reserven);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Reserven");
      expect(heading.textContent).not.toContain("·");
    });

    it("still renders the group's card, linking to its detail", () => {
      renderDirectory(reserven);
      const cards = screen.getAllByTestId("youth-team-card");
      expect(cards).toHaveLength(1);
      expect(cards[0].getAttribute("href")).toBe("/ploegen/reserven");
    });

    it("captions by name rather than by the senior age code 'A'", () => {
      renderDirectory(reserven);
      const card = screen.getByTestId("youth-team-card");
      // "A" alone would read as the A-ploeg; the name is the honest caption,
      // and what sits under it is the reeks, not the caption again.
      expect(within(card).getByText("Reserven")).toBeInTheDocument();
      expect(card.textContent).not.toMatch(/\bA\b/);
    });

    it("puts the name's initial on the jersey, not the whole word", () => {
      renderDirectory(reserven);
      const jersey = document.querySelector(
        "figure[aria-hidden]",
      ) as HTMLElement;
      expect(jersey).toHaveTextContent("R");
      expect(jersey.textContent).not.toContain("Reserven");
    });
  });

  describe("the Youth Division tone (#2615)", () => {
    // One team per division so each card's own tone is unambiguous — asserts
    // the resolved tone via `data-tone`, never a class string, per the AC.
    const oneOfEach: YouthDivisionGroup[] = [
      { label: "Reserven", teams: [reservenTeam()] },
      { label: "Bovenbouw", range: "U17–U21", teams: [team("U17")] },
      { label: "Middenbouw", range: "U12–U16", teams: [team("U13")] },
      { label: "Onderbouw", range: "U6–U11", teams: [team("U9")] },
    ];

    it("colours each card by its own division, not the group it renders inside", () => {
      renderDirectory(oneOfEach);
      const cards = screen.getAllByTestId("youth-team-card");
      // The JerseyShirt fallback also renders the age code as its chest
      // overlay text, so a caption's `data-tone` is read off the `<p>`
      // directly rather than by matching text (which the chest duplicates).
      const captionTone = (card: HTMLElement) =>
        card.querySelector("p[data-tone]")?.getAttribute("data-tone");

      expect(captionTone(cards[0])).toBe("ink");
      expect(captionTone(cards[1])).toBe("jersey-deep");
      expect(captionTone(cards[2])).toBe("alert");
      expect(captionTone(cards[3])).toBe("warning");
    });

    it("colours the group bar's tick with the same tone as its cards", () => {
      renderDirectory(oneOfEach);
      const ticks = screen.getAllByTestId("youth-division-tick");

      expect(ticks.map((t) => t.dataset.tone)).toEqual([
        "ink",
        "jersey-deep",
        "alert",
        "warning",
      ]);
    });
  });

  describe("the tilt scale (#3330)", () => {
    const cardsOf = (teams: ReturnType<typeof team>[]) => {
      renderDirectory([{ label: "Onderbouw", range: "U6–U11", teams }]);
      return screen.getAllByTestId("youth-team-card");
    };
    const lean = (card: HTMLElement) =>
      card.querySelector("[data-rotation]")?.getAttribute("data-rotation");
    const tape = (card: HTMLElement) =>
      card
        .querySelector("[data-length][data-position]")
        ?.getAttribute("data-rotation");

    it("leans every card by a named slight-tier entry, never a free-form degree", () => {
      const cards = cardsOf(
        ["U6", "U7", "U8", "U9", "U10"].map((a) => team(a)),
      );
      for (const card of cards) {
        expect(["a", "b", "c", "d"]).toContain(lean(card));
      }
    });

    it("derives a card's tape angle from the team's identity, wherever the slot is", () => {
      const [, second] = cardsOf([team("U6"), team("U9")]);
      expect(tape(second!)).toBe(tapeRotationFor(team("U9")._id));
    });
  });
});
