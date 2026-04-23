import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { EventTemplate } from "./EventTemplate";

// ArticleBodyMotion reaches for IntersectionObserver — stub both it and
// matchMedia so the render completes in happy-dom.
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

const lentetornooi = {
  _key: "evt-1",
  _type: "eventFact" as const,
  title: "Lentetornooi U13",
  date: "2026-04-27",
  startTime: "10:00",
  endTime: "17:00",
  location: "Sportpark Elewijt",
  ageGroup: "U13",
};

const afterparty = {
  _key: "evt-2",
  _type: "eventFact" as const,
  title: "Afterparty",
  date: "2026-04-27",
  startTime: "20:00",
};

const paragraph = (key: string, text: string): PortableTextBlock =>
  ({
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  }) as unknown as PortableTextBlock;

describe("EventTemplate", () => {
  it("renders the hero with the article title and an EVENT | ageGroup kicker", () => {
    render(
      <EventTemplate
        title="Lentetornooi U13 — zaterdag in Elewijt"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/e" }}
        body={[lentetornooi as unknown as PortableTextBlock]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Lentetornooi U13 — zaterdag in Elewijt",
    );
    expect(screen.getByTestId("event-hero-kicker").textContent).toMatch(
      /Event\s*\|\s*U13/i,
    );
  });

  it("renders the EventStrip when a feature eventFact is present", () => {
    render(
      <EventTemplate
        title="Lentetornooi"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/e" }}
        body={[lentetornooi as unknown as PortableTextBlock]}
      />,
    );
    expect(screen.getByTestId("event-strip")).toBeInTheDocument();
    expect(screen.getByTestId("event-strip-title")).toHaveTextContent(
      "Lentetornooi U13",
    );
  });

  it("first eventFact is absorbed by the strip — only the second renders as an overview row", () => {
    render(
      <EventTemplate
        title="Lentetornooi"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/e" }}
        body={[
          lentetornooi as unknown as PortableTextBlock,
          paragraph("p1", "Body paragraph."),
          afterparty as unknown as PortableTextBlock,
        ]}
      />,
    );
    const overviews = screen.getAllByTestId("event-overview");
    expect(overviews).toHaveLength(1);
    expect(screen.getByTestId("event-overview-title")).toHaveTextContent(
      "Afterparty",
    );
  });

  it("falls back to the article title as h1 when the body has no eventFact", () => {
    render(
      <EventTemplate
        title="Evenementenupdate"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/e" }}
        body={[paragraph("p1", "Geen event block geleverd.")]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Evenementenupdate",
    );
    expect(screen.queryByTestId("event-strip")).toBeNull();
  });

  it("renders the metadata bar (date · author · reading time)", () => {
    render(
      <EventTemplate
        title="Lentetornooi"
        publishedDate="19.04.2026"
        readingTime="2 min lezen"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/e" }}
        body={[lentetornooi as unknown as PortableTextBlock]}
      />,
    );
    const meta = screen.getByRole("navigation", { name: /artikelinfo/i });
    expect(meta).toHaveTextContent("19.04.2026");
    expect(meta).toHaveTextContent("2 min lezen");
  });
});
