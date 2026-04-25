import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { InterviewTemplate } from "./InterviewTemplate";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";

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

const MAXIM: IndexedSubject = {
  _key: "maxim-k",
  kind: "player",
  playerRef: {
    firstName: "Maxim",
    lastName: "Breugelmans",
    jerseyNumber: 9,
    position: "Middenvelder",
    transparentImageUrl: null,
    psdImageUrl: "https://example.com/maxim.jpg",
  },
};

const intro = (key: string, text: string): PortableTextBlock =>
  ({
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, marks: [], text }],
  }) as unknown as PortableTextBlock;

const simpleBody: PortableTextBlock[] = [
  intro("p1", "Een korte inleiding boven het eerste qaBlock."),
];

describe("InterviewTemplate", () => {
  it("renders the interview hero with the title and a subject-driven subtitle", () => {
    render(
      <InterviewTemplate
        title="Drive, passie, doorzettingsvermogen"
        publishedDate="19.04.2026"
        readingTime="6 min lezen"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        subjects={[MAXIM]}
        body={simpleBody}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Drive, passie, doorzettingsvermogen",
    );
    expect(screen.getByTestId("interview-hero-subtitle")).toHaveTextContent(
      "Maxim Breugelmans",
    );
  });

  it("renders the body inside an .article-body container so the §7.3/§7.4 scoped styles apply, with first <p> as a direct child for the drop-cap selector", () => {
    const { container } = render(
      <InterviewTemplate
        title="Title"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        subjects={[MAXIM]}
        body={simpleBody}
      />,
    );

    const articleBody = container.querySelector(".article-body");
    expect(articleBody).not.toBeNull();
    // §7.3 drop-cap rule targets `.article-body > p:first-of-type::first-letter`,
    // so when an interview opens with a prose intro the <p> must be a direct
    // child. Mirrors the AnnouncementTemplate guard against a future
    // SanityArticleBody refactor inserting an intermediate wrapper.
    expect(
      articleBody!.querySelector(":scope > p:first-of-type"),
    ).not.toBeNull();
  });

  it("wraps the body in ArticleBodyMotion so descendant <p>/<h2>/<h3> gain the fade-up base class", () => {
    const { container } = render(
      <InterviewTemplate
        title="Title"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        subjects={[MAXIM]}
        body={simpleBody}
      />,
    );

    // ArticleBodyMotion's useEffect tags every <p>, <h2>, <h3> beneath the
    // wrapper with `article-body-motion`. Without the wrapper, no element
    // gains the class — so a non-zero count proves the wrapper is wired
    // around the body.
    const motionEls = container.querySelectorAll(".article-body-motion");
    expect(motionEls.length).toBeGreaterThan(0);
  });

  it("renders nothing for the body when body is null or empty", () => {
    const { container, rerender } = render(
      <InterviewTemplate
        title="Title"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        subjects={[MAXIM]}
        body={null}
      />,
    );
    expect(container.querySelector(".article-body")).toBeNull();

    rerender(
      <InterviewTemplate
        title="Title"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        subjects={[MAXIM]}
        body={[]}
      />,
    );
    expect(container.querySelector(".article-body")).toBeNull();
  });

  it("renders the metadata bar with the publication date and reading time", () => {
    render(
      <InterviewTemplate
        title="Title"
        publishedDate="19.04.2026"
        readingTime="6 min lezen"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
        subjects={[MAXIM]}
        body={simpleBody}
      />,
    );
    const metadata = screen.getByRole("navigation", { name: /artikelinfo/i });
    expect(metadata).toHaveTextContent("19.04.2026");
    expect(metadata).toHaveTextContent("6 min lezen");
    // Implicit club-author default supplied by ArticleMetadata — guards the
    // dedupe of the per-template `const AUTHOR = "KCVV Elewijt"` (#1361).
    expect(metadata).toHaveTextContent("KCVV Elewijt");
  });
});
