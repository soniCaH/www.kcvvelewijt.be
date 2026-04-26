import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedContentSection } from "./RelatedContentSection";
import type {
  RelatedArticleItem,
  RelatedEventItem,
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

const event = (
  id: string,
  source: RelatedEventItem["source"] = "editorial",
  title = `Evenement ${id}`,
): RelatedEventItem => ({
  type: "event",
  source,
  id,
  title,
  slug: `event-slug-${id}`,
  dateStart: "2026-05-15T18:00:00Z",
  dateEnd: null,
  imageUrl: null,
});

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

      render(
        <RelatedContentSection
          items={items}
          pageType="article"
          pageSlug="test"
        />,
      );

      const links = screen.getAllByRole("link");
      const titles = links.map((a) => a.getAttribute("aria-label") ?? "");

      // Editorial comes first — lead slot
      expect(titles[0]).toBe("Editorial");
      expect(titles[1]).toBe("AI");
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

    it("links article items to /nieuws/{slug} and page items to /club/{slug}", () => {
      // Page documents are served at /club/[slug] in the app router.
      // Regression: the old slider linked pages to /{slug}, which 404'd for
      // every page not accidentally living at the site root.
      render(
        <RelatedContentSection
          items={[
            article("a1", "editorial", "Een artikel"),
            page("p1", "editorial"),
          ]}
          pageType="article"
          pageSlug="host"
        />,
      );

      const articleLink = screen.getByRole("link", { name: "Een artikel" });
      expect(articleLink.getAttribute("href")).toBe("/nieuws/slug-a1");

      const pageLink = screen.getByRole("link", { name: "Pagina p1" });
      expect(pageLink.getAttribute("href")).toBe("/club/pagina-p1");
    });
  });

  describe("event variant", () => {
    it("treats event items as content (renders the 'Gerelateerd' grid, not the entity strip)", () => {
      render(
        <RelatedContentSection
          items={[event("e1")]}
          pageType="article"
          pageSlug="host"
        />,
      );

      expect(screen.getByText("Gerelateerd")).toBeInTheDocument();
      expect(screen.queryByText("In dit artikel")).not.toBeInTheDocument();
    });

    it("renders the 'Evenement' badge", () => {
      render(
        <RelatedContentSection
          items={[event("e1")]}
          pageType="article"
          pageSlug="host"
        />,
      );

      expect(screen.getByText("Evenement")).toBeInTheDocument();
    });

    it("links event items to /events/{slug}", () => {
      render(
        <RelatedContentSection
          items={[event("e1", "editorial", "Spaghetti-avond")]}
          pageType="article"
          pageSlug="host"
        />,
      );

      const eventLink = screen.getByRole("link", { name: "Spaghetti-avond" });
      expect(eventLink.getAttribute("href")).toBe("/events/event-slug-e1");
    });
  });
});
