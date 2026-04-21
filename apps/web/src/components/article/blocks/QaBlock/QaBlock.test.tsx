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

  describe("tag dispatch and rapid-fire grouping", () => {
    it("renders key + quote pairs as their own breakout blocks", () => {
      render(
        <QaBlock
          value={{
            pairs: [
              {
                _key: "k",
                tag: "key",
                question: "Key question",
                answer: makeAnswer("Key answer."),
              },
              {
                _key: "q",
                tag: "quote",
                question: "(hidden for quote)",
                answer: makeAnswer("Quote answer."),
              },
            ],
          }}
        />,
      );
      expect(screen.getByTestId("qa-pair-key")).toBeInTheDocument();
      expect(screen.getByTestId("qa-pair-quote")).toBeInTheDocument();
    });

    it("collapses consecutive rapid-fire pairs into a single QaGroupRapidFire", () => {
      render(
        <QaBlock
          value={{
            pairs: [
              {
                _key: "rf-1",
                tag: "rapid-fire",
                question: "Q1",
                answer: makeAnswer("A1"),
              },
              {
                _key: "rf-2",
                tag: "rapid-fire",
                question: "Q2",
                answer: makeAnswer("A2"),
              },
              {
                _key: "rf-3",
                tag: "rapid-fire",
                question: "Q3",
                answer: makeAnswer("A3"),
              },
            ],
          }}
        />,
      );
      expect(screen.getAllByTestId("qa-group-rapid-fire")).toHaveLength(1);
      expect(screen.getByText("Sneltrein")).toBeInTheDocument();
    });

    it("starts a new rapid-fire group whenever the run is broken by another tag", () => {
      render(
        <QaBlock
          value={{
            pairs: [
              {
                _key: "rf-1",
                tag: "rapid-fire",
                question: "G1-Q1",
                answer: makeAnswer("A"),
              },
              {
                _key: "std",
                tag: "standard",
                question: "Break",
                answer: makeAnswer("B"),
              },
              {
                _key: "rf-2",
                tag: "rapid-fire",
                question: "G2-Q1",
                answer: makeAnswer("C"),
              },
            ],
          }}
        />,
      );
      expect(screen.getAllByTestId("qa-group-rapid-fire")).toHaveLength(2);
    });

    it("continues numbering only across standard pairs when breakouts are interleaved", () => {
      render(
        <QaBlock
          value={{
            pairs: [
              {
                _key: "s1",
                tag: "standard",
                question: "First standard",
                answer: makeAnswer("A1"),
              },
              {
                _key: "k1",
                tag: "key",
                question: "Key in the middle",
                answer: makeAnswer("K-answer"),
              },
              {
                _key: "s2",
                tag: "standard",
                question: "Third overall, second standard",
                answer: makeAnswer("A2"),
              },
            ],
          }}
        />,
      );
      const numerals = screen.getAllByTestId("qa-pair-numeral");
      expect(numerals.map((n) => n.textContent)).toEqual(["01.", "02."]);
    });

    it("does not render a separator rule around a breakout unit", () => {
      render(
        <QaBlock
          value={{
            pairs: [
              {
                _key: "s1",
                tag: "standard",
                question: "Standard one",
                answer: makeAnswer("A1"),
              },
              {
                _key: "k1",
                tag: "key",
                question: "Key breakout",
                answer: makeAnswer("K"),
              },
              {
                _key: "s2",
                tag: "standard",
                question: "Standard three",
                answer: makeAnswer("A2"),
              },
            ],
          }}
        />,
      );
      // A standard→key→standard sequence has no separators — neither between
      // standard#1 and the key, nor between the key and standard#2.
      expect(screen.queryAllByRole("separator", { hidden: true })).toHaveLength(
        0,
      );
    });
  });
});
