/**
 * <QuotesBlock> Component Tests
 *
 * Covers the 6.d8 lock (Variant C — single full-width ink card):
 *  - 2+ marked spans → renders the SECOND span in an ink `<PullQuote>`.
 *  - 1 marked span → auto-hides (BioBlock owns span #0; QuotesBlock has
 *    nothing to lift).
 *  - 0 marked spans → auto-hides.
 *  - Empty / missing bio → returns null.
 *  - Heading is "In zijn eigen woorden." with the highlighter marker on
 *    "woorden" (canonical copy per the locked spec).
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { QuotesBlock } from "./QuotesBlock";

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

const BIO_THREE_MARKS: PortableTextBlock[] = [
  block(
    { text: "Een ", marks: ["pullquote"] },
    { text: " middle " },
    { text: "twee.", marks: ["pullquote"] },
    { text: " more " },
    { text: "drie.", marks: ["pullquote"] },
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

describe("QuotesBlock", () => {
  describe("Auto-hide branches", () => {
    it("returns null when bio is undefined", () => {
      const { container } = render(<QuotesBlock bio={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when bio is null", () => {
      const { container } = render(<QuotesBlock bio={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when bio is an empty array", () => {
      const { container } = render(<QuotesBlock bio={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when bio contains only empty paragraphs", () => {
      const { container } = render(
        <QuotesBlock bio={[block({ text: "" }), block({ text: "  " })]} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("returns null when bio has zero pullquote marks", () => {
      const { container } = render(<QuotesBlock bio={BIO_NO_MARKS} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when bio has only one pullquote mark", () => {
      const { container } = render(<QuotesBlock bio={BIO_ONE_MARK} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Renders with 2+ marked spans", () => {
    it("renders the section", () => {
      render(<QuotesBlock bio={BIO_TWO_MARKS} playerName="Maxim" />);
      expect(screen.getByTestId("quotesblock")).toBeInTheDocument();
    });

    it("renders the SECOND marked span as the quote body, not the first", () => {
      render(<QuotesBlock bio={BIO_TWO_MARKS} playerName="Maxim" />);
      const root = screen.getByTestId("quotesblock");
      expect(root.textContent).toContain("een meedogenloze tackler.");
      expect(root.textContent).not.toContain(
        "speelde van zijn zesde af bij de jeugd.",
      );
    });

    it("ignores marked spans beyond the second", () => {
      render(<QuotesBlock bio={BIO_THREE_MARKS} playerName="Test" />);
      const root = screen.getByTestId("quotesblock");
      // span #2 (index 1) is "twee."; span #3 (index 2) "drie." must not appear
      expect(root.textContent).toContain("twee.");
      expect(root.textContent).not.toContain("drie.");
      expect(root.textContent).not.toContain("Een");
    });

    it("renders the PullQuote with ink tone", () => {
      render(<QuotesBlock bio={BIO_TWO_MARKS} playerName="Maxim" />);
      const tone = screen
        .getByTestId("quotesblock")
        .querySelector("[data-pull-quote-tone]");
      expect(tone?.getAttribute("data-pull-quote-tone")).toBe("ink");
    });

    it("attributes the quote to the player name", () => {
      render(
        <QuotesBlock bio={BIO_TWO_MARKS} playerName="Maxim Breugelmans" />,
      );
      expect(
        screen.getByText("Maxim Breugelmans", { selector: "span" }),
      ).toBeInTheDocument();
    });

    it("renders the canonical heading with the highlighter marker on 'woorden'", () => {
      render(<QuotesBlock bio={BIO_TWO_MARKS} playerName="Maxim" />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toBe("In zijn eigen woorden.");
      const marker = heading.querySelector("[data-highlighter-stroke='true']");
      expect(marker).not.toBeNull();
      expect(marker?.textContent).toBe("woorden");
    });
  });
});
