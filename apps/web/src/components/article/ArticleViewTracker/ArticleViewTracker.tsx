"use client";

import { useEffect, useRef } from "react";
import { useArticleAnalytics } from "@/hooks/useArticleAnalytics";

export interface ArticleViewTrackerProps {
  articleId: string;
  articleType: string | null | undefined;
  hasSubject: boolean;
  subjectKind?: "player" | "staff" | "custom";
  /**
   * Number of subjects on interview articles (1–4). Emitted as the
   * `subject_count` dimension on `article_view` — lets editorial slice
   * engagement by single-subject vs duo vs panel formats. Emitted as 0
   * when the article has no subjects (non-interview or malformed
   * interview); `useArticleAnalytics` omits the dimension on non-
   * interview article types so GA4 reports don't fragment.
   */
  subjectCount?: number;
}

/**
 * Fires `article_view` once per mount. Rendered as a sibling of the
 * article template inside the server-rendered page so the tracker stays
 * out of the template component graph (templates remain server-renderable
 * and storybook-mockable without analytics side effects).
 *
 * Dedup guard mirrors the `related_content_shown` pattern in
 * `RelatedContentSection` — fast refresh / React.StrictMode double-invoke
 * of effects must not cause a double event.
 */
export const ArticleViewTracker = ({
  articleId,
  articleType,
  hasSubject,
  subjectKind,
  subjectCount,
}: ArticleViewTrackerProps) => {
  const { trackArticleView } = useArticleAnalytics();
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    trackArticleView({
      articleType,
      articleId,
      hasSubject,
      subjectKind,
      subjectCount,
    });
    // Fire-once-per-mount semantics — the ref guard is the dedup. An
    // explicit empty deps array communicates that to readers and satisfies
    // the linter (React Hook has missing deps is expected here).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
