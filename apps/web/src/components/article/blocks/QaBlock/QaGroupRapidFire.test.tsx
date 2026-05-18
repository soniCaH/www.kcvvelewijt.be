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

// 5.B.int respondents[] shape — one entry per pair for the legacy
// rapid-fire renderer (which is single-respondent by design).
const respondents = (
  text: string,
): { _key: string; answer: PortableTextBlock[] }[] => [
  { _key: `r-${text}`, answer: answerBlocks(text) },
];

describe("QaGroupRapidFire", () => {
  it("renders the Sneltrein header + every question/answer pair in order", () => {
    render(
      <QaGroupRapidFire
        pairs={[
          {
            _key: "rf-1",
            tag: "rapid-fire",
            question: "Koffie of thee?",
            respondents: respondents("Koffie. Zwart."),
          },
          {
            _key: "rf-2",
            tag: "rapid-fire",
            question: "Messi of Ronaldo?",
            respondents: respondents("Messi."),
          },
          {
            _key: "rf-3",
            tag: "rapid-fire",
            question: "Regen of sneeuw?",
            respondents: respondents("Regen."),
          },
        ]}
      />,
    );

    expect(screen.getByTestId("qa-group-rapid-fire")).toBeInTheDocument();

    // Assert document order by collapsing the rendered text and looking up
    // each landmark index — guards against a future refactor that
    // accidentally reverses or shuffles pairs.
    const flow = screen.getByTestId("qa-group-rapid-fire").textContent ?? "";
    const positions = [
      "Sneltrein",
      "Koffie of thee?",
      "Koffie. Zwart.",
      "Messi of Ronaldo?",
      "Messi.",
      "Regen of sneeuw?",
      "Regen.",
    ].map((needle) => flow.indexOf(needle));

    positions.forEach((pos, i) => {
      expect(
        pos,
        `"${positions[i]}" must appear in the rendered flow`,
      ).toBeGreaterThanOrEqual(0);
    });
    // Each landmark appears strictly after the previous one.
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it("renders exactly N-1 separators between N pairs", () => {
    render(
      <QaGroupRapidFire
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
    expect(screen.getAllByRole("separator", { hidden: true })).toHaveLength(3);
  });

  it("renders nothing when pairs is empty", () => {
    const { container } = render(<QaGroupRapidFire pairs={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
