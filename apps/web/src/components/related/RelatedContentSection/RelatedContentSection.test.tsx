import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedContentSection } from "./RelatedContentSection";
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

const article = (
  id: string,
  source: RelatedArticleItem["source"] = "editorial",
  title = `Artikel ${id}`,
): RelatedArticleItem => ({
  type: "article",
  source,
  id,
  title,
  slug: `slug-${id}`,
  imageUrl: null,
  date: "2026-03-20T10:00:00Z",
  excerpt: null,
});

const page = (
  id: string,
  source: RelatedPageItem["source"] = "ai",
): RelatedPageItem => ({
  type: "page",
  source,
  id,
  title: `Pagina ${id}`,
  slug: `pagina-${id}`,
  imageUrl: null,
  excerpt: null,
});

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

describe("RelatedContentSection", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  it("returns null when items array is empty", () => {
    const { container } = render(
      <RelatedContentSection items={[]} pageType="article" pageSlug="test" />,
    );

    expect(container.firstChild).toBeNull();
  });

  describe("partition", () => {
    it("routes article/page into content and player/team/staff into entities", () => {
      render(
        <RelatedContentSection
          items={[article("1"), page("2"), player, team, staff]}
          pageType="article"
          pageSlug="test"
        />,
      );

      // Content bucket headings
      expect(screen.getByText("Gerelateerd")).toBeInTheDocument();
      // Entity strip heading
      expect(screen.getByText("In dit artikel")).toBeInTheDocument();
      // Entity names rendered
      expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
      expect(screen.getByText("A-ploeg")).toBeInTheDocument();
      expect(screen.getByText("Piet Pieters")).toBeInTheDocument();
    });

    it("hides entity strip when no entities", () => {
      render(
        <RelatedContentSection
          items={[article("1")]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(screen.queryByText("In dit artikel")).not.toBeInTheDocument();
    });

    it("hides content grid when no content items", () => {
      render(
        <RelatedContentSection
          items={[player, team]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(screen.queryByText("Gerelateerd")).not.toBeInTheDocument();
      expect(screen.getByText("In dit artikel")).toBeInTheDocument();
    });
  });

  describe("sort order", () => {
    it("orders content items editorial → reference → ai", () => {
      // content bucket accepts article/page only; reference source lives on
      // entities in production, but the priority table still covers it for
      // cross-source content items should that ever change.
      const items = [
        article("ai", "ai", "AI"),
        article("ed", "editorial", "Editorial"),
      ];

      const { container } = render(
        <RelatedContentSection
          items={items}
          pageType="article"
          pageSlug="test"
        />,
      );

      const cards = container.querySelectorAll("[data-related-card]");
      const titles = Array.from(cards).map((c) => c.textContent ?? "");

      // Editorial comes first — lead slot
      expect(titles[0]).toContain("Editorial");
      expect(titles[1]).toContain("AI");
    });
  });

  describe("slot allocation", () => {
    it("uses slice(0,1) for lead, slice(1,3) for right-stack, slice(3,6) for overflow", () => {
      const items = Array.from({ length: 7 }, (_, i) =>
        article(String(i + 1), "editorial", `Artikel ${i + 1}`),
      );

      render(
        <RelatedContentSection
          items={items}
          pageType="article"
          pageSlug="test"
        />,
      );

      // Lead + rightStack + overflow = 1 + 2 + 3 = 6 titles rendered
      // (7th is dropped by slice(3,6))
      expect(screen.getByText("Artikel 1")).toBeInTheDocument();
      expect(screen.getByText("Artikel 2")).toBeInTheDocument();
      expect(screen.getByText("Artikel 3")).toBeInTheDocument();
      expect(screen.getByText("Artikel 4")).toBeInTheDocument();
      expect(screen.getByText("Artikel 5")).toBeInTheDocument();
      expect(screen.getByText("Artikel 6")).toBeInTheDocument();
      expect(screen.queryByText("Artikel 7")).not.toBeInTheDocument();
    });

    it("renders only lead when exactly one content item", () => {
      render(
        <RelatedContentSection
          items={[article("1", "editorial", "Solo")]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(screen.getByText("Solo")).toBeInTheDocument();
    });
  });

  describe("pluralisation", () => {
    it("uses 'onderwerp' for a single content item", () => {
      render(
        <RelatedContentSection
          items={[article("1")]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(screen.getByText("1 onderwerp")).toBeInTheDocument();
    });

    it("uses 'onderwerpen' for multiple content items", () => {
      render(
        <RelatedContentSection
          items={[article("1"), article("2")]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(screen.getByText("2 onderwerpen")).toBeInTheDocument();
    });
  });

  describe("badges", () => {
    it("renders 'Artikel' / 'Pagina' badges, not category labels", () => {
      render(
        <RelatedContentSection
          items={[
            article("1", "editorial", "Een artikel"),
            page("2", "editorial"),
          ]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(screen.getByText("Artikel")).toBeInTheDocument();
      expect(screen.getByText("Pagina")).toBeInTheDocument();
    });
  });
});
