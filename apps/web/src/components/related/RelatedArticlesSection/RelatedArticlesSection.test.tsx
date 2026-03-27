import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelatedArticlesSection } from "./RelatedArticlesSection";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";

const trackEventMock = vi.mocked(trackEvent);

const mockArticles = [
  {
    id: "article-1",
    title: "Interview met Jan",
    slug: "interview-jan",
    publishedAt: "2026-03-20T10:00:00Z",
    featured: false,
    coverImageUrl: "https://cdn.sanity.io/img1.jpg",
    tags: [],
  },
  {
    id: "article-2",
    title: "Wedstrijdverslag",
    slug: "wedstrijdverslag",
    publishedAt: "2026-03-19T10:00:00Z",
    featured: false,
    tags: [],
  },
];

describe("RelatedArticlesSection", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  it("renders section heading and article links", () => {
    render(
      <RelatedArticlesSection
        articles={mockArticles}
        pageType="player"
        pageSlug="12345"
      />,
    );

    expect(screen.getByText("Gerelateerd")).toBeInTheDocument();
    expect(screen.getByText("Interview met Jan")).toBeInTheDocument();
    expect(screen.getByText("Wedstrijdverslag")).toBeInTheDocument();
  });

  it("renders article links pointing to /nieuws/[slug]", () => {
    render(
      <RelatedArticlesSection
        articles={mockArticles}
        pageType="player"
        pageSlug="12345"
      />,
    );

    const link = screen.getByText("Interview met Jan").closest("a");
    expect(link).toHaveAttribute("href", "/nieuws/interview-jan");
  });

  it("returns null when articles array is empty", () => {
    const { container } = render(
      <RelatedArticlesSection
        articles={[]}
        pageType="player"
        pageSlug="12345"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders article cover images when available", () => {
    render(
      <RelatedArticlesSection
        articles={mockArticles}
        pageType="player"
        pageSlug="12345"
      />,
    );

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1); // Only article-1 has a coverImageUrl
    expect(images[0]).toHaveAttribute("alt", "Interview met Jan");
  });

  describe("related_content_shown event", () => {
    it("fires on mount with source 'reference' and correct parameters", () => {
      render(
        <RelatedArticlesSection
          articles={mockArticles}
          pageType="player"
          pageSlug="12345"
        />,
      );

      expect(trackEventMock).toHaveBeenCalledWith("related_content_shown", {
        source: "reference",
        count: 2,
        content_types: "article",
        page_type: "player",
        page_slug: "12345",
      });
    });

    it("does not fire when articles array is empty", () => {
      render(
        <RelatedArticlesSection
          articles={[]}
          pageType="player"
          pageSlug="12345"
        />,
      );

      expect(trackEventMock).not.toHaveBeenCalled();
    });

    it("fires once on mount, not on re-renders", () => {
      const { rerender } = render(
        <RelatedArticlesSection
          articles={mockArticles}
          pageType="player"
          pageSlug="12345"
        />,
      );

      rerender(
        <RelatedArticlesSection
          articles={mockArticles}
          pageType="player"
          pageSlug="12345"
        />,
      );

      expect(trackEventMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("related_content_click event", () => {
    it("fires on article link click with correct parameters", async () => {
      render(
        <RelatedArticlesSection
          articles={mockArticles}
          pageType="team"
          pageSlug="a-ploeg"
        />,
      );

      trackEventMock.mockClear(); // clear impression event

      await userEvent.click(screen.getByText("Interview met Jan"));

      expect(trackEventMock).toHaveBeenCalledWith("related_content_click", {
        source: "reference",
        target_type: "article",
        target_slug: "interview-jan",
        position: 1,
        page_type: "team",
        page_slug: "a-ploeg",
      });
    });

    it("fires with correct 1-indexed position for each article", async () => {
      render(
        <RelatedArticlesSection
          articles={mockArticles}
          pageType="team"
          pageSlug="a-ploeg"
        />,
      );

      trackEventMock.mockClear();

      await userEvent.click(screen.getByText("Wedstrijdverslag"));

      expect(trackEventMock).toHaveBeenCalledWith("related_content_click", {
        source: "reference",
        target_type: "article",
        target_slug: "wedstrijdverslag",
        position: 2,
        page_type: "team",
        page_slug: "a-ploeg",
      });
    });
  });
});
