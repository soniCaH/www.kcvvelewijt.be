/**
 * TeamEditorial unit tests.
 *
 * Covers:
 *  - Whole-section auto-hide when body + training + contact all empty
 *  - "Het verhaal" block: renders body prose; lifts the first pullquote run
 *    into a PullQuote card; no pullquote → no card
 *  - Training table renders rows; auto-hides when empty
 *  - Contact block renders PT; auto-hides when empty
 *  - Per-block independence (one present, others absent)
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { TeamEditorial } from "./TeamEditorial";

function block(
  ...spans: ReadonlyArray<{ text: string; marks?: string[] }>
): PortableTextBlock {
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
}

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

const TRAINING = [
  { day: "Dinsdag", time: "19:30", location: "Veld 1", type: "Training" },
  { day: "Donderdag", time: "20:00", location: "Veld 2", type: "Tactisch" },
];

describe("TeamEditorial", () => {
  it("auto-hides the whole section when everything is empty", () => {
    const { container } = render(
      <TeamEditorial body={[]} trainingSchedule={[]} contactInfo={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  describe("Het verhaal (body)", () => {
    it("renders the body prose", () => {
      render(<TeamEditorial body={BODY_WITH_PULLQUOTE} />);
      expect(
        screen.getByTestId("team-editorial-verhaal").textContent,
      ).toContain("De A-ploeg speelt al jaren");
    });

    it("lifts the first pullquote run into a PullQuote card", () => {
      render(<TeamEditorial body={BODY_WITH_PULLQUOTE} />);
      // "Dit is onze thuis." appears twice: inline highlight + lifted card.
      const matches = screen.getAllByText(/Dit is onze thuis\./);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it("renders no PullQuote card when the body has no pullquote", () => {
      render(<TeamEditorial body={BODY_NO_PULLQUOTE} />);
      const matches = screen.getAllByText(/Een korte beschrijving/);
      // Only the inline prose occurrence — no lifted duplicate.
      expect(matches).toHaveLength(1);
    });

    it("auto-hides the verhaal block when body is empty", () => {
      render(<TeamEditorial contactInfo={CONTACT} />);
      expect(screen.queryByTestId("team-editorial-verhaal")).toBeNull();
    });
  });

  describe("Trainingsschema", () => {
    it("renders a row per training session", () => {
      render(<TeamEditorial trainingSchedule={TRAINING} />);
      const section = screen.getByTestId("team-editorial-training");
      expect(section.textContent).toContain("Dinsdag");
      expect(section.textContent).toContain("19:30");
      expect(section.textContent).toContain("Veld 2");
    });

    it("auto-hides when the schedule is empty", () => {
      render(<TeamEditorial body={BODY_NO_PULLQUOTE} />);
      expect(screen.queryByTestId("team-editorial-training")).toBeNull();
    });
  });

  describe("Contact", () => {
    it("renders the contact prose", () => {
      render(<TeamEditorial contactInfo={CONTACT} />);
      expect(
        screen.getByTestId("team-editorial-contact").textContent,
      ).toContain("info@kcvvelewijt.be");
    });

    it("auto-hides when contactInfo is empty", () => {
      render(<TeamEditorial body={BODY_NO_PULLQUOTE} />);
      expect(screen.queryByTestId("team-editorial-contact")).toBeNull();
    });
  });
});
