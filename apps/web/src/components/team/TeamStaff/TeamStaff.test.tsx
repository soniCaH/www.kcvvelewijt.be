/**
 * TeamStaff unit tests.
 *
 * Covers:
 *  - resolveFunctionLabel: code map / passthrough / role-bucket fallback / null (#2638)
 *  - Auto-hides (null) when staff empty
 *  - Labelled-first, unlabelled-after ordering AND the unlabelled-notice
 *    line both gated by `unlabelledNotice` — off by default, so a curated
 *    board-page order is never silently reordered (#2638, #2638 review)
 *  - `heading` drives the run's heading text + accessible name — no baked
 *    default (#2575 review)
 *  - One shared <PlayerCard> per member, garment="coat", blend ON (#2901),
 *    linkAffordance (#2477 rule 1, #2485, #2575 review)
 *  - Whitespace-only imageUrl/href normalise to absent
 *  - Resolved function label reaches the card
 *
 * Card-level rendering (photo/illustration state, name rhythm, link-vs-div,
 * the shared grid track) is `<PlayerCard>`'s and `<PersonCardRun>`'s own
 * test responsibility — not restated here.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamStaff, resolveFunctionLabel } from "./TeamStaff";
import type { TeamStaffMemberData } from "./TeamStaff";

describe("resolveFunctionLabel", () => {
  it("maps known PSD codes to readable labels", () => {
    expect(resolveFunctionLabel("T1", undefined)).toBe("Hoofdtrainer");
    expect(resolveFunctionLabel("T2", undefined)).toBe("Assistent-trainer");
    expect(resolveFunctionLabel("TK", undefined)).toBe("Keeperstrainer");
    expect(resolveFunctionLabel("TVJO", undefined)).toBe("Jeugdcoördinator");
  });

  it("is case-insensitive on the code", () => {
    expect(resolveFunctionLabel("t1", undefined)).toBe("Hoofdtrainer");
  });

  it("passes through already-readable free-text values", () => {
    expect(resolveFunctionLabel("Hoofd Jeugdopleiding", undefined)).toBe(
      "Hoofd Jeugdopleiding",
    );
  });

  it("falls back to the role bucket when functionTitle is null", () => {
    expect(resolveFunctionLabel(undefined, "trainer")).toBe("Trainer");
    expect(resolveFunctionLabel(undefined, "afgevaardigde")).toBe(
      "Afgevaardigde",
    );
  });

  it("passes through a free-text board role instead of falling to 'Staf'", () => {
    // Board titles live in `role` with an empty PSD `functionTitle`.
    expect(resolveFunctionLabel(undefined, "Voorzitter")).toBe("Voorzitter");
    expect(resolveFunctionLabel(null, "Secretaris")).toBe("Secretaris");
    expect(resolveFunctionLabel("", "Penningmeester")).toBe("Penningmeester");
  });

  it("returns null — not a last-resort literal — when nothing usable is present (#2638)", () => {
    expect(resolveFunctionLabel(undefined, undefined)).toBeNull();
    expect(resolveFunctionLabel("", "")).toBeNull();
  });

  it("handles null inputs (raw CMS nullable fields)", () => {
    expect(resolveFunctionLabel(null, "trainer")).toBe("Trainer");
    expect(resolveFunctionLabel(null, null)).toBeNull();
  });

  it("prefers functionTitle over role bucket", () => {
    expect(resolveFunctionLabel("T1", "afgevaardigde")).toBe("Hoofdtrainer");
  });
});

const STAFF: TeamStaffMemberData[] = [
  {
    id: "1",
    firstName: "Karel",
    lastName: "Coach",
    functionTitle: "T1",
    imageUrl: "/player-fixtures/player-schulz.jpg",
  },
  {
    id: "2",
    firstName: "Bea",
    lastName: "Bijstand",
    role: "afgevaardigde",
  },
];

describe("TeamStaff — the staff photo blends like a player's (#2901)", () => {
  /**
   * `mix-blend-multiply` erases a white studio matte against the card's cream.
   * `<TeamStaff>` opted out while every staff photo was a free-form editorial
   * upload; #2895 gave staff PSD-synced studio headshots, and the owner's call
   * is that ALL person photos blend — editorial ones on this site are cutouts
   * on white too. Before this, a PSD staff portrait rendered on a stark white
   * rectangle beside blended neighbours.
   */
  const photoClasses = (container: HTMLElement) =>
    // Split rather than substring-match: `md:mix-blend-multiply` contains the
    // token but would not blend at rest.
    container.querySelector("img")?.className.split(/\s+/) ?? [];

  it("blends a staff portrait onto the card's cream", () => {
    const { container } = render(
      <TeamStaff
        heading="Staf"
        staff={[
          {
            id: "psd",
            firstName: "Frank",
            lastName: "Dirix",
            functionTitle: "T1",
            imageUrl: "/player-fixtures/player-schulz.jpg",
          },
        ]}
      />,
    );
    expect(photoClasses(container)).toContain("mix-blend-multiply");
  });
});

