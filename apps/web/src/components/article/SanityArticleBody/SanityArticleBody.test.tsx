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
    '[data-html-table="true"] > div[role="region"]',
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
  // The deep visual + scroll-hint behaviour is covered by the
  // dedicated <HtmlTableBlock> tests. Here we just verify the
  // SanityArticleBody serializer delegates correctly.
  it("delegates htmlTable blocks to <HtmlTableBlock>", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );
    const wrapper = container.querySelector("[data-html-table='true']");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.querySelector("table")).toBeInTheDocument();
  });

  it("renders an accessible scrollable region with aria-label", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );
    const scrollable = container.querySelector(
      'div[role="region"]',
    ) as HTMLElement;
    expect(scrollable.getAttribute("aria-label")).toBe("Scrollable table");
    expect(scrollable.getAttribute("tabindex")).toBe("0");
  });

  it("renders a gradient affordance only when the table overflows", () => {
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(SIMPLE_TABLE_HTML)]} />,
    );
    const wrapper = container.querySelector("[data-html-table='true']")!;

    simulateOverflow(container, false);
    expect(
      wrapper.querySelector(".pointer-events-none"),
    ).not.toBeInTheDocument();

    simulateOverflow(container, true);
    expect(wrapper.querySelector(".pointer-events-none")).toBeInTheDocument();
  });

  it("renders the table without <thead> without errors", () => {
    const noTheadHtml = `<table><tbody><tr><td>A</td><td>B</td></tr></tbody></table>`;
    const { container } = render(
      <SanityArticleBody content={[makeHtmlTableBlock(noTheadHtml)]} />,
    );
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("returns null when the htmlTable html field is missing", () => {
    const block = {
      _type: "htmlTable",
      _key: "table-empty",
    } as unknown as PortableTextBlock;
    const { container } = render(<SanityArticleBody content={[block]} />);
    expect(container.querySelector("[data-html-table='true']")).toBeNull();
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

  it("renders page reference as link to /club/{slug}", () => {
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
    expect(link!.getAttribute("href")).toBe("/club/about");
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
