import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { describe, expect, it } from "vitest";
import { QASectionDivider } from "./QASectionDivider";

const titlePlain: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "t1",
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: "s1",
        text: "De jaren tussen de lijnen.",
        marks: [],
      },
    ],
  },
];

const titleWithAccent: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "t2",
    style: "normal",
    markDefs: [],
    children: [
      { _type: "span", _key: "s1", text: "De jaren ", marks: [] },
      { _type: "span", _key: "s2", text: "tussen", marks: ["accent"] },
      { _type: "span", _key: "s3", text: " de lijnen.", marks: [] },
    ],
  },
];

describe("QASectionDivider", () => {
  it("renders the flat title text", () => {
    render(<QASectionDivider title={titlePlain} />);
    expect(screen.getByText("De jaren tussen de lijnen.")).toBeInTheDocument();
  });

  it("renders accent decorator spans inside <em> with jersey-deep + font-black", () => {
    const { container } = render(<QASectionDivider title={titleWithAccent} />);
    const accent = container.querySelector('em[data-divider="accent"]');
    expect(accent).not.toBeNull();
    expect(accent?.textContent).toBe("tussen");
    expect(accent?.className).toMatch(/text-jersey-deep/);
    expect(accent?.className).toMatch(/font-black/);
  });

  it("renders two decorative ✦ glyphs as flex children with aria-hidden", () => {
    const { container } = render(<QASectionDivider title={titlePlain} />);
    const glyphs = container.querySelectorAll('[data-divider="glyph"]');
    expect(glyphs).toHaveLength(2);
    glyphs.forEach((g) => {
      expect(g).toHaveAttribute("aria-hidden", "true");
      expect(g.textContent).toBe("✦");
    });
  });

  it("renders two flex 1px ink rules with aria-hidden", () => {
    const { container } = render(<QASectionDivider title={titlePlain} />);
    const rules = container.querySelectorAll('[data-divider="rule"]');
    expect(rules).toHaveLength(2);
    rules.forEach((r) => expect(r).toHaveAttribute("aria-hidden", "true"));
  });

  it("uses an <aside role=separator> with aria-label set to the plain title text", () => {
    const { container } = render(<QASectionDivider title={titleWithAccent} />);
    const root = container.firstChild as HTMLElement;
    expect(root.tagName).toBe("ASIDE");
    expect(root).toHaveAttribute("role", "separator");
    expect(root).toHaveAttribute("aria-label", "De jaren tussen de lijnen.");
  });

  it("omits the kicker row when no kicker is supplied", () => {
    const { container } = render(<QASectionDivider title={titlePlain} />);
    expect(container.querySelector('[data-divider="kicker"]')).toBeNull();
  });

  it("renders the kicker as mono caps when supplied", () => {
    render(
      <QASectionDivider title={titlePlain} kicker="AKTE 02 · DE OVERSTAP" />,
    );
    const kicker = screen.getByText("AKTE 02 · DE OVERSTAP");
    expect(kicker).toHaveAttribute("data-divider", "kicker");
    expect(kicker.className).toMatch(/font-mono/);
    expect(kicker.className).toMatch(/uppercase/);
  });

  it("composes top-row children in [rule, glyph, title, glyph, rule] order", () => {
    const { container } = render(<QASectionDivider title={titlePlain} />);
    const root = container.firstChild as HTMLElement;
    const row = root.firstChild as HTMLElement;
    const children = Array.from(row.children);
    expect(children).toHaveLength(5);
    expect(children[0]).toHaveAttribute("data-divider", "rule");
    expect(children[1]).toHaveAttribute("data-divider", "glyph");
    expect(children[2]).toHaveAttribute("data-divider", "title");
    expect(children[3]).toHaveAttribute("data-divider", "glyph");
    expect(children[4]).toHaveAttribute("data-divider", "rule");
  });
});
