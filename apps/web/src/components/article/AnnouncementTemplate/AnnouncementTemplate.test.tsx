import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { AnnouncementTemplate } from "./AnnouncementTemplate";

// IntersectionObserver is reached for by `ArticleBodyMotion`. happy-dom does
// not implement it — stub a minimal no-op so rendering does not throw.
class NoopIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root: Element | Document | null = null;
  rootMargin = "";
  thresholds: ReadonlyArray<number> = [];
  constructor() {}
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", NoopIntersectionObserver);
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const simpleBody: PortableTextBlock[] = [
  {
    _type: "block",
    _key: "p1",
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: "p1-s",
        marks: [],
        text: "Eerste paragraaf met de drop-cap.",
      },
    ],
  } as unknown as PortableTextBlock,
];

describe("AnnouncementTemplate", () => {
  it("renders the announcement hero with the given title and category kicker", () => {
    render(
      <AnnouncementTemplate
        title="Een nieuw hoofdstuk"
        category="Nieuws"
        publishedDate="19 April 2026"
        readingTime="4 min lezen"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        body={simpleBody}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Een nieuw hoofdstuk",
    );
    expect(screen.getByTestId("announcement-hero-kicker")).toHaveTextContent(
      /Nieuws/,
    );
  });

  it("renders the body inside an .article-body container with the first <p> as a direct child so the drop-cap selector resolves", () => {
    const { container } = render(
      <AnnouncementTemplate
        title="Title"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        body={simpleBody}
      />,
    );

    const articleBody = container.querySelector(".article-body");
    expect(articleBody).not.toBeNull();
    // Drop-cap rule targets `.article-body > p:first-of-type::first-letter`,
    // so the <p> must be a direct child — not a nested descendant. In this
    // template `.article-body` is applied to the same div that carries
    // `.prose`, so PortableText's top-level block emits <p> as a direct
    // child. Guard against a future refactor inserting an intermediate
    // wrapper that would silently break the drop-cap.
    expect(
      articleBody!.querySelector(":scope > p:first-of-type"),
    ).not.toBeNull();
  });

  it("renders nothing for the body when body is null or empty", () => {
    const { container, rerender } = render(
      <AnnouncementTemplate
        title="Title"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        body={null}
      />,
    );
    expect(container.querySelector(".article-body")).toBeNull();

    rerender(
      <AnnouncementTemplate
        title="Title"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        body={[]}
      />,
    );
    expect(container.querySelector(".article-body")).toBeNull();
  });

  it("renders the metadata bar with the publication date, author and reading time", () => {
    render(
      <AnnouncementTemplate
        title="Title"
        publishedDate="19.04.2026"
        readingTime="4 min lezen"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        body={simpleBody}
      />,
    );
    const metadata = screen.getByRole("navigation", { name: /artikelinfo/i });
    expect(metadata).toHaveTextContent("19.04.2026");
    expect(metadata).toHaveTextContent("4 min lezen");
  });
});