describe("TeamStaff", () => {
  it("renders null when staff is empty", () => {
    const { container } = render(<TeamStaff staff={[]} heading="Staf" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders `heading` as both the run's heading text and its accessible name — no baked default (#2575 review)", () => {
    render(<TeamStaff staff={STAFF} heading="De leden" />);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "De leden",
    );
    expect(
      screen.getByRole("region", { name: "De leden" }),
    ).toBeInTheDocument();
  });

  it("renders one shared <PlayerCard> per staff member", () => {
    render(<TeamStaff staff={STAFF} heading="Staf" />);
    expect(screen.getAllByTestId("player-card")).toHaveLength(2);
  });

  it("renders the coat-garment illustration, blended photo, and the link affordance (#2485 / #2575 review, blend added #2901)", () => {
    render(
      <TeamStaff
        staff={[{ ...STAFF[0]!, href: "/staf/12345" }, STAFF[1]!]}
        heading="Staf"
      />,
    );
    const illustrations = screen.getAllByTestId("player-card-illustration");
    expect(illustrations[0]?.getAttribute("data-garment")).toBe("coat");

    const photoImg = screen
      .getAllByTestId("player-card-figure")[0]
      ?.querySelector("img");
    // Blended since #2901 — this asserted the opposite while staff photos were
    // free-form editorial uploads. PSD-synced staff portraits are studio
    // cutouts on white, and the owner's call is that every person photo blends.
    expect(photoImg?.className.split(/\s+/)).toContain("mix-blend-multiply");

    expect(
      screen.getByTestId("player-card-link-affordance"),
    ).toBeInTheDocument();
  });

  it("renders the resolved function label", () => {
    render(<TeamStaff staff={STAFF} heading="Staf" />);
    expect(screen.getByText("Hoofdtrainer")).toBeInTheDocument();
    expect(screen.getByText("Afgevaardigde")).toBeInTheDocument();
  });

  it("normalises a whitespace-only imageUrl/href to absent", () => {
    render(
      <TeamStaff
        staff={[
          {
            id: "3",
            firstName: "Wout",
            lastName: "Wit",
            imageUrl: "   ",
            href: "  ",
          },
        ]}
        heading="Staf"
      />,
    );
    expect(
      screen.getByTestId("player-card-figure").getAttribute("data-state"),
    ).toBe("illustration");
    expect(screen.getByTestId("player-card").tagName).toBe("DIV");
  });

  it("omits the function line — not a placeholder — for an unlabelled member (#2638)", () => {
    // `heading` deliberately isn't "Staf" here: that word is also the
    // section's own heading text, and this assertion is about the
    // per-card function line, not the run's heading.
    render(
      <TeamStaff
        staff={[{ id: "3", firstName: "Wout", lastName: "Wit" }]}
        heading="De leden"
      />,
    );
    expect(screen.queryByText("Staf")).toBeNull();
    const card = screen.getByTestId("player-card");
    expect(card.querySelector("p.font-mono")).toBeNull();
  });

  it("orders labelled cards before unlabelled ones, stable within each part, when unlabelledNotice is set (#2638)", () => {
    render(
      <TeamStaff
        staff={[
          { id: "u1", firstName: "Onbekend", lastName: "Een" },
          { ...STAFF[0]! },
          { id: "u2", firstName: "Onbekend", lastName: "Twee" },
          { ...STAFF[1]! },
        ]}
        heading="Staf"
        unlabelledNotice
      />,
    );
    const names = screen
      .getAllByTestId("player-card")
      .map((card) => card.textContent);
    // Labelled (Karel, Bea) first — in their original relative order —
    // then the unlabelled (Onbekend Een, Onbekend Twee), also in order.
    expect(names[0]).toContain("Karel");
    expect(names[1]).toContain("Bea");
    expect(names[2]).toContain("Onbekend");
    expect(names[2]).toContain("Een");
    expect(names[3]).toContain("Onbekend");
    expect(names[3]).toContain("Twee");
  });

  it("keeps the caller's own order — never reordering — when unlabelledNotice is unset, the board default (#2638 review)", () => {
    // A board page's `staff[]` order is editor-curated in Sanity. Without
    // `unlabelledNotice` (the `<BestuurPage>` default), that order must
    // survive untouched even though this fixture mixes labelled and
    // unlabelled members — the reorder is a repair for a PSD data gap and
    // stays behind the same gate as the notice it's paired with.
    render(
      <TeamStaff
        staff={[
          { id: "u1", firstName: "Onbekend", lastName: "Een" },
          { ...STAFF[0]! },
          { id: "u2", firstName: "Onbekend", lastName: "Twee" },
          { ...STAFF[1]! },
        ]}
        heading="De leden"
      />,
    );
    const names = screen
      .getAllByTestId("player-card")
      .map((card) => card.textContent);
    expect(names[0]).toContain("Onbekend");
    expect(names[0]).toContain("Een");
    expect(names[1]).toContain("Karel");
    expect(names[2]).toContain("Onbekend");
    expect(names[2]).toContain("Twee");
    expect(names[3]).toContain("Bea");
  });

  describe("unlabelled notice (#2638)", () => {
    const withOneUnlabelled = [
      ...STAFF,
      { id: "u1", firstName: "Onbekend", lastName: "Een" },
    ];

    it("renders the ProSoccerData routing line when unlabelledNotice is set and someone is unlabelled", () => {
      render(
        <TeamStaff staff={withOneUnlabelled} heading="Staf" unlabelledNotice />,
      );
      const notice = screen.getByTestId("team-staff-gap-notice");
      expect(notice.textContent).toContain("Niet elke functie is ingevuld");
      expect(notice.textContent).toContain("opent in een nieuw tabblad");
      const link = screen.getByRole("link", { name: /ProSoccerData/ });
      expect(link).toHaveAttribute(
        "href",
        "https://kcvv.prosoccerdata.com/dashboard",
      );
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("stays silent when unlabelledNotice is set but every member is labelled", () => {
      render(<TeamStaff staff={STAFF} heading="Staf" unlabelledNotice />);
      expect(screen.queryByTestId("team-staff-gap-notice")).toBeNull();
    });

    it("stays silent when someone is unlabelled but unlabelledNotice is not set — the board default", () => {
      render(<TeamStaff staff={withOneUnlabelled} heading="De leden" />);
      expect(screen.queryByTestId("team-staff-gap-notice")).toBeNull();
    });
  });
});
