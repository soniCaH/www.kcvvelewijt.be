import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { hashMemberId } from "./useOrganigramAnalytics";

export type ArticleType = "announcement" | "interview" | "transfer" | "event";
export type ShareChannel = "native" | "facebook";

/**
 * Normalise `articleType` to a stable string for analytics. Legacy articles
 * without an explicit type behave as `announcement` on the UI side (see
 * page.tsx renderTemplate default branch); mirror that here so reports
 * don't fragment on `null` vs `"announcement"`.
 */
function normaliseType(articleType: string | null | undefined): ArticleType {
  if (
    articleType === "interview" ||
    articleType === "transfer" ||
    articleType === "event"
  ) {
    return articleType;
  }
  return "announcement";
}

interface ArticleViewInput {
  articleType: string | null | undefined;
  articleId: string;
  hasSubject: boolean;
  /** Only relevant when hasSubject is true. */
  subjectKind?: "player" | "staff" | "custom";
}

interface ArticleShareInput {
  articleType: string | null | undefined;
  articleId: string;
  channel: ShareChannel;
}

interface RelatedArticleClickInput {
  articleType: string | null | undefined;
  relatedArticleId: string;
  /** 1-indexed position in the related grid. */
  position: number;
}

interface EventCtaClickInput {
  articleId: string;
  /** ISO date of the event (eventFact.date). */
  eventDate: string;
  hasTicketUrl: boolean;
}

export function useArticleAnalytics() {
  const trackArticleView = useCallback(
    ({ articleType, articleId, hasSubject, subjectKind }: ArticleViewInput) => {
      trackEvent("article_view", {
        article_type: normaliseType(articleType),
        article_id_hashed: hashMemberId(articleId),
        has_subject: hasSubject,
        ...(hasSubject && subjectKind ? { subject_kind: subjectKind } : {}),
      });
    },
    [],
  );

  const trackArticleShare = useCallback(
    ({ articleType, articleId, channel }: ArticleShareInput) => {
      trackEvent("article_share", {
        article_type: normaliseType(articleType),
        article_id_hashed: hashMemberId(articleId),
        channel,
      });
    },
    [],
  );

  const trackRelatedArticleClick = useCallback(
    ({ articleType, relatedArticleId, position }: RelatedArticleClickInput) => {
      trackEvent("related_article_click", {
        article_type: normaliseType(articleType),
        related_article_id_hashed: hashMemberId(relatedArticleId),
        position,
      });
    },
    [],
  );

  const trackEventCtaClick = useCallback(
    ({ articleId, eventDate, hasTicketUrl }: EventCtaClickInput) => {
      // Always emits `article_type: "event"` — the CTA only exists on event
      // articles. Carrying the param keeps the event shape consistent with
      // the other three article_* events so GA4 explorations can pivot on
      // `article_type` uniformly.
      trackEvent("event_cta_click", {
        article_type: "event",
        article_id_hashed: hashMemberId(articleId),
        event_date: eventDate,
        has_ticket_url: hasTicketUrl,
      });
    },
    [],
  );

  return {
    trackArticleView,
    trackArticleShare,
    trackRelatedArticleClick,
    trackEventCtaClick,
  };
}
