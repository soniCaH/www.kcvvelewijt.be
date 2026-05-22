/**
 * <BioBlock> Component Tests
 *
 * Covers the 6.d5 BioBlock + pullquote PT decorator behaviour:
 *  - Renders `player.bio` Portable Text via the article-body serializer
 *    pattern.
 *  - `pullquote` decorator renders inline highlight in the paragraph AND
 *    lifts the FIRST marked span into the right-column `<PullQuote tone="jersey">`.
 *  - 0 marks → paragraph alone, no right column.
 *  - Empty / missing bio → returns null (auto-hide branch).
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { BioBlock } from "./BioBlock";

/**
 * Build a minimal Portable Text block from `(text, marks)` segments. Keys
 * are deterministic to keep render output stable across tests + VR.
 */
function block(
  ...spans: ReadonlyArray<{ text: string; marks?: string[] }>
): PortableTextBlock {
  return {
    _type: "block",
    _key: `block-${spans.map((s) => s.text.slice(0, 3)).join("-")}`,
    style: "normal",
    children: spans.map((span, i) => ({
      _type: "span",
      _key: `span-${i}-${span.text.slice(0, 3)}`,
      text: span.text,
      marks: span.marks ?? [],
    })),
    markDefs: [],
  } as unknown as PortableTextBlock;
}

const BIO_TWO_MARKS: PortableTextBlock[] = [
  block(
    { text: "Maxim groeide op in Elewijt en " },
    { text: "speelde van zijn zesde af bij de jeugd.", marks: ["pullquote"] },
    { text: " Hij debuteerde op zijn zeventiende." },
  ),
  block(
    { text: "Op het veld is hij " },
    { text: "een meedogenloze tackler.", marks: ["pullquote"] },
    { text: " Daarnaast is hij ook een uitstekende passgever." },
  ),
];

const BIO_ONE_MARK: PortableTextBlock[] = [
  block(
    { text: "Joris debuteerde in 2018. " },
    { text: "Zijn linkervoet doet de rest.", marks: ["pullquote"] },
  ),
];

const BIO_NO_MARKS: PortableTextBlock[] = [
  block(
    { text: "Ben staat sinds zijn elfde tussen de palen. " },
    { text: "Een rustige keeper met goeie spelhervattingen." },
  ),
];

describe("BioBlock", () => {
  describe("Empty / hidden branch", () => {
    it("returns null when bio is undefined", () => {
      const { container } = render(<BioBlock bio={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when bio is null", () => {
      const { container } = render(<BioBlock bio={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when bio is an empty array", () => {
      const { container } = render(<BioBlock bio={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when bio contains only empty paragraphs", () => {
      const { container } = render(
        <BioBlock bio={[block({ text: "" }), block({ text: "  " })]} />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Full bio with 2 marked spans", () => {
    it("renders all paragraphs", () => {
      render(<BioBlock bio={BIO_TWO_MARKS} />);
      expect(
        screen.getByText(/Maxim groeide op in Elewijt en/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Op het veld is hij/)).toBeInTheDocument();
    });

    it("renders BOTH marked spans inline via <HighlighterStroke>", () => {
      render(<BioBlock bio={BIO_TWO_MARKS} />);
      const highlights = screen
        .getAllByText(
          (_, el) => el?.getAttribute("data-highlighter-stroke") === "true",
        )
        .map((el) => el.textContent);
      expect(highlights).toEqual([
        "speelde van zijn zesde af bij de jeugd.",
        "een meedogenloze tackler.",
      ]);
    });

    it("lifts the FIRST marked span into the right-column <PullQuote>", () => {
      render(<BioBlock bio={BIO_TWO_MARKS} />);
      const card = screen.getByTestId("bioblock-pullquote");
      expect(card).toBeInTheDocument();
      expect(card.textContent).toContain(
        "speelde van zijn zesde af bij de jeugd.",
      );
      // Should not also show span #2 in the card — only the first.
      expect(card.textContent).not.toContain("een meedogenloze tackler.");
    });

    it("concatenates the first contiguous run of marked spans, even when split", () => {
      // Sanity authors can produce two adjacent spans that both carry the
      // `pullquote` mark (e.g. when a bold/italic span sits inside the
      // marked range). `findFirstPullquoteText` collects across the run
      // until the first unmarked span breaks it. A later marked span in
      // the same block must NOT contribute to the lift.
      const bio: PortableTextBlock[] = [
        block(
          { text: "Maxim groeide op. " },
          { text: "Vanaf zijn zesde ", marks: ["pullquote"] },
          {
            text: "stond hij elke zaterdag op het veld.",
            marks: ["pullquote"],
          },
          { text: " Op zijn zeventiende debuteerde hij." },
          { text: "een meedogenloze tackler.", marks: ["pullquote"] },
        ),
      ];
      render(<BioBlock bio={bio} />);
      const card = screen.getByTestId("bioblock-pullquote");
      expect(card.textContent).toContain(
        "Vanaf zijn zesde stond hij elke zaterdag op het veld.",
      );
      expect(card.textContent).not.toContain("een meedogenloze tackler.");
    });

    it("renders the right-column <PullQuote> with jersey tone", () => {
      render(<BioBlock bio={BIO_TWO_MARKS} />);
      const card = screen.getByTestId("bioblock-pullquote");
      const tone = card.querySelector("[data-pull-quote-tone]");
      expect(tone?.getAttribute("data-pull-quote-tone")).toBe("jersey");
    });
  });

  describe("Bio with 1 marked span", () => {
    it("renders the inline highlight", () => {
      render(<BioBlock bio={BIO_ONE_MARK} />);
      const highlights = screen
        .getAllByText(
          (_, el) => el?.getAttribute("data-highlighter-stroke") === "true",
        )
        .map((el) => el.textContent);
      expect(highlights).toEqual(["Zijn linkervoet doet de rest."]);
    });

    it("lifts that single marked span into the right-column card", () => {
      render(<BioBlock bio={BIO_ONE_MARK} />);
      const card = screen.getByTestId("bioblock-pullquote");
      expect(card.textContent).toContain("Zijn linkervoet doet de rest.");
    });
  });

  describe("Bio with 0 marked spans", () => {
    it("renders the paragraph", () => {
      render(<BioBlock bio={BIO_NO_MARKS} />);
      expect(
        screen.getByText(/Ben staat sinds zijn elfde tussen de palen/),
      ).toBeInTheDocument();
    });

    it("does NOT render the right-column <PullQuote> card", () => {
      render(<BioBlock bio={BIO_NO_MARKS} />);
      expect(
        screen.queryByTestId("bioblock-pullquote"),
      ).not.toBeInTheDocument();
    });

    it("collapses to a single-column layout", () => {
      render(<BioBlock bio={BIO_NO_MARKS} />);
      const root = screen.getByTestId("bioblock");
      expect(root.getAttribute("data-has-pullquote")).toBe("false");
    });
  });
});
