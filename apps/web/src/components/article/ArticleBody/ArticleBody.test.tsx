import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PortableTextBlock } from "@portabletext/react";
import { ArticleBody } from "./ArticleBody";

function paragraph(text: string, key = text.slice(0, 8)): PortableTextBlock {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    children: [{ _type: "span", _key: `${key}-c`, text, marks: [] }],
    markDefs: [],
  } as PortableTextBlock;
}

function heading(text: string, level: "h2" | "h3" = "h2"): PortableTextBlock {
  return {
    _type: "block",
    _key: `${level}-${text.slice(0, 8)}`,
    style: level,
    children: [{ _type: "span", _key: `${level}-c`, text, marks: [] }],
    markDefs: [],
  } as PortableTextBlock;
}

function paragraphWithAccent(
  plain: string,
  accented: string,
): PortableTextBlock {
  return {
    _type: "block",
    _key: "accent-block",
    style: "normal",
    children: [
      { _type: "span", _key: "c1", text: plain, marks: [] },
      { _type: "span", _key: "c2", text: accented, marks: ["accent"] },
    ],
    markDefs: [],
  } as PortableTextBlock;
}

describe("<ArticleBody>", () => {
  describe("DropCap injection", () => {
    it("wraps the first normal paragraph in <DropCapParagraph>", () => {
      const content = [
        paragraph("Hier begint het verhaal."),
        paragraph("Een tweede alinea volgt."),
      ];
      const { container } = render(<ArticleBody content={content} />);
      const dropcap = container.querySelector('[data-tone="ink"]');
      expect(dropcap).toBeTruthy();
      expect(dropcap?.textContent).toBe("Hier begint het verhaal.");
    });

    it("does not apply DropCap to subsequent paragraphs", () => {
      const content = [
        paragraph("First paragraph."),
        paragraph("Second paragraph."),
        paragraph("Third paragraph."),
      ];
      const { container } = render(<ArticleBody content={content} />);
      const dropcaps = container.querySelectorAll('[data-tone="ink"]');
      expect(dropcaps.length).toBe(1);
    });

    it("renders without DropCap when the body has no normal paragraphs", () => {
      const content = [heading("Een titel zonder body")];
      const { container } = render(<ArticleBody content={content} />);
      expect(container.querySelector('[data-tone="ink"]')).toBeNull();
    });

    it("skips DropCap when the body is empty", () => {
      const { container } = render(<ArticleBody content={[]} />);
      expect(container.querySelector('[data-tone="ink"]')).toBeNull();
    });

    it("preserves heading blocks that precede the first paragraph", () => {
      const content = [heading("Heading first"), paragraph("Then the body.")];
      const { container } = render(<ArticleBody content={content} />);
      // Heading renders via <QASectionDivider> (a separator landmark); the
      // DropCap paragraph follows it in DOM order.
      const dropcap = container.querySelector('[data-tone="ink"]');
      const separator = container.querySelector('aside[role="separator"]');
      expect(dropcap).toBeTruthy();
      expect(separator).toBeTruthy();
      const cmp = separator!.compareDocumentPosition(dropcap!);
      // Node.DOCUMENT_POSITION_FOLLOWING = 4
      expect(cmp & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  describe("accent mark serializer", () => {
    it("renders accent spans as italic + jersey-deep <em>", () => {
      const content = [
        paragraph("First paragraph, plain (DropCap target)."),
        paragraphWithAccent("Een ", "groene cursief"),
      ];
      const { container } = render(<ArticleBody content={content} />);
      const accentEm = container.querySelector(
        "em.text-jersey-deep.font-black.italic",
      );
      expect(accentEm).toBeTruthy();
      expect(accentEm?.textContent).toBe("groene cursief");
    });

    it("flattens marks on the first paragraph (DropCap-target limitation)", () => {
      // DropCapParagraph takes a `string` child so the CSS :first-letter
      // pseudo-element targets a top-level text node. Marks inside the
      // first paragraph therefore render as plain text — a documented
      // limitation tracked in the Phase 5 PRD §11 follow-ups.
      const content = [paragraphWithAccent("Een ", "groene cursief")];
      const { container } = render(<ArticleBody content={content} />);
      expect(
        container.querySelector("em.text-jersey-deep.font-black.italic"),
      ).toBeNull();
      const dropcap = container.querySelector('[data-tone="ink"]');
      expect(dropcap?.textContent).toBe("Een groene cursief");
    });
  });

  describe("h2 block serializer", () => {
    // h2 body headings delegate to <QASectionDivider> per the 5.d3 lock —
    // tests assert the delegation produces the divider's separator + title
    // structure rather than the inline-h2 geometry from the earlier draft.
    it("renders the section-break treatment via <QASectionDivider>", () => {
      const content = [
        paragraph("Body opens."),
        heading("Het seizoen."),
        paragraph("Body continues."),
      ];
      render(<ArticleBody content={content} />);
      const separator = screen.getByRole("separator", {
        name: "Het seizoen.",
      });
      expect(separator).toBeTruthy();
      expect(separator.tagName.toLowerCase()).toBe("aside");
    });

    it("renders the h2 text inside the divider's title slot", () => {
      const content = [paragraph("Body opens."), heading("Het seizoen.")];
      const { container } = render(<ArticleBody content={content} />);
      const titleSlot = container.querySelector('[data-divider="title"]');
      expect(titleSlot).toBeTruthy();
      expect(titleSlot?.textContent).toBe("Het seizoen.");
    });

    it("preserves accent decorator marks on h2 text", () => {
      const accentHeading: PortableTextBlock = {
        _type: "block",
        _key: "h-accent",
        style: "h2",
        children: [
          { _type: "span", _key: "h-c1", text: "Het ", marks: [] },
          {
            _type: "span",
            _key: "h-c2",
            text: "vertrouwen",
            marks: ["accent"],
          },
          { _type: "span", _key: "h-c3", text: " keert terug.", marks: [] },
        ],
        markDefs: [],
      } as PortableTextBlock;
      const content = [paragraph("Body opens."), accentHeading];
      const { container } = render(<ArticleBody content={content} />);
      const accentSpan = container.querySelector('[data-divider="accent"]');
      expect(accentSpan).toBeTruthy();
      expect(accentSpan?.textContent).toBe("vertrouwen");
    });
  });

  describe("container", () => {
    it("renders on a cream surface at --container-prose width", () => {
      const content = [paragraph("Body content.")];
      const { container } = render(<ArticleBody content={content} />);
      const outer = container.firstElementChild as HTMLElement;
      expect(outer.className).toContain("bg-cream");
      const inner = outer.firstElementChild as HTMLElement;
      expect(inner.style.maxWidth).toBe("var(--container-prose)");
    });
  });
});
