/**
 * Analytics regression for <VerderLezenRow>.
 *
 * Ports the contract previously held by <RelatedContentSection> (see
 * apps/web/src/components/related/RelatedContentSection/RelatedContentSection.analytics.test.tsx)
 * — same event names, same payload shapes, same dedup behaviour so the
 * existing GA4 reports + GTM tags continue to work untouched.
 *
 * Tests assert the policy, not the wire format of any one call, so an
 * accidental regression to per-type code paths or to a different dedup
 * mechanism is caught here.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { VerderLezenRow, type VerderLezenItem } from "./VerderLezenRow";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

// `useArticleAnalytics` internally calls `trackEvent` for
// `related_article_click`, so mocking `trackEvent` covers both
// emission paths. The hook itself is still real (we want to assert
// the article→article guard fires the correct wrapped event).

import { trackEvent } from "@/lib/analytics/track-event";

const trackEventMock = vi.mocked(trackEvent);

const articleItem: VerderLezenItem = {
  title: "Verslag van de derby",
  href: "/nieuws/verslag-derby",
  badge: "NIEUWS",
  analyticsId: "art-1",
  analyticsSource: "editorial",
  analyticsType: "article",
  analyticsTargetSlug: "verslag-derby",
};

const pageItem: VerderLezenItem = {
  title: "Clubinfo",
  href: "/club/clubinfo",
  badge: "PAGINA",
  analyticsId: "page-1",
  analyticsSource: "ai",
  analyticsType: "page",
  analyticsTargetSlug: "clubinfo",
};

const playerItem: VerderLezenItem = {
  title: "Jan Janssens",
  href: "/spelers/12345",
  badge: "SPELER",
  analyticsId: "player-1",
  analyticsSource: "reference",
  analyticsType: "player",
  // Legacy parity: player uses psdId as target_slug.
  analyticsTargetSlug: "12345",
};

const teamItem: VerderLezenItem = {
  title: "A-ploeg",
  href: "/ploegen/a-ploeg",
  badge: "PLOEG",
  analyticsId: "team-1",
  analyticsSource: "reference",
  analyticsType: "team",
  analyticsTargetSlug: "a-ploeg",
};

const eventItem: VerderLezenItem = {
  title: "Spaghetti-avond",
  href: "/events/spaghetti-avond",
  badge: "EVENEMENT",
  analyticsId: "event-1",
  analyticsSource: "editorial",
  analyticsType: "event",
  analyticsTargetSlug: "spaghetti-avond",
};

describe("VerderLezenRow — analytics", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  describe("related_content_shown (impression)", () => {
    it("fires once on mount with single-source payload", () => {
      render(
        <VerderLezenRow
          items={[articleItem]}
          pageType="article"
          pageSlug="verslag-derby"
        />,
      );

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
        <VerderLezenRow
          items={[articleItem, pageItem, playerItem]}
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

    it("content_types preserves input order (not alphabetical)", () => {
      render(
        <VerderLezenRow
          items={[teamItem, playerItem, articleItem]}
          pageType="article"
          pageSlug="t"
        />,
      );

      const call = trackEventMock.mock.calls.find(
        (c) => c[0] === "related_content_shown",
      );
      const payload = call?.[1] as { content_types: string };

      // Input-ordered (team / player / article). An accidental alpha-sort
      // would produce "article,player,team" — direct equality rejects that.
      expect(payload.content_types).toBe("team,player,article");
    });

    it("deduplicates content_types when multiple items share a type", () => {
      render(
        <VerderLezenRow
          items={[
            articleItem,
            {
              ...articleItem,
              href: "/nieuws/art-2",
              analyticsId: "art-2",
              analyticsTargetSlug: "art-2",
            },
          ]}
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
      render(<VerderLezenRow items={[]} pageType="article" pageSlug="test" />);

      expect(trackEventMock).not.toHaveBeenCalled();
    });

    it("fires once on mount, not on re-render (dedup guard)", () => {
      const { rerender } = render(
        <VerderLezenRow
          items={[articleItem]}
          pageType="article"
          pageSlug="test"
        />,
      );

      rerender(
        <VerderLezenRow
          items={[articleItem]}
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

    it("does not fire when pageType / pageSlug are omitted (Storybook isolation)", () => {
      render(<VerderLezenRow items={[articleItem]} />);

      expect(trackEventMock).not.toHaveBeenCalled();
    });
  });

  describe("related_content_click", () => {
    it("fires with slug for article targets", () => {
      render(
        <VerderLezenRow
          items={[articleItem]}
          pageType="article"
          pageSlug="page-host"
        />,
      );

      trackEventMock.mockClear();

      const link = screen.getByRole("link", { name: articleItem.title });
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
        <VerderLezenRow
          items={[playerItem]}
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
        <VerderLezenRow
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
        <VerderLezenRow
          items={[teamItem]}
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

    it("position is 1-indexed and stable across slots", () => {
      const items: VerderLezenItem[] = Array.from({ length: 4 }, (_, i) => ({
        ...articleItem,
        href: `/nieuws/slug-${i + 1}`,
        title: `Titel ${i + 1}`,
        analyticsId: `art-${i + 1}`,
        analyticsTargetSlug: `slug-${i + 1}`,
      }));

      render(
        <VerderLezenRow
          items={items}
          pageType="article"
          pageSlug="page-host"
        />,
      );

      trackEventMock.mockClear();

      const link3 = screen.getByRole("link", { name: "Titel 3" });
      fireEvent.click(link3);

      const call = trackEventMock.mock.calls.find(
        (c) => c[0] === "related_content_click",
      );
      const payload = call?.[1] as { position: number };
      expect(payload.position).toBe(3);
    });

    it("does not fire click event when analytics is disabled (no pageType)", () => {
      render(<VerderLezenRow items={[articleItem]} />);

      const link = screen.getByRole("link", { name: articleItem.title });
      fireEvent.click(link);

      expect(trackEventMock).not.toHaveBeenCalled();
    });
  });

  describe("related_article_click (typed article→article)", () => {
    it("fires alongside related_content_click for article→article navigation", () => {
      render(
        <VerderLezenRow
          items={[articleItem]}
          pageType="article"
          pageSlug="source-article"
          sourceArticleType="interview"
        />,
      );

      trackEventMock.mockClear();

      const link = screen.getByRole("link", { name: articleItem.title });
      fireEvent.click(link);

      const calls = trackEventMock.mock.calls.map((c) => c[0]);
      expect(calls).toContain("related_content_click");
      expect(calls).toContain("related_article_click");

      const articleClick = trackEventMock.mock.calls.find(
        (c) => c[0] === "related_article_click",
      );
      const payload = articleClick?.[1] as {
        article_type: string;
        related_article_id_hashed: string;
        position: number;
      };
      // `article_type` is normalised — interview stays interview.
      expect(payload.article_type).toBe("interview");
      // Related id is hashed by `useArticleAnalytics`, so a non-empty
      // value (not the raw id) is the policy assertion here.
      expect(typeof payload.related_article_id_hashed).toBe("string");
      expect(payload.related_article_id_hashed.length).toBeGreaterThan(0);
      expect(payload.related_article_id_hashed).not.toBe("art-1");
      expect(payload.position).toBe(1);
    });

    it("does not fire related_article_click when target is a non-article", () => {
      render(
        <VerderLezenRow
          items={[playerItem]}
          pageType="article"
          pageSlug="source-article"
          sourceArticleType="interview"
        />,
      );

      trackEventMock.mockClear();

      const link = screen.getByRole("link", { name: /Jan Janssens/i });
      fireEvent.click(link);

      const calls = trackEventMock.mock.calls.map((c) => c[0]);
      expect(calls).toContain("related_content_click");
      expect(calls).not.toContain("related_article_click");
    });

    it("does not fire related_article_click when sourceArticleType is undefined", () => {
      render(
        <VerderLezenRow
          items={[articleItem]}
          pageType="article"
          pageSlug="source-article"
        />,
      );

      trackEventMock.mockClear();

      const link = screen.getByRole("link", { name: articleItem.title });
      fireEvent.click(link);

      const calls = trackEventMock.mock.calls.map((c) => c[0]);
      expect(calls).toContain("related_content_click");
      expect(calls).not.toContain("related_article_click");
    });
  });
});
