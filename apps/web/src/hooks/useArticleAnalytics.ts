import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { hashMemberId } from "@/lib/analytics/hash-member-id";

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
  /**
   * Interview subject count (1–4). Emitted as `subject_count` on
   * interview articles; omitted on other types so the GA4 dimension
   * stays unambiguous. Undefined or zero on interviews is omitted too
   * (defensive — schema requires ≥1 subject on interview publish).
   */
  subjectCount?: number;
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
    ({
      articleType,
      articleId,
      hasSubject,
      subjectKind,
      subjectCount,
    }: ArticleViewInput) => {
      const type = normaliseType(articleType);
      const emitCount =
        type === "interview" &&
        typeof subjectCount === "number" &&
        subjectCount > 0;
      trackEvent("article_view", {
        article_type: type,
        article_id_hashed: hashMemberId(articleId),
        has_subject: hasSubject,
        ...(hasSubject && subjectKind ? { subject_kind: subjectKind } : {}),
        ...(emitCount ? { subject_count: subjectCount } : {}),
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
      const cleanEventDate = eventDate.trim();
      trackEvent("event_cta_click", {
        article_type: "event",
        article_id_hashed: hashMemberId(articleId),
        ...(cleanEventDate ? { event_date: cleanEventDate } : {}),
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
