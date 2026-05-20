import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { QaBlock } from "./QaBlock";
import { flattenAnswerToString } from "./flattenAnswerToString";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";

const makeAnswer = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: `block-${text}`,
    style: "normal",
    children: [{ _type: "span", _key: `span-${text}`, text, marks: [] }],
    markDefs: [],
  },
];

const PLAYER_SUBJECTS: IndexedSubject[] = [
  {
    _key: "subj-lars",
    kind: "player",
    playerRef: {
      firstName: "Lars",
      lastName: "Janssens",
      jerseyNumber: 9,
    },
  },
];

describe("QaBlock", () => {
  it("renders two standard-tagged pairs in document order through <QARow>", () => {
    render(
      <QaBlock
        subjects={PLAYER_SUBJECTS}
        value={{
          pairs: [
            {
              _key: "pair-1",
              tag: "standard",
              question: "Wat is je eerste herinnering aan KCVV?",
              respondents: [
                { answer: makeAnswer("Spelen op het A-terrein als U9.") },
              ],
            },
            {
              _key: "pair-2",
              tag: "standard",
              question: "En je beste match?",
              respondents: [
                { answer: makeAnswer("De 4-3 tegen Duffel, vorig seizoen.") },
              ],
            },
          ],
        }}
      />,
    );

    const rows = screen.getAllByRole("article");
    expect(rows).toHaveLength(2);
    rows.forEach((row) => {
      expect(row.getAttribute("data-qa-row")).toBe("true");
      expect(row.getAttribute("data-qa-row-mode")).toBe("single");
    });

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

  it("renders a 1px rule between consecutive QARow units but not after the last", () => {
    render(
      <QaBlock
        subjects={PLAYER_SUBJECTS}
        value={{
          pairs: [
            {
              _key: "pair-1",
              tag: "standard",
              question: "Eerste?",
              respondents: [{ answer: makeAnswer("A.") }],
            },
            {
              _key: "pair-2",
              tag: "standard",
              question: "Tweede?",
              respondents: [{ answer: makeAnswer("B.") }],
            },
            {
              _key: "pair-3",
              tag: "standard",
              question: "Derde?",
              respondents: [{ answer: makeAnswer("C.") }],
            },
          ],
        }}
      />,
    );

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

  it("falls back to QARow for unknown tag values", () => {
    render(
      <QaBlock
        subjects={PLAYER_SUBJECTS}
        value={{
          pairs: [
            {
              _key: "pair-1",
              tag: "some-future-tag-we-have-not-implemented-yet",
              question: "Onbekende tag?",
              respondents: [{ answer: makeAnswer("Valt terug op standard.") }],
            },
          ],
        }}
      />,
    );
    const row = screen.getByRole("article");
    expect(row.getAttribute("data-qa-row")).toBe("true");
    expect(screen.getByText("Onbekende tag?")).toBeInTheDocument();
    expect(screen.getByText("Valt terug op standard.")).toBeInTheDocument();
  });

  it("maps multi-respondent standard pairs to QARow multi-mode with one entry per resolvable respondent", () => {
    const subjects: IndexedSubject[] = [
      {
        _key: "subj-lars",
        kind: "player",
        playerRef: {
          firstName: "Lars",
          lastName: "Janssens",
          jerseyNumber: 9,
        },
      },
      {
        _key: "subj-niels",
        kind: "player",
        playerRef: {
          firstName: "Niels",
          lastName: "Peeters",
          jerseyNumber: 6,
        },
      },
    ];
    render(
      <QaBlock
        subjects={subjects}
        value={{
          pairs: [
            {
              _key: "pair-1",
              tag: "standard",
              question: "Wat veranderde er na de winterstop?",
              respondents: [
                {
                  _key: "r-lars",
                  respondentKey: "subj-lars",
                  answer: makeAnswer("Het tempo lag een tand hoger."),
                },
                {
                  _key: "r-niels",
                  respondentKey: "subj-niels",
                  answer: makeAnswer("Voor mij was het de zaalstage."),
                },
              ],
            },
          ],
        }}
      />,
    );

    const row = screen.getByRole("article");
    expect(row.getAttribute("data-qa-row-mode")).toBe("multi");
    expect(row.getAttribute("data-qa-row-respondent-count")).toBe("2");
    expect(screen.getByText("Lars Janssens")).toBeInTheDocument();
    expect(screen.getByText("Niels Peeters")).toBeInTheDocument();
    expect(
      screen.getByText("Het tempo lag een tand hoger."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Voor mij was het de zaalstage."),
    ).toBeInTheDocument();
  });

  it("skips multi-respondent standard pair entries that can't be resolved (keeps the resolvable ones)", () => {
    // Two subjects → no single-subject fallback. The second respondent
    // points at a key that isn't in the list, so it hits the
    // resolvePairRespondent multi-subject-with-unresolvable-key branch and
    // returns null, which the dispatcher must skip.
    const subjects: IndexedSubject[] = [
      {
        _key: "subj-lars",
        kind: "player",
        playerRef: {
          firstName: "Lars",
          lastName: "Janssens",
          jerseyNumber: 9,
        },
      },
      {
        _key: "subj-niels",
        kind: "player",
        playerRef: {
          firstName: "Niels",
          lastName: "Peeters",
          jerseyNumber: 6,
        },
      },
    ];
    render(
      <QaBlock
        subjects={subjects}
        value={{
          pairs: [
            {
              _key: "pair-1",
              tag: "standard",
              question: "Q?",
              respondents: [
                {
                  _key: "r-lars",
                  respondentKey: "subj-lars",
                  answer: makeAnswer("A1"),
                },
                {
                  _key: "r-missing",
                  respondentKey: "subj-does-not-exist",
                  answer: makeAnswer("A2"),
                },
              ],
            },
          ],
        }}
      />,
    );

    const row = screen.getByRole("article");
    // Only one resolvable respondent → single-mode, not multi.
    expect(row.getAttribute("data-qa-row-mode")).toBe("single");
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.queryByText("A2")).toBeNull();
  });

  it("skips standard pairs without resolvable respondents (no subjects authored)", () => {
    const { container } = render(
      <QaBlock
        value={{
          pairs: [
            {
              _key: "pair-1",
              tag: "standard",
              question: "Wie?",
              respondents: [{ answer: makeAnswer("Niemand.") }],
            },
          ],
        }}
      />,
    );
    // No QARow rendered — the wrapper exists but has no children.
    expect(container.querySelector('[data-qa-row="true"]')).toBeNull();
    expect(screen.queryByText("Wie?")).toBeNull();
  });

  describe("tag dispatch — key & quote → <PullQuote>", () => {
    it("renders a key pair as PullQuote tone=cream, carrying the question as source", () => {
      render(
        <QaBlock
          subjects={PLAYER_SUBJECTS}
          value={{
            pairs: [
              {
                _key: "k",
                tag: "key",
                question: "Het sleutelmoment van je seizoen",
                respondents: [
                  {
                    answer: makeAnswer("De eindrondewinst tegen Kraainem."),
                  },
                ],
              },
            ],
          }}
        />,
      );

      const tone = document.querySelector('[data-pull-quote-tone="cream"]');
      expect(tone).not.toBeNull();
      expect(
        screen.getByText("De eindrondewinst tegen Kraainem."),
      ).toBeInTheDocument();
      // Attribution shows the resolved name.
      const nameSlot = document.querySelector(
        '[data-pull-quote-name="display"]',
      );
      expect(nameSlot?.textContent).toBe("Lars Janssens");
      // Question rides along as the source meta line.
      expect(
        screen.getByText("Het sleutelmoment van je seizoen"),
      ).toBeInTheDocument();
    });

    it("renders a quote pair as PullQuote tone=ink with no source meta", () => {
      render(
        <QaBlock
          subjects={PLAYER_SUBJECTS}
          value={{
            pairs: [
              {
                _key: "q",
                tag: "quote",
                question: "(hidden for quote)",
                respondents: [
                  {
                    answer: makeAnswer("Ik voetbal nog altijd met schrik."),
                  },
                ],
              },
            ],
          }}
        />,
      );

      expect(
        document.querySelector('[data-pull-quote-tone="ink"]'),
      ).not.toBeNull();
      expect(
        screen.getByText("Ik voetbal nog altijd met schrik."),
      ).toBeInTheDocument();
      // The question must NOT bleed through as source for quote tone.
      expect(screen.queryByText("(hidden for quote)")).toBeNull();
    });

    it("skips key/quote pairs when the body flattens to an empty string", () => {
      const { container } = render(
        <QaBlock
          subjects={PLAYER_SUBJECTS}
          value={{
            pairs: [
              {
                _key: "k",
                tag: "key",
                question: "Empty key",
                respondents: [{ answer: [] }],
              },
            ],
          }}
        />,
      );
      expect(container.querySelector("[data-pull-quote-tone]")).toBeNull();
    });
  });

  describe("rapid-fire grouping (unchanged from #1849)", () => {
    it("collapses consecutive rapid-fire pairs into a single QaGroupRapidFire and threads the resolved respondent + answers", () => {
      render(
        <QaBlock
          value={{
            pairs: [
              {
                _key: "rf-1",
                tag: "rapid-fire",
                question: "Q1",
                respondents: [{ answer: makeAnswer("A1") }],
              },
              {
                _key: "rf-2",
                tag: "rapid-fire",
                question: "Q2",
                respondents: [{ answer: makeAnswer("A2") }],
              },
              {
                _key: "rf-3",
                tag: "rapid-fire",
                question: "Q3",
                respondents: [{ answer: makeAnswer("A3") }],
              },
            ],
          }}
          subjects={PLAYER_SUBJECTS}
        />,
      );
      const group = screen.getByTestId("qa-group-rapid-fire");
      expect(group).toBeInTheDocument();
      expect(screen.getAllByTestId("qa-group-rapid-fire")).toHaveLength(1);
      expect(screen.getByText("Kort & Krachtig")).toBeInTheDocument();
      expect(group.querySelector("[data-rapidfire='speaker']")).not.toBeNull();
      expect(screen.getByText("Lars Janssens")).toBeInTheDocument();
      expect(screen.getByText("#9")).toBeInTheDocument();
      expect(screen.getByText("A1")).toBeInTheDocument();
      expect(screen.getByText("A2")).toBeInTheDocument();
      expect(screen.getByText("A3")).toBeInTheDocument();
    });

    it("starts a new rapid-fire group whenever the run is broken by another tag", () => {
      render(
        <QaBlock
          subjects={PLAYER_SUBJECTS}
          value={{
            pairs: [
              {
                _key: "rf-1",
                tag: "rapid-fire",
                question: "G1-Q1",
                respondents: [{ answer: makeAnswer("A") }],
              },
              {
                _key: "std",
                tag: "standard",
                question: "Break",
                respondents: [{ answer: makeAnswer("B") }],
              },
              {
                _key: "rf-2",
                tag: "rapid-fire",
                question: "G2-Q1",
                respondents: [{ answer: makeAnswer("C") }],
              },
            ],
          }}
        />,
      );
      expect(screen.getAllByTestId("qa-group-rapid-fire")).toHaveLength(2);
    });

    it("does not render a separator rule around a breakout unit", () => {
      render(
        <QaBlock
          subjects={PLAYER_SUBJECTS}
          value={{
            pairs: [
              {
                _key: "s1",
                tag: "standard",
                question: "Standard one",
                respondents: [{ answer: makeAnswer("A1") }],
              },
              {
                _key: "k1",
                tag: "key",
                question: "Key breakout",
                respondents: [{ answer: makeAnswer("K") }],
              },
              {
                _key: "s2",
                tag: "standard",
                question: "Standard three",
                respondents: [{ answer: makeAnswer("A2") }],
              },
            ],
          }}
        />,
      );
      expect(screen.queryAllByRole("separator", { hidden: true })).toHaveLength(
        0,
      );
    });
  });
});

describe("flattenAnswerToString", () => {
  it("returns empty string for empty array", () => {
    expect(flattenAnswerToString([])).toBe("");
  });

  it("returns empty string for undefined/missing input", () => {
    expect(flattenAnswerToString(undefined)).toBe("");
  });

  it("returns the concatenated span text of a single block", () => {
    const blocks: PortableTextBlock[] = [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          { _type: "span", _key: "s1", text: "Hello ", marks: [] },
          { _type: "span", _key: "s2", text: "world.", marks: ["em"] },
        ],
        markDefs: [],
      },
    ];
    expect(flattenAnswerToString(blocks)).toBe("Hello world.");
  });

  it("joins multiple blocks with a single space", () => {
    const blocks: PortableTextBlock[] = [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [{ _type: "span", _key: "s1", text: "First.", marks: [] }],
        markDefs: [],
      },
      {
        _type: "block",
        _key: "b2",
        style: "normal",
        children: [{ _type: "span", _key: "s2", text: "Second.", marks: [] }],
        markDefs: [],
      },
    ];
    expect(flattenAnswerToString(blocks)).toBe("First. Second.");
  });

  it("ignores non-span children silently", () => {
    const blocks: PortableTextBlock[] = [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          { _type: "span", _key: "s1", text: "Visible.", marks: [] },
          // Unknown child kind — should be skipped without crashing.
          { _type: "image", _key: "i1" } as unknown as {
            _type: "span";
            _key: string;
            text: string;
            marks: string[];
          },
        ],
        markDefs: [],
      },
    ];
    expect(flattenAnswerToString(blocks)).toBe("Visible.");
  });
});
