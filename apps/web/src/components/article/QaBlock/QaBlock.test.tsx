import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { QaBlock } from "./QaBlock";

const makeAnswer = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: `block-${text}`,
    style: "normal",
    children: [{ _type: "span", _key: `span-${text}`, text, marks: [] }],
    markDefs: [],
  },
];

describe("QaBlock", () => {
  it("renders two standard-tagged pairs in document order with 01./02. numerals", () => {
    render(
      <QaBlock
        value={{
          pairs: [
            {
              _key: "pair-1",
              tag: "standard",
              question: "Wat is je eerste herinnering aan KCVV?",
              answer: makeAnswer("Spelen op het A-terrein als U9."),
            },
            {
              _key: "pair-2",
              tag: "standard",
              question: "En je beste match?",
              answer: makeAnswer("De 4-3 tegen Duffel, vorig seizoen."),
            },
          ],
        }}
      />,
    );

    const pairs = screen.getAllByTestId("qa-pair-standard");
    expect(pairs).toHaveLength(2);

    const numerals = screen.getAllByTestId("qa-pair-numeral");
    expect(numerals[0]).toHaveTextContent("01.");
    expect(numerals[1]).toHaveTextContent("02.");

    expect(
      screen.getByText("Wat is je eerste herinnering aan KCVV?"),
    ).toBeInTheDocument();
    expect(screen.getByText("En je beste match?")).toBeInTheDocument();
    expect(
      screen.getByText("Spelen op het A-terrein als U9."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("De 4-3 tegen Duffel, vorig seizoen."),
    ).toBeInTheDocument();
  });

  it("renders a 1px rule between pairs but not after the last pair", () => {
    render(
      <QaBlock
        value={{
          pairs: [
            {
              _key: "pair-1",
              tag: "standard",
              question: "Eerste?",
              answer: makeAnswer("A."),
            },
            {
              _key: "pair-2",
              tag: "standard",
              question: "Tweede?",
              answer: makeAnswer("B."),
            },
            {
              _key: "pair-3",
              tag: "standard",
              question: "Derde?",
              answer: makeAnswer("C."),
            },
          ],
        }}
      />,
    );

    // Three pairs → exactly two separators between consecutive pairs. The
    // separators are aria-hidden for visual-only decoration, so the hidden
    // option is required to find them through the a11y tree.
    expect(screen.getAllByRole("separator", { hidden: true })).toHaveLength(2);
  });

  it("returns null when pairs is empty", () => {
    const { container } = render(<QaBlock value={{ pairs: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when pairs is missing", () => {
    const { container } = render(<QaBlock value={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("falls back to QaPairStandard for unknown tag values", () => {
    render(
      <QaBlock
        value={{
          pairs: [
            {
              _key: "pair-1",
              tag: "some-future-tag-we-have-not-implemented-yet",
              question: "Onbekende tag?",
              answer: makeAnswer("Valt terug op standard."),
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId("qa-pair-standard")).toBeInTheDocument();
    expect(screen.getByText("Onbekende tag?")).toBeInTheDocument();
  });
});
