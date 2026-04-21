import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { QaGroupRapidFire } from "./QaGroupRapidFire";

const answer = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: `b-${text}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s-${text}`, text, marks: [] }],
  },
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
            answer: answer("Koffie. Zwart."),
          },
          {
            _key: "rf-2",
            tag: "rapid-fire",
            question: "Messi of Ronaldo?",
            answer: answer("Messi."),
          },
          {
            _key: "rf-3",
            tag: "rapid-fire",
            question: "Regen of sneeuw?",
            answer: answer("Regen."),
          },
        ]}
      />,
    );

    expect(screen.getByTestId("qa-group-rapid-fire")).toBeInTheDocument();
    expect(screen.getByText("Sneltrein")).toBeInTheDocument();
    expect(screen.getByText("Koffie of thee?")).toBeInTheDocument();
    expect(screen.getByText("Koffie. Zwart.")).toBeInTheDocument();
    expect(screen.getByText("Messi.")).toBeInTheDocument();
    expect(screen.getByText("Regen.")).toBeInTheDocument();
  });

  it("renders exactly N-1 separators between N pairs", () => {
    render(
      <QaGroupRapidFire
        pairs={[
          {
            _key: "rf-1",
            tag: "rapid-fire",
            question: "Q1",
            answer: answer("A1"),
          },
          {
            _key: "rf-2",
            tag: "rapid-fire",
            question: "Q2",
            answer: answer("A2"),
          },
          {
            _key: "rf-3",
            tag: "rapid-fire",
            question: "Q3",
            answer: answer("A3"),
          },
          {
            _key: "rf-4",
            tag: "rapid-fire",
            question: "Q4",
            answer: answer("A4"),
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
