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

function transferFactBlock(
  overrides: {
    _key?: string;
    direction?: "incoming" | "outgoing" | "extension";
    playerName?: string;
    otherClubName?: string;
    kcvvContext?: string;
    until?: string;
  } = {},
): PortableTextBlock {
  return {
    _type: "transferFact",
    _key: overrides._key ?? `tf-${overrides.playerName ?? "x"}`,
    direction: overrides.direction ?? "incoming",
    playerName: overrides.playerName ?? "Joren De Smet",
    otherClubName: overrides.otherClubName ?? "Diest",
    kcvvContext: overrides.kcvvContext ?? "#14",
    until: overrides.until,
  } as unknown as PortableTextBlock;
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

function paragraphWithLink(text: string, href: string): PortableTextBlock {
  return {
    _type: "block",
    _key: "link-block",
    style: "normal",
    children: [{ _type: "span", _key: "lc", text, marks: ["lk"] }],
    markDefs: [{ _type: "link", _key: "lk", href }],
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

  describe("social link affordance (CMS-2)", () => {
    it("renders a Facebook link as a bordered icon affordance, not .prose-link", () => {
      const content = [
        paragraph("First paragraph, plain (DropCap target)."),
        paragraphWithLink("Volg ons", "https://facebook.com/KCVVElewijt/"),
      ];
      const { container } = render(<ArticleBody content={content} />);
      const link = container.querySelector('a[data-article-link="social"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute("href")).toBe(
        "https://facebook.com/KCVVElewijt/",
      );
      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.className).not.toContain("prose-link");
      expect(link?.querySelector("svg")).toBeTruthy(); // brand icon present
      expect(link?.textContent).toContain("Volg ons");
    });

    it("keeps the .prose-link marker for non-social external links", () => {
      const content = [
        paragraph("First paragraph, plain (DropCap target)."),
        paragraphWithLink("Bekijk", "https://www.voetbalvlaanderen.be"),
      ];
      const { container } = render(<ArticleBody content={content} />);
      expect(
        container.querySelector('a[data-article-link="social"]'),
      ).toBeNull();
      expect(container.querySelector("a.prose-link")).toBeTruthy();
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

  describe("EndMark closer", () => {
    it("renders <EndMark> after the last body block when content is non-empty", () => {
      const content = [paragraph("Body content.")];
      const { container } = render(<ArticleBody content={content} />);
      const endmark = container.querySelector('[data-endmark="star"]');
      expect(endmark).not.toBeNull();
    });

    it("does not render <EndMark> when content is empty", () => {
      const { container } = render(<ArticleBody content={[]} />);
      expect(container.querySelector('[data-endmark="star"]')).toBeNull();
    });

    it("does not render <EndMark> when content contains only empty paragraphs", () => {
      // Defensive: a non-empty `content` array whose blocks all render
      // nothing must not orphan the closer above blank space.
      const emptyParagraph = paragraph("");
      const { container } = render(<ArticleBody content={[emptyParagraph]} />);
      expect(container.querySelector('[data-endmark="star"]')).toBeNull();
    });

    it("does not render <EndMark> when content contains only an empty pullQuote", () => {
      const emptyPullQuote = {
        _type: "pullQuote",
        _key: "empty-pq",
        body: "",
      } as unknown as PortableTextBlock;
      const { container } = render(<ArticleBody content={[emptyPullQuote]} />);
      expect(container.querySelector('[data-endmark="star"]')).toBeNull();
    });

    it("places <EndMark> after the DropCap paragraph in DOM order", () => {
      const content = [paragraph("First."), paragraph("Second.")];
      const { container } = render(<ArticleBody content={content} />);
      const endmark = container.querySelector('[data-endmark="star"]');
      const dropcap = container.querySelector('[data-tone="ink"]');
      expect(endmark).not.toBeNull();
      expect(dropcap).not.toBeNull();
      const cmp = dropcap!.compareDocumentPosition(endmark!);
      // Node.DOCUMENT_POSITION_FOLLOWING = 4
      expect(cmp & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  describe("pullQuote PT serializer", () => {
    function pullQuoteBlock(
      overrides: Record<string, unknown> = {},
    ): PortableTextBlock {
      return {
        _type: "pullQuote",
        _key: `pq-${Math.random().toString(36).slice(2, 8)}`,
        body: "Een tribune die zingt is meer waard dan welke aanwinst dan ook.",
        ...overrides,
      } as unknown as PortableTextBlock;
    }

    it("renders nothing when body is missing or empty", () => {
      const { container } = render(
        <ArticleBody
          content={[
            paragraph("First."),
            pullQuoteBlock({ body: "" }),
            paragraph("Second."),
          ]}
        />,
      );
      expect(container.querySelector("[data-pull-quote-tone]")).toBeNull();
    });

    it("renders <PullQuote> with avatar slot when respondentKey resolves", () => {
      const content = [
        paragraph("First."),
        pullQuoteBlock({ respondentKey: "subj-1", tone: "cream" }),
      ];
      const subjects = [
        {
          _key: "subj-1",
          kind: "player" as const,
          playerRef: {
            firstName: "Maxim",
            lastName: "Breugelmans",
            jerseyNumber: 9,
            psdImageUrl: "https://example.com/maxim.jpg",
          },
        },
      ];
      const { container } = render(
        <ArticleBody content={content} subjects={subjects} />,
      );
      expect(
        container.querySelector('[data-pull-quote-tone="cream"]'),
      ).not.toBeNull();
      expect(
        container.querySelector('[data-subject-avatar="photo"]'),
      ).not.toBeNull();
      const displayName = container.querySelector(
        '[data-pull-quote-name="display"]',
      );
      expect(displayName?.textContent).toBe("Maxim Breugelmans");
    });

    it("falls back to monogram avatar when the resolved subject has no photo", () => {
      const content = [
        paragraph("First."),
        pullQuoteBlock({ respondentKey: "subj-1" }),
      ];
      const subjects = [
        {
          _key: "subj-1",
          kind: "staff" as const,
          staffRef: {
            firstName: "Anouk",
            lastName: "De Wit",
            functionTitle: "BESTUUR",
            photoUrl: null,
          },
        },
      ];
      const { container } = render(
        <ArticleBody content={content} subjects={subjects} />,
      );
      expect(
        container.querySelector('[data-subject-avatar="monogram"]'),
      ).not.toBeNull();
    });

    it("falls back to inline mono-caps attribution for external-source quotes", () => {
      const content = [
        paragraph("First."),
        pullQuoteBlock({
          externalName: "Het Nieuwsblad",
          externalSource: "23 MEI 2026",
        }),
      ];
      const { container } = render(<ArticleBody content={content} />);
      // No avatar slot.
      expect(container.querySelector("[data-subject-avatar]")).toBeNull();
      // No display-name span (that only renders in the avatar layout).
      expect(
        container.querySelector('[data-pull-quote-name="display"]'),
      ).toBeNull();
    });

    it("threads tone='ink' from the PT block through to <PullQuote>", () => {
      const content = [
        paragraph("First."),
        pullQuoteBlock({ externalName: "Coach", tone: "ink" }),
      ];
      const { container } = render(<ArticleBody content={content} />);
      expect(
        container.querySelector('[data-pull-quote-tone="ink"]'),
      ).not.toBeNull();
    });
  });

  describe("transferFact adjacency grouping", () => {
    it("renders an isolated transferFact as a 1-up single group", () => {
      const content = [
        paragraph("Lead-in paragraph."),
        transferFactBlock({ playerName: "Joren De Smet" }),
        paragraph("Closing paragraph."),
      ];
      const { container } = render(<ArticleBody content={content} />);
      const groups = container.querySelectorAll("[data-transfer-fact-group]");
      expect(groups.length).toBe(1);
      expect(groups[0]?.getAttribute("data-transfer-fact-group")).toBe(
        "single",
      );
      expect(
        container.querySelectorAll('[data-transfer-fact-card="true"]').length,
      ).toBe(1);
    });

    it("renders two consecutive transferFacts as a 2-up grid group", () => {
      const content = [
        paragraph("Lead-in paragraph."),
        transferFactBlock({ _key: "tf-a", playerName: "Joren De Smet" }),
        transferFactBlock({ _key: "tf-b", playerName: "Bram Vanhoutte" }),
      ];
      const { container } = render(<ArticleBody content={content} />);
      const groups = container.querySelectorAll("[data-transfer-fact-group]");
      expect(groups.length).toBe(1);
      expect(groups[0]?.getAttribute("data-transfer-fact-group")).toBe("grid");
      expect(groups[0]?.getAttribute("data-transfer-fact-count")).toBe("2");
      const cards = container.querySelectorAll(
        '[data-transfer-fact-card="true"]',
      );
      expect(cards.length).toBe(2);
      // Neither card should span both columns when the count is even.
      const spans = container.querySelectorAll(".md\\:col-span-2");
      expect(spans.length).toBe(0);
    });

    it("flags the trailing odd card with md:col-span-2 in a 3-up group", () => {
      const content = [
        paragraph("Lead-in."),
        transferFactBlock({ _key: "tf-a", playerName: "A" }),
        transferFactBlock({ _key: "tf-b", playerName: "B" }),
        transferFactBlock({ _key: "tf-c", playerName: "C" }),
      ];
      const { container } = render(<ArticleBody content={content} />);
      const group = container.querySelector(
        '[data-transfer-fact-group="grid"]',
      );
      expect(group?.getAttribute("data-transfer-fact-count")).toBe("3");
      const children = Array.from(group?.children ?? []);
      // First two siblings render at single-column width, last spans both.
      expect(children[0]?.className).not.toContain("md:col-span-2");
      expect(children[1]?.className).not.toContain("md:col-span-2");
      expect(children[2]?.className).toContain("md:col-span-2");
    });

    it("splits a paragraph-separated transferFact pair into two isolated groups", () => {
      const content = [
        paragraph("Lead-in."),
        transferFactBlock({ _key: "tf-a", playerName: "A" }),
        paragraph("Mid-paragraph interrupts the run."),
        transferFactBlock({ _key: "tf-b", playerName: "B" }),
      ];
      const { container } = render(<ArticleBody content={content} />);
      const groups = container.querySelectorAll("[data-transfer-fact-group]");
      expect(groups.length).toBe(2);
      expect(groups[0]?.getAttribute("data-transfer-fact-group")).toBe(
        "single",
      );
      expect(groups[1]?.getAttribute("data-transfer-fact-group")).toBe(
        "single",
      );
    });

    it("skips empty-playerName transferFact blocks (no hollow card shell)", () => {
      const content = [
        paragraph("Lead-in."),
        transferFactBlock({ _key: "tf-empty", playerName: "" }),
        paragraph("Closing."),
      ];
      const { container } = render(<ArticleBody content={content} />);
      expect(container.querySelector("[data-transfer-fact-group]")).toBeNull();
      expect(
        container.querySelector('[data-transfer-fact-card="true"]'),
      ).toBeNull();
    });

    it("renders <EndMark> for a body that contains only a non-empty transferFact", () => {
      const content = [transferFactBlock({ playerName: "Solo transfer" })];
      const { container } = render(<ArticleBody content={content} />);
      expect(container.querySelector('[data-endmark="label"]')).not.toBeNull();
    });

    it("omits <EndMark> for an article whose only transferFact has no playerName", () => {
      const content = [transferFactBlock({ playerName: "" })];
      const { container } = render(<ArticleBody content={content} />);
      expect(container.querySelector('[data-endmark="label"]')).toBeNull();
    });
  });
});
