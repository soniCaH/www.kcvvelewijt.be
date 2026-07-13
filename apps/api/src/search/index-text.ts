/**
 * GROQ projection for an article's related-card cover image. Baked to a
 * hotspot-aware 16:9 crop (mirrors RELATED_ARTICLES_QUERY in the web app,
 * #2291) so the related-endpoint NewsCards respect the editorial hotspot
 * instead of a centre object-cover that chops heads. Resolves to null when the
 * article has no cover (`null + "…"` is null in GROQ). Shared by the full
 * reindex (sanity-index-sync) and the per-doc webhook so they can't drift.
 *
 * ponytail: 16:9 baked in because handleRelated → NewsCard is the only
 * consumer of this metadata; store separate hotspot fields if a second aspect
 * ratio ever needs it.
 */
export const ARTICLE_COVER_IMAGE_PROJECTION = `"imageUrl": coverImage.asset->url + "?w=800&h=450&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=" + string(coalesce(coverImage.hotspot.x, 0.5)) + "&fp-y=" + string(coalesce(coverImage.hotspot.y, 0.5))`;

export function buildResponsibilityIndexText(doc: {
  title: string;
  question: string;
  keywords: readonly string[];
  summary: string;
}): string {
  return [doc.title, doc.question, doc.keywords.join(" "), doc.summary]
    .filter(Boolean)
    .join(". ");
}

export function buildArticleIndexText(doc: {
  title: string;
  tags: readonly string[];
  bodyText: string | null;
}): string {
  return [doc.title, doc.tags.join(" "), doc.bodyText ?? ""]
    .filter(Boolean)
    .join(". ");
}

export function buildPageIndexText(doc: {
  title: string;
  bodyText: string | null;
}): string {
  return [doc.title, doc.bodyText ?? ""].filter(Boolean).join(". ");
}
