import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { QaGroupRapidFire } from "./QaGroupRapidFire";

const answerBlocks = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: `b-${text}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s-${text}`, text, marks: [] }],
  },
];

const respondents = (
  text: string,
): { _key: string; answer: PortableTextBlock[] }[] => [
  { _key: `r-${text}`, answer: answerBlocks(text) },
];

const LARS = {
  firstName: "Lars",
  fullName: "Lars Janssens",
  role: "AANVALLER",
};

describe("QaGroupRapidFire (Phase 5 rewrite)", () => {
  it("renders the Kort & Krachtig opener + every question/answer pair in order", () => {
    render(
      <QaGroupRapidFire
        respondent={LARS}
        pairs={[
          {
            _key: "rf-1",
            tag: "rapid-fire",
            question: "Favoriete goal",
            respondents: respondents("De volley tegen Diest."),
          },
          {
            _key: "rf-2",
            tag: "rapid-fire",
            question: "Speler om te volgen",
            respondents: respondents("Wim. Hij maakt iedereen beter."),
          },
          {
            _key: "rf-3",
            tag: "rapid-fire",
            question: "Bus-muziek",
            respondents: respondents("Geen liedjes — koptelefoon op."),
          },
        ]}
      />,
    );

    expect(screen.getByTestId("qa-group-rapid-fire")).toBeInTheDocument();
    const flow = screen.getByTestId("qa-group-rapid-fire").textContent ?? "";
    const positions = [
      "Kort & Krachtig",
      "Lars Janssens",
      "AANVALLER",
      "Favoriete goal",
      "De volley tegen Diest.",
      "Speler om te volgen",
      "Wim. Hij maakt iedereen beter.",
      "Bus-muziek",
      "Geen liedjes — koptelefoon op.",
    ].map((needle) => flow.indexOf(needle));

    positions.forEach((pos, i) => {
      expect(
        pos,
        `"${positions[i]}" must appear in the rendered flow`,
      ).toBeGreaterThanOrEqual(0);
    });
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it("renders exactly N-1 dotted dividers between N pairs", () => {
    const { container } = render(
      <QaGroupRapidFire
        respondent={LARS}
        pairs={[
          {
            _key: "rf-1",
            tag: "rapid-fire",
            question: "Q1",
            respondents: respondents("A1"),
          },
          {
            _key: "rf-2",
            tag: "rapid-fire",
            question: "Q2",
            respondents: respondents("A2"),
          },
          {
            _key: "rf-3",
            tag: "rapid-fire",
            question: "Q3",
            respondents: respondents("A3"),
          },
          {
            _key: "rf-4",
            tag: "rapid-fire",
            question: "Q4",
            respondents: respondents("A4"),
          },
        ]}
      />,
    );
    expect(
      container.querySelectorAll('[data-rapidfire="divider"]'),
    ).toHaveLength(3);
  });

  it("renders an em-dash glyph for an empty answer", () => {
    render(
      <QaGroupRapidFire
        respondent={LARS}
        pairs={[
          {
            _key: "rf-1",
            tag: "rapid-fire",
            question: "Favoriete goal",
            respondents: [{ answer: [] }],
          },
        ]}
      />,
    );
    const answer = screen
      .getByTestId("qa-group-rapid-fire")
      .querySelector('[data-rapidfire="answer"]');
    expect(answer?.textContent).toBe("—");
  });

  it("suppresses the speaker strip when no respondent is supplied", () => {
    const { container } = render(
      <QaGroupRapidFire
        pairs={[
          {
            _key: "rf-1",
            tag: "rapid-fire",
            question: "Q1",
            respondents: respondents("A1"),
          },
        ]}
      />,
    );
    expect(container.querySelector('[data-rapidfire="speaker"]')).toBeNull();
  });

  it("renders the row-scale monogram avatar when a respondent is supplied", () => {
    const { container } = render(
      <QaGroupRapidFire
        respondent={LARS}
        pairs={[
          {
            _key: "rf-1",
            tag: "rapid-fire",
            question: "Q",
            respondents: respondents("A"),
          },
        ]}
      />,
    );
    expect(
      container.querySelector(
        '[data-subject-avatar="monogram"][data-scale="row"]',
      ),
    ).not.toBeNull();
  });

  it("renders nothing when pairs is empty", () => {
    const { container } = render(<QaGroupRapidFire pairs={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
