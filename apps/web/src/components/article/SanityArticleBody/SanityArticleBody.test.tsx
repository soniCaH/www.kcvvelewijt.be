import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { SanityArticleBody } from "./SanityArticleBody";
import type { PortableTextBlock } from "@portabletext/react";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

let resizeCallback: ResizeObserverCallback;

class MockResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    resizeCallback = cb;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

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

function simulateOverflow(container: HTMLElement, overflows: boolean) {
  const scrollable = container.querySelector(
    'div.relative > div[role="region"]',
  ) as HTMLElement;

  Object.defineProperty(scrollable, "scrollWidth", {
    value: overflows ? 600 : 400,
    configurable: true,
  });
  Object.defineProperty(scrollable, "clientWidth", {
    value: 400,
    configurable: true,
  });

  act(() => {
    resizeCallback([], {} as ResizeObserver);
  });
}

describe("SanityArticleBody htmlTable", () => {
  it("wraps table in relative outer > scrollable inner", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const outer = container.querySelector("div.relative");
    expect(outer).toBeInTheDocument();

    const scrollable = outer?.querySelector(
      'div[role="region"]',
    ) as HTMLElement;
    expect(scrollable.className).toContain("overflow-x-auto");
    expect(scrollable.querySelector("table")).toBeInTheDocument();
  });

  it("applies alternating row background classes to scrollable container", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const scrollable = container.querySelector(
      'div.relative > div[role="region"]',
    );
    expect(scrollable).toBeInTheDocument();

    const classes = scrollable!.className;
    expect(classes).toContain("[&>table>tbody>tr:nth-child(odd)_td]:bg-white");
    expect(classes).toContain(
      "[&>table>tbody>tr:nth-child(even)_td]:bg-table-row-even",
    );
  });

  it("applies sticky first column classes only when overflowing", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const scrollable = container.querySelector(
      'div.relative > div[role="region"]',
    )!;

    // No overflow → no sticky classes
    simulateOverflow(container, false);
    expect(scrollable.className).not.toContain(
      "[&>table_td:first-child]:sticky",
    );

    // Overflow → sticky classes applied
    simulateOverflow(container, true);
    const classes = scrollable.className;

    expect(classes).toContain("[&>table_td:first-child]:sticky");
    expect(classes).toContain("[&>table_td:first-child]:left-0");
    expect(classes).toContain("[&>table_td:first-child]:z-10");

    expect(classes).toContain(
      "[&>table>tbody>tr:nth-child(odd)>td:first-child]:bg-white",
    );
    expect(classes).toContain(
      "[&>table>tbody>tr:nth-child(even)>td:first-child]:bg-table-row-even",
    );

    expect(classes).toContain("[&>table_th:first-child]:sticky");
    expect(classes).toContain("[&>table_th:first-child]:left-0");
    expect(classes).toContain("[&>table_th:first-child]:z-20");
    expect(classes).toContain("[&>table_th:first-child]:bg-table-header-bg");
  });

  it("applies shadow to sticky column only when overflowing", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const scrollable = container.querySelector(
      'div.relative > div[role="region"]',
    )!;

    // No overflow → no shadow
    simulateOverflow(container, false);
    expect(scrollable.className).not.toContain(
      "[&>table_td:first-child]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]",
    );

    // Overflow → shadow applied
    simulateOverflow(container, true);
    const classes = scrollable.className;

    expect(classes).toContain(
      "[&>table_td:first-child]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]",
    );
    expect(classes).toContain(
      "[&>table_th:first-child]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]",
    );
  });

  it("renders gradient overlay only when content overflows", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const outer = container.querySelector("div.relative")!;

    // No overflow → no gradient
    simulateOverflow(container, false);
    expect(
      outer.querySelector(".pointer-events-none.absolute"),
    ).not.toBeInTheDocument();

    // Overflow → gradient appears
    simulateOverflow(container, true);
    expect(
      outer.querySelector(".pointer-events-none.absolute"),
    ).toBeInTheDocument();
  });

  it("has accessible scrollable container with tabIndex and aria-label", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    const scrollable = container.querySelector(
      'div[role="region"]',
    ) as HTMLElement;
    expect(scrollable).toBeInTheDocument();
    expect(scrollable.getAttribute("tabindex")).toBe("0");
    expect(scrollable.getAttribute("aria-label")).toBe("Scrollable table");
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

  it("renders nested table inside a td without errors", () => {
    const nestedHtml = `
      <table>
        <thead><tr><th>Outer</th></tr></thead>
        <tbody>
          <tr><td>
            <table><tbody><tr><td>Inner</td></tr></tbody></table>
          </td></tr>
        </tbody>
      </table>`;
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(nestedHtml)]} />,
    );

    const tables = container.querySelectorAll("table");
    expect(tables).toHaveLength(2);

    const scrollable = container.querySelector(
      'div[role="region"]',
    ) as HTMLElement;
    // Selectors use [&>table] so only direct child table is targeted
    expect(scrollable.className).toContain("[&>table]:w-full");
  });

  it("applies sticky classes to tbody th cells when overflowing", () => {
    const tbodyThHtml = `
      <table>
        <tbody>
          <tr><th>Header in body</th><td>Value</td></tr>
        </tbody>
      </table>`;
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(tbodyThHtml)]} />,
    );

    simulateOverflow(container, true);

    const scrollable = container.querySelector(
      'div[role="region"]',
    ) as HTMLElement;
    const classes = scrollable.className;

    // th:first-child sticky classes apply to th regardless of thead/tbody
    expect(classes).toContain("[&>table_th:first-child]:sticky");
    expect(classes).toContain("[&>table_th:first-child]:left-0");

    // The th element should be present
    expect(scrollable.querySelector("tbody th")).toBeInTheDocument();
  });

  it("does NOT render gradient or sticky classes when table does not overflow", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );

    simulateOverflow(container, false);

    const outer = container.querySelector("div.relative")!;
    expect(outer.querySelector(".pointer-events-none")).not.toBeInTheDocument();

    const scrollable = outer.querySelector('div[role="region"]')!;
    expect(scrollable.className).not.toContain(
      "[&>table_td:first-child]:sticky",
    );
  });
});

