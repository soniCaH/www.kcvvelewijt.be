"use client";

import { useRef, type ReactNode } from "react";
import { useArticleAnalytics } from "@/hooks/useArticleAnalytics";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";

export interface ArticleCtaAnalyticsProps {
  articleId: string;
  articleType: string | null | undefined;
  children: ReactNode;
}

/**
 * Client analytics shell around `<ArticleCtaBand>` (#2525). Delegates a
 * click on the band's `data-article-cta` button to `article_cta_click`, so
 * the band itself stays server-rendered — mirrors `<SponsorsAnalytics>`'s
 * `data-sponsor-cta` → `sponsor_cta_click` wiring on `/sponsors`. Scoped to
 * just the band, not the whole page: this is the only `data-article-cta`
 * marker on an article, so a page-wide listener would buy nothing.
 *
 * `<ArticleCtaBand>` only mounts this wrapper when it has something to
 * render — an article without the field (or with an incomplete one) gets no
 * band and no click listener, rather than an empty delegator sitting idle
 * on every article page.
 */
export function ArticleCtaAnalytics({
  articleId,
  articleType,
  children,
}: ArticleCtaAnalyticsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { trackArticleCtaClick } = useArticleAnalytics();

  useDelegatedClick(ref, {
    selector: "[data-article-cta]",
    onMatch: () => {
      trackArticleCtaClick({ articleId, articleType });
    },
  });

  return <div ref={ref}>{children}</div>;
}
