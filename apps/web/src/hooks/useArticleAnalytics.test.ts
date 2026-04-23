import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { useArticleAnalytics } from "./useArticleAnalytics";
import { hashMemberId } from "./useOrganigramAnalytics";

const mockTrackEvent = vi.mocked(trackEvent);

describe("useArticleAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("article_view", () => {
    it("fires with hashed article_id, article_type and subject metadata", () => {
      const { result } = renderHook(() => useArticleAnalytics());

      act(() => {
        result.current.trackArticleView({
          articleType: "interview",
          articleId: "abc-123",
          hasSubject: true,
          subjectKind: "player",
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("article_view", {
        article_type: "interview",
        article_id_hashed: hashMemberId("abc-123"),
        has_subject: true,
        subject_kind: "player",
      });
    });

    it("omits subject_kind when hasSubject is false", () => {
      const { result } = renderHook(() => useArticleAnalytics());

      act(() => {
        result.current.trackArticleView({
          articleType: "announcement",
          articleId: "id-1",
          hasSubject: false,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("article_view", {
        article_type: "announcement",
        article_id_hashed: hashMemberId("id-1"),
        has_subject: false,
      });
    });

    it("normalises missing articleType to 'announcement' (legacy fallback)", () => {
      const { result } = renderHook(() => useArticleAnalytics());

      act(() => {
        result.current.trackArticleView({
          articleType: null,
          articleId: "id-legacy",
          hasSubject: false,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("article_view", {
        article_type: "announcement",
        article_id_hashed: hashMemberId("id-legacy"),
        has_subject: false,
      });
    });
  });

  describe("article_share", () => {
    it("fires with article_type, hashed id, and channel", () => {
      const { result } = renderHook(() => useArticleAnalytics());

      act(() => {
        result.current.trackArticleShare({
          articleType: "event",
          articleId: "evt-1",
          channel: "facebook",
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("article_share", {
        article_type: "event",
        article_id_hashed: hashMemberId("evt-1"),
        channel: "facebook",
      });
    });

    it("accepts 'native' as a share channel", () => {
      const { result } = renderHook(() => useArticleAnalytics());

      act(() => {
        result.current.trackArticleShare({
          articleType: "interview",
          articleId: "int-1",
          channel: "native",
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("article_share", {
        article_type: "interview",
        article_id_hashed: hashMemberId("int-1"),
        channel: "native",
      });
    });
  });

  describe("related_article_click", () => {
    it("fires with hashed related id, 1-indexed position, and source article_type", () => {
      const { result } = renderHook(() => useArticleAnalytics());

      act(() => {
        result.current.trackRelatedArticleClick({
          articleType: "transfer",
          relatedArticleId: "rel-9",
          position: 3,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("related_article_click", {
        article_type: "transfer",
        related_article_id_hashed: hashMemberId("rel-9"),
        position: 3,
      });
    });
  });

  describe("event_cta_click", () => {
    it("fires with hashed article id, event_date, and has_ticket_url", () => {
      const { result } = renderHook(() => useArticleAnalytics());

      act(() => {
        result.current.trackEventCtaClick({
          articleId: "evt-2",
          eventDate: "2026-04-27",
          hasTicketUrl: true,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("event_cta_click", {
        article_type: "event",
        article_id_hashed: hashMemberId("evt-2"),
        event_date: "2026-04-27",
        has_ticket_url: true,
      });
    });

    it("fires with has_ticket_url=false when ticket url is absent", () => {
      const { result } = renderHook(() => useArticleAnalytics());

      act(() => {
        result.current.trackEventCtaClick({
          articleId: "evt-3",
          eventDate: "2026-05-01",
          hasTicketUrl: false,
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith("event_cta_click", {
        article_type: "event",
        article_id_hashed: hashMemberId("evt-3"),
        event_date: "2026-05-01",
        has_ticket_url: false,
      });
    });
  });
});