function makeTextBlock(
  text: string,
  style: string = "normal",
): PortableTextBlock {
  return {
    _type: "block",
    _key: `block-${Math.random().toString(36).slice(2, 8)}`,
    style,
    children: [{ _type: "span", _key: "s1", text, marks: [] }],
    markDefs: [],
  } as unknown as PortableTextBlock;
}

function makeBlockquote(text: string): PortableTextBlock {
  return makeTextBlock(text, "blockquote");
}

function makeLinkBlock(text: string, href: string): PortableTextBlock {
  return {
    _type: "block",
    _key: `block-${Math.random().toString(36).slice(2, 8)}`,
    style: "normal",
    children: [{ _type: "span", _key: "s1", text, marks: ["link1"] }],
    markDefs: [{ _key: "link1", _type: "link", href }],
  } as unknown as PortableTextBlock;
}

function makeFileAttachmentBlock(
  label: string,
  fileUrl: string,
): PortableTextBlock {
  return {
    _type: "fileAttachment",
    _key: "file1",
    label,
    fileUrl,
  } as unknown as PortableTextBlock;
}

function makeImageBlock(
  url: string,
  opts: { alt?: string; fullBleed?: boolean } = {},
): PortableTextBlock {
  return {
    _type: "image",
    _key: "img1",
    asset: { url },
    alt: opts.alt ?? "",
    width: 800,
    height: 450,
    fullBleed: opts.fullBleed,
  } as unknown as PortableTextBlock;
}

