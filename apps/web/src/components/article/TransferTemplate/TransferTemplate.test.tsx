import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { TransferTemplate } from "./TransferTemplate";

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

const incoming = {
  _key: "t1",
  _type: "transferFact" as const,
  direction: "incoming" as const,
  playerName: "Maxim Breugelmans",
  otherClubName: "Standard Luik",
  age: 27,
  position: "Middenvelder",
};

const anotherTransfer = {
  _key: "t2",
  _type: "transferFact" as const,
  direction: "outgoing" as const,
  playerName: "Outgoing Player",
  otherClubName: "KV Mechelen",
};

const paragraph = (key: string, text: string): PortableTextBlock =>
  ({
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}-s`, text, marks: [] }],
  }) as unknown as PortableTextBlock;

describe("TransferTemplate", () => {
  it("renders the transfer hero populated from the first transferFact (incoming)", () => {
    render(
      <TransferTemplate
        title="Falls back only if no transferFact"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/m" }}
        body={[
          incoming as unknown as PortableTextBlock,
          paragraph("p1", "Body paragraph."),
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Maxim Breugelmans",
    );
    expect(screen.getByTestId("transfer-hero-kicker").textContent).toMatch(
      /Transfer.*Inkomend/i,
    );
  });

  it("renders the transfer strip below the metadata bar when a feature transferFact exists", () => {
    render(
      <TransferTemplate
        title="Ignored"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/m" }}
        body={[incoming as unknown as PortableTextBlock]}
      />,
    );
    expect(screen.getByTestId("transfer-strip")).toBeInTheDocument();
  });

  it("first transferFact is absorbed by the hero (no duplicate overview), second renders as overview", () => {
    render(
      <TransferTemplate
        title="Ignored"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/m" }}
        body={[
          incoming as unknown as PortableTextBlock,
          paragraph("p1", "Body."),
          anotherTransfer as unknown as PortableTextBlock,
        ]}
      />,
    );
    // Only one `transfer-overview` block — the second transferFact. The
    // first must not render as an overview (it lives in the hero).
    const overviews = screen.getAllByTestId("transfer-overview");
    expect(overviews).toHaveLength(1);
    expect(screen.getByTestId("transfer-overview-name")).toHaveTextContent(
      "Outgoing Player",
    );
  });

  it("falls back to the article title as h1 when the body has no transferFact", () => {
    render(
      <TransferTemplate
        title="Nieuwe Transfer"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/m" }}
        body={[paragraph("p1", "Geen transfer block geleverd.")]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Nieuwe Transfer",
    );
    // No feature = no strip.
    expect(screen.queryByTestId("transfer-strip")).toBeNull();
  });

  it("renders the metadata bar (date · author · reading time)", () => {
    render(
      <TransferTemplate
        title="Ignored"
        publishedDate="19.04.2026"
        readingTime="2 min lezen"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/m" }}
        body={[incoming as unknown as PortableTextBlock]}
      />,
    );
    const meta = screen.getByRole("navigation", { name: /artikelinfo/i });
    expect(meta).toHaveTextContent("19.04.2026");
    expect(meta).toHaveTextContent("2 min lezen");
  });
});
