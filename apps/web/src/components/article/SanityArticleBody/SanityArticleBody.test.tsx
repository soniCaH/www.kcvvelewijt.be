import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { SanityArticleBody } from "./SanityArticleBody";
import type { PortableTextBlock } from "@portabletext/react";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

function makeHtmlTableBlock(html: string): PortableTextBlock {
  return {
    _type: "htmlTable",
    _key: "table1",
    html,
  } as unknown as PortableTextBlock;
}

const SIMPLE_TABLE_HTML = `
<table>
  <thead><tr><th>Name</th><th>Score</th></tr></thead>
  <tbody>
    <tr><td>Alice</td><td>10</td></tr>
    <tr><td>Bob</td><td>20</td></tr>
    <tr><td>Carol</td><td>30</td></tr>
  </tbody>
</table>`;

describe("SanityArticleBody htmlTable", () => {
  it("wraps table in relative outer > scrollable inner + gradient overlay", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const outer = container.querySelector("div.relative");
    expect(outer).toBeInTheDocument();

    // Should have exactly 2 children: scrollable div + gradient div
    expect(outer?.children).toHaveLength(2);

    const scrollable = outer?.children[0] as HTMLElement;
    expect(scrollable.className).toContain("overflow-x-auto");
    expect(scrollable.querySelector("table")).toBeInTheDocument();

    const gradient = outer?.children[1] as HTMLElement;
    expect(gradient.className).toContain("pointer-events-none");
    expect(gradient.className).toContain("absolute");
  });

  it("applies alternating row background classes to scrollable container", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const scrollable = container.querySelector(
      "div.relative > div.overflow-x-auto",
    );
    expect(scrollable).toBeInTheDocument();

    const classes = scrollable!.className;
    expect(classes).toContain("[&_tbody_tr:nth-child(odd)_td]:bg-white");
    expect(classes).toContain("[&_tbody_tr:nth-child(even)_td]:bg-gray-50");
  });

  it("applies sticky first column classes", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const scrollable = container.querySelector(
      "div.relative > div.overflow-x-auto",
    );
    const classes = scrollable!.className;

    // Sticky td:first-child
    expect(classes).toContain("[&_td:first-child]:sticky");
    expect(classes).toContain("[&_td:first-child]:left-0");
    expect(classes).toContain("[&_td:first-child]:z-10");

    // Sticky first column backgrounds match row colours
    expect(classes).toContain(
      "[&_tbody_tr:nth-child(odd)_td:first-child]:bg-white",
    );
    expect(classes).toContain(
      "[&_tbody_tr:nth-child(even)_td:first-child]:bg-gray-50",
    );

    // Sticky th:first-child with higher z-index
    expect(classes).toContain("[&_th:first-child]:sticky");
    expect(classes).toContain("[&_th:first-child]:left-0");
    expect(classes).toContain("[&_th:first-child]:z-20");
    expect(classes).toContain("[&_th:first-child]:bg-gray-100");
  });

  it("applies shadow to sticky column for visual separation", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const scrollable = container.querySelector(
      "div.relative > div.overflow-x-auto",
    );
    const classes = scrollable!.className;

    expect(classes).toContain(
      "[&_td:first-child]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]",
    );
    expect(classes).toContain(
      "[&_th:first-child]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]",
    );
  });

  it("gradient overlay has correct styling classes", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const gradient = container.querySelector("div.relative > div:last-child");
    expect(gradient).toBeInTheDocument();

    const classes = gradient!.className;
    expect(classes).toContain("pointer-events-none");
    expect(classes).toContain("absolute");
    expect(classes).toContain("inset-y-0");
    expect(classes).toContain("right-0");
    expect(classes).toContain("w-10");
  });

  it("renders table without thead without errors", () => {
    const noTheadHtml = `<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>`;
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(noTheadHtml)]} />,
    );

    const outer = container.querySelector("div.relative");
    expect(outer).toBeInTheDocument();
    expect(outer?.querySelector("table")).toBeInTheDocument();
  });
});