describe("SanityArticleBody blockquote", () => {
  it("renders blockquote styled by global CSS (no component-level overrides)", () => {
    const { container } = render(
      <SanityArticleBody content={[makeBlockquote("A wise quote")]} />,
    );

    const blockquote = container.querySelector("blockquote");
    expect(blockquote).toBeInTheDocument();
    expect(blockquote!.textContent).toContain("A wise quote");

    // No component-level background tint — styled by global CSS with decorative quote mark
    expect(blockquote!.className).not.toContain("bg-kcvv-green-100");
  });
});

describe("SanityArticleBody links", () => {
  it("renders all inline links with content-link class", () => {
    const { container } = render(
      <SanityArticleBody
        content={[makeLinkBlock("Visit site", "https://example.com")]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.className).toContain("content-link");
  });

  it("renders external link with target=_blank and rel attributes", () => {
    const { container } = render(
      <SanityArticleBody
        content={[makeLinkBlock("Visit site", "https://example.com")]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("href")).toBe("https://example.com");
    expect(link!.getAttribute("target")).toBe("_blank");
    expect(link!.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders ExternalLink icon for http links", () => {
    const { container } = render(
      <SanityArticleBody
        content={[makeLinkBlock("Visit site", "https://example.com")]}
      />,
    );

    const link = container.querySelector("a");
    const icon = link!.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon!.getAttribute("aria-hidden")).toBe("true");

    const srOnly = link!.querySelector(".sr-only");
    expect(srOnly).toBeInTheDocument();
    expect(srOnly!.textContent).toContain("opens in new tab");
  });

  it("renders internal link without target=_blank and without icon", () => {
    const { container } = render(
      <SanityArticleBody content={[makeLinkBlock("Home", "/nieuws")]} />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("target")).toBeNull();
    expect(link!.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders mailto link without icon and without target=_blank", () => {
    const { container } = render(
      <SanityArticleBody
        content={[makeLinkBlock("Email us", "mailto:info@kcvv.be")]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("href")).toBe("mailto:info@kcvv.be");
    expect(link!.getAttribute("target")).toBeNull();
    expect(link!.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders tel link without icon and without target=_blank", () => {
    const { container } = render(
      <SanityArticleBody
        content={[makeLinkBlock("Call us", "tel:+3215123456")]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("href")).toBe("tel:+3215123456");
    expect(link!.getAttribute("target")).toBeNull();
    expect(link!.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("SanityArticleBody file attachment", () => {
  it("renders DownloadButton component for file attachments", () => {
    const { container } = render(
      <SanityArticleBody
        content={[
          makeFileAttachmentBlock(
            "Download PDF",
            "https://example.com/file.pdf",
          ),
        ]}
      />,
    );

    const link = container.querySelector(
      "a[href='https://example.com/file.pdf']",
    );
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("target")).toBe("_blank");
    expect(link!.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link!.textContent).toContain("Download PDF");
  });

  it("does not render when fileUrl is missing", () => {
    const block = {
      _type: "fileAttachment",
      _key: "file1",
      label: "No URL",
    } as unknown as PortableTextBlock;

    const { container } = render(<SanityArticleBody content={[block]} />);

    expect(container.querySelector("a")).not.toBeInTheDocument();
  });
});

describe("SanityArticleBody images", () => {
  it("renders image constrained to content column by default", () => {
    const { container } = render(
      <SanityArticleBody
        content={[makeImageBlock("https://example.com/photo.jpg")]}
      />,
    );

    const figure = container.querySelector("figure");
    expect(figure).toBeInTheDocument();

    const img = figure!.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img!.getAttribute("src")).toBe("https://example.com/photo.jpg");

    // Default: constrained within content column (no breakout classes)
    const figureClasses = figure!.className;
    expect(figureClasses).not.toContain("full-bleed");
    expect(figureClasses).not.toContain("-mx-");
  });

  it("renders full-bleed image with viewport-width breakout", () => {
    const { container } = render(
      <SanityArticleBody
        content={[
          makeImageBlock("https://example.com/hero.jpg", { fullBleed: true }),
        ]}
      />,
    );

    const figure = container.querySelector("figure");
    expect(figure).toBeInTheDocument();

    // Full-bleed: breaks out of content column symmetrically
    const figureClasses = figure!.className;
    expect(figureClasses).toContain("full-bleed");
  });

  it("does not render when asset url is missing", () => {
    const block = {
      _type: "image",
      _key: "img1",
      asset: {},
    } as unknown as PortableTextBlock;

    const { container } = render(<SanityArticleBody content={[block]} />);

    expect(container.querySelector("figure")).not.toBeInTheDocument();
  });
});

function makeInternalLinkBlock(
  text: string,
  reference: { _type: string; slug?: string; psdId?: string },
): PortableTextBlock {
  return {
    _type: "block",
    _key: `block-${Math.random().toString(36).slice(2, 8)}`,
    style: "normal",
    children: [{ _type: "span", _key: "s1", text, marks: ["il1"] }],
    markDefs: [
      {
        _key: "il1",
        _type: "internalLink",
        reference: {
          _type: reference._type,
          slug: reference.slug,
          psdId: reference.psdId,
        },
      },
    ],
  } as unknown as PortableTextBlock;
}

describe("SanityArticleBody internalLink", () => {
  it("renders player reference as link to /spelers/{psdId}", () => {
    const { container } = render(
      <SanityArticleBody
        content={[
          makeInternalLinkBlock("John Doe", {
            _type: "player",
            psdId: "12345",
          }),
        ]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("href")).toBe("/spelers/12345");
    expect(link!.textContent).toBe("John Doe");
  });

  it("renders team reference as link to /ploegen/{slug}", () => {
    const { container } = render(
      <SanityArticleBody
        content={[
          makeInternalLinkBlock("First Team", {
            _type: "team",
            slug: "eerste-ploeg",
          }),
        ]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("href")).toBe("/ploegen/eerste-ploeg");
  });

  it("renders article reference as link to /nieuws/{slug}", () => {
    const { container } = render(
      <SanityArticleBody
        content={[
          makeInternalLinkBlock("Related Article", {
            _type: "article",
            slug: "some-article",
          }),
        ]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("href")).toBe("/nieuws/some-article");
  });

  it("renders page reference as link to /{slug}", () => {
    const { container } = render(
      <SanityArticleBody
        content={[
          makeInternalLinkBlock("About Us", {
            _type: "page",
            slug: "about",
          }),
        ]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("href")).toBe("/about");
  });

  it("renders with content-link class and no icon", () => {
    const { container } = render(
      <SanityArticleBody
        content={[
          makeInternalLinkBlock("Styled Link", {
            _type: "team",
            slug: "eerste-ploeg",
          }),
        ]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.className).toContain("content-link");
    expect(link!.querySelector("svg")).not.toBeInTheDocument();
  });

  it("does not set target=_blank for internal links", () => {
    const { container } = render(
      <SanityArticleBody
        content={[
          makeInternalLinkBlock("Internal", {
            _type: "article",
            slug: "test",
          }),
        ]}
      />,
    );

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("target")).toBeNull();
  });

  it("renders # href when reference data is missing", () => {
    const block = {
      _type: "block",
      _key: "b1",
      style: "normal",
      children: [
        { _type: "span", _key: "s1", text: "Broken link", marks: ["il1"] },
      ],
      markDefs: [{ _key: "il1", _type: "internalLink" }],
    } as unknown as PortableTextBlock;

    const { container } = render(<SanityArticleBody content={[block]} />);

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
    expect(link!.getAttribute("href")).toBe("#");
  });
});

describe("SanityArticleBody typography", () => {
  it("applies reading-optimized prose styles to wrapper", () => {
    const { container } = render(
      <SanityArticleBody content={[makeTextBlock("Hello world")]} />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    const classes = wrapper.className;

    // Uses prose for typography
    expect(classes).toContain("prose");
    expect(classes).toContain("prose-lg");

    // Heading styles use title font
    expect(classes).toContain("prose-headings:font-title");

    // Links use dark green design token
    expect(classes).toContain("prose-a:text-kcvv-green-dark");
  });
});
