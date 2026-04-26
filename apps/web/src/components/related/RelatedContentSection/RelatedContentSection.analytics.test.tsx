/**
 * Analytics regression for RelatedContentSection.
 *
 * Encodes the policy carried over from RelatedContentSlider:
 *   - Impression event fires once per mount (dedup via useRef).
 *   - `source` is a single source when all items share one, otherwise "mixed".
 *   - `content_types` is a de-duplicated, comma-joined list of item types.
 *   - Click events fire with target_slug = psdId for players, slug for others.
 *
 * Tests assert the policy, not the wire format of any one call, so an
 * accidental regression to per-type code paths or to a different dedup
 * mechanism is caught here.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
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

const article: RelatedArticleItem = {
  type: "article",
  source: "editorial",
  id: "art-1",
  title: "Verslag van de derby",
  slug: "verslag-derby",
  imageUrl: null,
  date: "2026-03-20T10:00:00Z",
  excerpt: null,
};

const pageItem: RelatedPageItem = {
  type: "page",
  source: "ai",
  id: "page-1",
  title: "Clubinfo",
  slug: "clubinfo",
  imageUrl: null,
  excerpt: null,
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

const eventItem: RelatedEventItem = {
  type: "event",
  source: "editorial",
  id: "event-1",
  title: "Spaghetti-avond",
  slug: "spaghetti-avond",
  dateStart: "2026-05-15T18:00:00Z",
  dateEnd: null,
  imageUrl: null,
};

describe("RelatedContentSection — analytics", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  describe("related_content_shown (impression)", () => {
    it("fires once on mount with single-source payload", () => {
      render(
        <RelatedContentSection
          items={[article]}
          pageType="article"
          pageSlug="verslag-derby"
        />,
      );

      expect(trackEventMock).toHaveBeenCalledTimes(1);
      expect(trackEventMock).toHaveBeenCalledWith("related_content_shown", {
        source: "editorial",
        count: 1,
        content_types: "article",
        page_type: "article",
        page_slug: "verslag-derby",
      });
    });

    it("derives source as 'mixed' when items have different sources", () => {
      render(
        <RelatedContentSection
          items={[article, pageItem, player]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(trackEventMock).toHaveBeenCalledWith("related_content_shown", {
        source: "mixed",
        count: 3,
        content_types: "article,page,player",
        page_type: "article",
        page_slug: "test",
      });
    });

    it("content_types follows rendered order (content before entities, not alphabetical)", () => {
      // Impression tracks what the UI renders: content cards (article/page)
      // come first in the section; entities (player/team/staff) follow in
      // the strip in input order.
      render(
        <RelatedContentSection
          items={[team, player, article]}
          pageType="article"
          pageSlug="t"
        />,
      );

      const call = trackEventMock.mock.calls.find(
        (c) => c[0] === "related_content_shown",
      );
      const payload = call?.[1] as { content_types: string };

      // Partition-ordered: article (content) first, then team, player
      // (entities in input order). An accidental alpha-sort would produce
      // "article,player,team" — direct equality rejects that.
      expect(payload.content_types).toBe("article,team,player");
    });

    it("deduplicates content_types when multiple items share a type", () => {
      render(
        <RelatedContentSection
          items={[article, { ...article, id: "art-2", slug: "art-2" }]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(trackEventMock).toHaveBeenCalledWith("related_content_shown", {
        source: "editorial",
        count: 2,
        content_types: "article",
        page_type: "article",
        page_slug: "test",
      });
    });

    it("does not fire when items array is empty", () => {
      render(
        <RelatedContentSection items={[]} pageType="article" pageSlug="test" />,
      );

      expect(trackEventMock).not.toHaveBeenCalled();
    });

    it("fires once on mount, not on re-render (dedup guard)", () => {
      const { rerender } = render(
        <RelatedContentSection
          items={[article]}
          pageType="article"
          pageSlug="test"
        />,
      );

      rerender(
        <RelatedContentSection
          items={[article]}
          pageType="article"
          pageSlug="test"
        />,
      );

      expect(
        trackEventMock.mock.calls.filter(
          (c) => c[0] === "related_content_shown",
        ),
      ).toHaveLength(1);
    });
  });

  describe("related_content_click", () => {
    it("fires with slug for article targets", () => {
      render(
        <RelatedContentSection
          items={[article]}
          pageType="article"
          pageSlug="page-host"
        />,
      );

      trackEventMock.mockClear();

      const link = screen.getByRole("link", { name: article.title });
      fireEvent.click(link);

      expect(trackEventMock).toHaveBeenCalledWith("related_content_click", {
        source: "editorial",
        target_type: "article",
        target_slug: "verslag-derby",
        position: 1,
        page_type: "article",
        page_slug: "page-host",
      });
    });

    it("uses psdId as target_slug for player entity clicks", () => {
      render(
        <RelatedContentSection
          items={[player]}
          pageType="article"
          pageSlug="page-host"
        />,
      );

      trackEventMock.mockClear();

      const link = screen.getByRole("link", { name: /Jan Janssens/i });
      fireEvent.click(link);

      expect(trackEventMock).toHaveBeenCalledWith("related_content_click", {
        source: "reference",
        target_type: "player",
        target_slug: "12345",
        position: 1,
        page_type: "article",
        page_slug: "page-host",
      });
    });

    it("fires with target_type='event' and slug for event content clicks", () => {
      render(
        <RelatedContentSection
          items={[eventItem]}
          pageType="article"
          pageSlug="page-host"
        />,
      );

      trackEventMock.mockClear();

      const link = screen.getByRole("link", { name: eventItem.title });
      fireEvent.click(link);

      expect(trackEventMock).toHaveBeenCalledWith("related_content_click", {
        source: "editorial",
        target_type: "event",
        target_slug: "spaghetti-avond",
        position: 1,
        page_type: "article",
        page_slug: "page-host",
      });
    });

    it("uses slug as target_slug for team entity clicks", () => {
      render(
        <RelatedContentSection
          items={[team]}
          pageType="article"
          pageSlug="page-host"
        />,
      );

      trackEventMock.mockClear();

      const link = screen.getByRole("link", { name: /A-ploeg/ });
      fireEvent.click(link);

      expect(trackEventMock).toHaveBeenCalledWith("related_content_click", {
        source: "reference",
        target_type: "team",
        target_slug: "a-ploeg",
        position: 1,
        page_type: "article",
        page_slug: "page-host",
      });
    });

    it("does not fire click event for non-interactive staff (no href)", () => {
      render(
        <RelatedContentSection
          items={[staff]}
          pageType="article"
          pageSlug="page-host"
        />,
      );

      trackEventMock.mockClear();

      // Staff without href renders as a div, not a link
      expect(screen.queryByRole("link", { name: /Piet Pieters/i })).toBeNull();

      // Clicking the card shouldn't fire analytics
      fireEvent.click(screen.getByText("Piet Pieters"));
      expect(
        trackEventMock.mock.calls.filter(
          (c) => c[0] === "related_content_click",
        ),
      ).toHaveLength(0);
    });

    it("position is 1-indexed and stable across slots", () => {
      const items = Array.from(
        { length: 4 },
        (_, i) =>
          ({
            ...article,
            id: `art-${i + 1}`,
            slug: `slug-${i + 1}`,
            title: `Titel ${i + 1}`,
          }) satisfies RelatedArticleItem,
      );

      render(
        <RelatedContentSection
          items={items}
          pageType="article"
          pageSlug="host"
        />,
      );

      trackEventMock.mockClear();

      fireEvent.click(screen.getByRole("link", { name: "Titel 1" }));
      expect(trackEventMock).toHaveBeenLastCalledWith(
        "related_content_click",
        expect.objectContaining({ position: 1 }),
      );

      fireEvent.click(screen.getByRole("link", { name: "Titel 2" }));
      expect(trackEventMock).toHaveBeenLastCalledWith(
        "related_content_click",
        expect.objectContaining({ position: 2 }),
      );

      fireEvent.click(screen.getByRole("link", { name: "Titel 3" }));
      expect(trackEventMock).toHaveBeenLastCalledWith(
        "related_content_click",
        expect.objectContaining({ position: 3 }),
      );

      fireEvent.click(screen.getByRole("link", { name: "Titel 4" }));
      expect(trackEventMock).toHaveBeenLastCalledWith(
        "related_content_click",
        expect.objectContaining({ position: 4 }),
      );
    });
  });

  describe("wire format parity with legacy RelatedContentSlider", () => {
    it("impression event shape matches the legacy contract exactly", () => {
      render(
        <RelatedContentSection
          items={[article, player]}
          pageType="article"
          pageSlug="foo"
        />,
      );

      const [eventName, payload] = trackEventMock.mock.calls[0]!;
      expect(eventName).toBe("related_content_shown");
      expect(Object.keys(payload as object).sort()).toEqual(
        ["content_types", "count", "page_slug", "page_type", "source"].sort(),
      );
    });

    it("click event shape matches the legacy contract exactly", () => {
      render(
        <RelatedContentSection
          items={[article]}
          pageType="article"
          pageSlug="foo"
        />,
      );

      trackEventMock.mockClear();
      fireEvent.click(screen.getByRole("link", { name: article.title }));

      const [eventName, payload] = trackEventMock.mock.calls[0]!;
      expect(eventName).toBe("related_content_click");
      expect(Object.keys(payload as object).sort()).toEqual(
        [
          "page_slug",
          "page_type",
          "position",
          "source",
          "target_slug",
          "target_type",
        ].sort(),
      );
    });
  });
});
