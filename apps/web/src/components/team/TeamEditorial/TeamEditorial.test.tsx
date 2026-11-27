/**
 * TeamEditorial unit tests.
 *
 * Covers:
 *  - The section never auto-hides: the "Trainingen" block routes to
 *    ProSoccerData unconditionally (#2637 — team.trainingSchedule was
 *    deleted outright by #2582, so there is no field left to gate it on)
 *  - "Trainingen" block: always renders, interpolates `teamLabel`, links to
 *    `EXTERNAL_LINKS.psdDashboard`, opens in a new tab
 *  - "Het verhaal" block: renders body prose; lifts the first pullquote run
 *    into a PullQuote card; no pullquote → no card; auto-hides when empty
 *  - Contact block renders PT; auto-hides when empty
 *  - Per-block independence (one present, other absent)
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { EXTERNAL_LINKS } from "@/lib/constants";
import { TeamEditorial } from "./TeamEditorial";

const block = (
  ...spans: ReadonlyArray<{ text: string; marks?: string[] }>
): PortableTextBlock => {
  return {
    _type: "block",
    _key: `block-${spans.map((s) => s.text.slice(0, 3)).join("-")}`,
    style: "normal",
    children: spans.map((span, i) => ({
      _type: "span",
      _key: `span-${i}`,
      text: span.text,
      marks: span.marks ?? [],
    })),
    markDefs: [],
  } as unknown as PortableTextBlock;
};

const BODY_WITH_PULLQUOTE: PortableTextBlock[] = [
  block(
    { text: "De A-ploeg speelt al jaren in de hoogste reeks. " },
    { text: "Dit is onze thuis.", marks: ["pullquote"] },
  ),
];

const BODY_NO_PULLQUOTE: PortableTextBlock[] = [
  block({ text: "Een korte beschrijving zonder citaat." }),
];

const CONTACT: PortableTextBlock[] = [
  block({ text: "Secretariaat: info@kcvvelewijt.be" }),
];

describe("TeamEditorial", () => {
  it("never auto-hides — the Trainingen block routes unconditionally even when body and contactInfo are both empty", () => {
    render(<TeamEditorial body={[]} contactInfo={null} teamLabel="U13" />);
    expect(screen.getByTestId("team-editorial")).toBeInTheDocument();
    expect(screen.getByTestId("team-editorial-training")).toBeInTheDocument();
  });

  describe("Trainingen", () => {
    it("renders the routing sentence with the given teamLabel", () => {
      render(<TeamEditorial teamLabel="U8" />);
      expect(
        screen.getByTestId("team-editorial-training").textContent,
      ).toContain("De trainingsuren van U8 staan nog niet op de site.");
    });

    it("links to EXTERNAL_LINKS.psdDashboard, opening in a new tab", () => {
      render(<TeamEditorial teamLabel="U8" />);
      const link = screen.getByRole("link", { name: /ProSoccerData/i });
      expect(link).toHaveAttribute("href", EXTERNAL_LINKS.psdDashboard);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("still renders even when body and contactInfo are both present — the routing line is unconditional, not a fallback", () => {
      render(
        <TeamEditorial
          body={BODY_WITH_PULLQUOTE}
          contactInfo={CONTACT}
          teamLabel="U8"
        />,
      );
      expect(screen.getByTestId("team-editorial-training")).toBeInTheDocument();
    });
  });

  describe("Het verhaal (body)", () => {
    it("renders the body prose", () => {
      render(<TeamEditorial body={BODY_WITH_PULLQUOTE} teamLabel="U13" />);
      expect(
        screen.getByTestId("team-editorial-verhaal").textContent,
      ).toContain("De A-ploeg speelt al jaren");
    });

    it("lifts the first pullquote run into a PullQuote card", () => {
      render(<TeamEditorial body={BODY_WITH_PULLQUOTE} teamLabel="U13" />);
      // "Dit is onze thuis." appears twice: inline highlight + lifted card.
      const matches = screen.getAllByText(/Dit is onze thuis\./);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it("renders no PullQuote card when the body has no pullquote", () => {
      render(<TeamEditorial body={BODY_NO_PULLQUOTE} teamLabel="U13" />);
      const matches = screen.getAllByText(/Een korte beschrijving/);
      // Only the inline prose occurrence — no lifted duplicate.
      expect(matches).toHaveLength(1);
    });

    it("auto-hides the verhaal block when body is empty", () => {
      render(<TeamEditorial contactInfo={CONTACT} teamLabel="U13" />);
      expect(screen.queryByTestId("team-editorial-verhaal")).toBeNull();
    });
  });

  describe("Contact", () => {
    it("renders the contact prose", () => {
      render(<TeamEditorial contactInfo={CONTACT} teamLabel="U13" />);
      expect(
        screen.getByTestId("team-editorial-contact").textContent,
      ).toContain("info@kcvvelewijt.be");
    });

    it("auto-hides when contactInfo is empty", () => {
      render(<TeamEditorial body={BODY_NO_PULLQUOTE} teamLabel="U13" />);
      expect(screen.queryByTestId("team-editorial-contact")).toBeNull();
    });
  });
});
