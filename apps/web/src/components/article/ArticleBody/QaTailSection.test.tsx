import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import { QaTailSection } from "./QaTailSection";
import type { QaBlockBlock } from "./qaBlocksToTailSection";

const answer = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: `b-${text}`,
    style: "normal",
    children: [{ _type: "span", _key: `s-${text}`, text, marks: [] }],
    markDefs: [],
  },
];

const withPair = (key: string, question: string): QaBlockBlock =>
  ({
    _type: "qaBlock",
    _key: key,
    groupAtTail: true,
    pairs: [
      {
        _key: `${key}-p`,
        tag: "standard",
        question,
        respondents: [{ answer: answer(`Antwoord op ${question}`) }],
      },
    ],
  }) as unknown as QaBlockBlock;

// A qaBlock with no pairs: `<QaBlock>` returns null for it.
const empty = (key: string): QaBlockBlock =>
  ({
    _type: "qaBlock",
    _key: key,
    groupAtTail: true,
    pairs: [],
  }) as unknown as QaBlockBlock;

const section = (c: HTMLElement) =>
  c.querySelector("[data-qa-tail-section]") as HTMLElement;
const list = (c: HTMLElement) =>
  section(c).querySelector("div.flex.flex-col.gap-12") as HTMLElement;

describe("QaTailSection", () => {
  it("renders the Q&A heading and one block per tail entry", () => {
    const { container } = render(
      <QaTailSection
        blocks={[withPair("a", "Eerste?"), withPair("b", "Tweede?")]}
      />,
    );
    expect(section(container)).toHaveAttribute("aria-label", "Q&A");
    expect(screen.getByRole("heading", { name: /^Q&A/ })).toBeInTheDocument();
    expect(screen.getAllByTestId("qa-block")).toHaveLength(2);
  });

  it("owns the gap above the credits: pb-8 on the section, no margin stack from the last block (#2531)", () => {
    const { container } = render(
      <QaTailSection blocks={[withPair("a", "Eerste?")]} />,
    );
    expect(section(container)).toHaveClass("pb-8");
    expect(list(container).className).toContain("[&>:last-child]:mb-0");
  });

  it("targets the last RENDERED block when the last entry renders null", () => {
    const { container } = render(
      <QaTailSection blocks={[withPair("a", "Eerste?"), empty("b")]} />,
    );
    // The null block leaves no element behind, so `:last-child` is the
    // visible block — an index check on the entries would miss it.
    expect(list(container).children).toHaveLength(1);
    expect(list(container).lastElementChild).toHaveAttribute(
      "data-testid",
      "qa-block",
    );
  });
});
