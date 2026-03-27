import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedContentSlider } from "./RelatedContentSlider";
import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
} from "../types";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";

const trackEventMock = vi.mocked(trackEvent);

const article: RelatedArticleItem = {
  type: "article",
  source: "editorial",
  id: "art-1",
  title: "Wedstrijdverslag",
  slug: "wedstrijdverslag",
  imageUrl: null,
  date: "2026-03-20T10:00:00Z",
  excerpt: "Het verslag van de wedstrijd.",
};

const page: RelatedPageItem = {
  type: "page",
  source: "ai",
  id: "page-1",
  title: "Clubinfo",
  slug: "clubinfo",
  imageUrl: null,
  excerpt: "Info over de club.",
};

const player: RelatedPlayerItem = {
  type: "player",
  source: "reference",
  id: "player-1",
  firstName: "Jan",
  lastName: "Janssens",
  position: "Aanvaller",
  imageUrl: null,
  psdId: "12345",
};

const team: RelatedTeamItem = {
  type: "team",
  source: "reference",
  id: "team-1",
  name: "A-ploeg",
  slug: "a-ploeg",
  imageUrl: null,
  tagline: null,
};

const staff: RelatedStaffItem = {
  type: "staff",
  source: "reference",
  id: "staff-1",
  firstName: "Piet",
  lastName: "Pieters",
  role: "Trainer",
  imageUrl: null,
};

describe("RelatedContentSlider", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  it("renders section heading 'Gerelateerd'", () => {
    render(
      <RelatedContentSlider
        items={[article]}
        pageType="article"
        pageSlug="test-slug"
      />,
    );

    expect(screen.getByText("Gerelateerd")).toBeInTheDocument();
  });

  it("returns null when items array is empty", () => {
    const { container } = render(
      <RelatedContentSlider items={[]} pageType="article" pageSlug="test" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders correct card variant per item type", () => {
    render(
      <RelatedContentSlider
        items={[article, player, team]}
        pageType="article"
        pageSlug="test"
      />,
    );

    expect(screen.getByText("Wedstrijdverslag")).toBeInTheDocument();
    expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
    expect(screen.getByText("A-ploeg")).toBeInTheDocument();
  });

  it("orders items: articles/pages → players → staff → teams", () => {
    // Pass in reverse order — component should reorder
    const items = [team, staff, player, page, article];
    const { container } = render(
      <RelatedContentSlider items={items} pageType="article" pageSlug="test" />,
    );

    const cards = container.querySelectorAll("[data-related-card]");
    const types = Array.from(cards).map((c) =>
      c.getAttribute("data-related-card"),
    );

    expect(types).toEqual(["article", "page", "player", "staff", "team"]);
  });

  it("renders all 5 variant types in a mixed array", () => {
    render(
      <RelatedContentSlider
        items={[article, page, player, team, staff]}
        pageType="article"
        pageSlug="test"
      />,
    );

    expect(screen.getByText("Wedstrijdverslag")).toBeInTheDocument();
    expect(screen.getByText("Clubinfo")).toBeInTheDocument();
    expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
    expect(screen.getByText("A-ploeg")).toBeInTheDocument();
    expect(screen.getByText("Piet Pieters")).toBeInTheDocument();
  });

  describe("related_content_shown event", () => {
    it("fires on mount with correct parameters for a single-source array", () => {
      const editorialArticle: RelatedArticleItem = {
        ...article,
        source: "editorial",
      };
      render(
        <RelatedContentSlider
          items={[editorialArticle]}
          pageType="article"
          pageSlug="wedstrijdverslag"
        />,
      );

      expect(trackEventMock).toHaveBeenCalledWith("related_content_shown", {
        source: "editorial",
        count: 1,
        content_types: "article",
        page_type: "article",
        page_slug: "wedstrijdverslag",
      });
    });

    it("derives source as 'mixed' when items come from different sources", () => {
      const aiArticle: RelatedArticleItem = { ...article, source: "ai" };
      const refPlayer: RelatedPlayerItem = { ...player, source: "reference" };

      render(
        <RelatedContentSlider
          items={[aiArticle, refPlayer]}
          pageType="article"
          pageSlug="test-article"
        />,
      );

      expect(trackEventMock).toHaveBeenCalledWith("related_content_shown", {
        source: "mixed",
        count: 2,
        content_types: "article,player",
        page_type: "article",
        page_slug: "test-article",
      });
    });

    it("does not fire when items array is empty", () => {
      render(
        <RelatedContentSlider items={[]} pageType="article" pageSlug="test" />,
      );

      expect(trackEventMock).not.toHaveBeenCalled();
    });

    it("fires once on mount, not on re-renders", () => {
      const { rerender } = render(
        <RelatedContentSlider
          items={[article]}
          pageType="article"
          pageSlug="test"
        />,
      );

      rerender(
        <RelatedContentSlider
          items={[article]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(trackEventMock).toHaveBeenCalledTimes(1);
    });
  });
});
