import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import type { PortableTextBlock } from "@portabletext/react";
import { QaPairQuote } from "./QaPairQuote";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

const answer = (text: string): PortableTextBlock[] => [
  {
    _type: "block",
    _key: "ans-1",
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: "s1", text, marks: [] }],
  },
];

const playerSubject: SubjectValue = {
  kind: "player",
  playerRef: {
    firstName: "Koen",
    lastName: "Dewaele",
    jerseyNumber: 9,
    transparentImageUrl: null,
    psdImageUrl: null,
  },
};

/**
 * happy-dom does not implement IntersectionObserver and defaults
 * `matchMedia().matches` to `false`. Each test installs the stubs it needs
 * and restores originals afterwards so tests do not leak into each other.
 */
function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

let observerInstance: MockIntersectionObserver | null = null;

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root: Element | Document | null = null;
  rootMargin = "";
  thresholds: ReadonlyArray<number> = [];

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    // Capture the instance for manual triggering in tests. Aliasing `this`
    // into a module-level sink is the standard pattern for observer-based
    // mocks; the lint rule exists for production code, not test plumbing.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    observerInstance = this;
  }
}

describe("QaPairQuote", () => {
  beforeEach(() => {
    observerInstance = null;
    stubMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the quote text, decorative glyph, and attribution", () => {
    render(
      <QaPairQuote
        answer={answer("Ik voetbal nog altijd met schrik in de buik.")}
        subject={playerSubject}
      />,
    );

    expect(screen.getByTestId("qa-pair-quote")).toBeInTheDocument();
    expect(screen.getByTestId("qa-pair-quote-glyph")).toBeInTheDocument();
    expect(
      screen.getByText("Ik voetbal nog altijd met schrik in de buik."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("subject-attribution-quote")).toHaveTextContent(
      "Koen Dewaele",
    );
  });

  it("starts the glyph hidden (opacity 0) and triggers motion on IntersectionObserver callback", () => {
    render(
      <QaPairQuote answer={answer("Een dramatisch citaat.")} subject={null} />,
    );

    const glyph = screen.getByTestId("qa-pair-quote-glyph");
    expect(glyph).toHaveStyle({ opacity: "0" });

    // Trigger the observer manually inside act() so React flushes the
    // resulting state update synchronously before we assert.
    expect(observerInstance).not.toBeNull();
    act(() => {
      observerInstance!.callback(
        [
          {
            isIntersecting: true,
            target: glyph,
            intersectionRatio: 1,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0,
          },
        ],
        observerInstance as unknown as IntersectionObserver,
      );
    });

    expect(glyph).toHaveStyle({ opacity: "0.12" });
  });

  it("snaps the glyph straight to the final state when prefers-reduced-motion is set", () => {
    stubMatchMedia(true);
    render(<QaPairQuote answer={answer("Reduced motion.")} subject={null} />);

    const glyph = screen.getByTestId("qa-pair-quote-glyph");
    expect(glyph).toHaveStyle({ opacity: "0.12" });
    expect(glyph).toHaveStyle({ transition: "none" });
  });
});
