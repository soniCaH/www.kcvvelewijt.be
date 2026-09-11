import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { FakeIntersectionObserver } from "@/../tests/helpers/fake-observers.helpers";
import { ArticleBodyMotion } from "./ArticleBodyMotion";

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

describe("ArticleBodyMotion", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    stubMatchMedia(false);
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders its children", () => {
    render(
      <ArticleBodyMotion>
        <p data-testid="child-p">Hello</p>
      </ArticleBodyMotion>,
    );
    expect(screen.getByTestId("child-p")).toHaveTextContent("Hello");
  });

  it("observes every p, h2 and h3 under the container and tags them with the base motion class", () => {
    render(
      <ArticleBodyMotion>
        <p data-testid="p1">Paragraph one.</p>
        <h2 data-testid="h2">Section heading</h2>
        <p data-testid="p2">Paragraph two.</p>
        <h3 data-testid="h3">Sub heading</h3>
      </ArticleBodyMotion>,
    );

    expect(FakeIntersectionObserver.latest()).not.toBeUndefined();
    // One observer instance covers all four elements.
    expect(FakeIntersectionObserver.latest()!.observe).toHaveBeenCalledTimes(4);
    expect(screen.getByTestId("p1")).toHaveClass("article-body-motion");
    expect(screen.getByTestId("h2")).toHaveClass("article-body-motion");
    expect(screen.getByTestId("p2")).toHaveClass("article-body-motion");
    expect(screen.getByTestId("h3")).toHaveClass("article-body-motion");
  });

  it("configures the observer per design §7.5 (threshold 0.15, rootMargin '0px 0px -10% 0px')", () => {
    render(
      <ArticleBodyMotion>
        <p>Content</p>
      </ArticleBodyMotion>,
    );

    expect(FakeIntersectionObserver.latest()?.options?.threshold).toBe(0.15);
    expect(FakeIntersectionObserver.latest()?.options?.rootMargin).toBe(
      "0px 0px -10% 0px",
    );
  });

  it("adds the --entered class when an element intersects and stops observing it", () => {
    render(
      <ArticleBodyMotion>
        <p data-testid="p1">Paragraph one.</p>
      </ArticleBodyMotion>,
    );

    const p1 = screen.getByTestId("p1");
    expect(p1).toHaveClass("article-body-motion");
    expect(p1).not.toHaveClass("article-body-motion--entered");

    act(() => {
      FakeIntersectionObserver.latest()!.trigger([
        { isIntersecting: true, target: p1, intersectionRatio: 1 },
      ]);
    });

    expect(p1).toHaveClass("article-body-motion--entered");
    expect(FakeIntersectionObserver.latest()!.unobserve).toHaveBeenCalledWith(
      p1,
    );
  });

  it("does not instantiate an observer when prefers-reduced-motion is reduce", () => {
    stubMatchMedia(true);

    render(
      <ArticleBodyMotion>
        <p data-testid="p1">Paragraph.</p>
      </ArticleBodyMotion>,
    );

    expect(FakeIntersectionObserver.latest()).toBeUndefined();
    // And the base motion class is not applied either — elements render at
    // their final state straight away so there is nothing to transition.
    expect(screen.getByTestId("p1")).not.toHaveClass("article-body-motion");
  });
});
