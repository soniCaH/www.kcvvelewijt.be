import type { PortableTextBlock } from "@portabletext/react";
import { ArticleMetadata } from "../ArticleMetadata";
import { AnnouncementHero } from "../AnnouncementHero";
import { ArticleBodyMotion } from "../ArticleBodyMotion";
import { SanityArticleBody } from "../SanityArticleBody/SanityArticleBody";

export interface AnnouncementTemplateProps {
  title: string;
  /**
   * Primary category (first article tag) rendered in the hero kicker.
   */
  category?: string;
  coverImageUrl?: string | null;
  publishedDate?: string;
  readingTime?: string;
  shareConfig: { url: string; title?: string };
  body: PortableTextBlock[] | null;
  /** Sanity document id — threaded to ArticleMetadata for `article_share` analytics. */
  articleId?: string;
  /** Article type (for analytics param `article_type`). */
  articleType?: string | null;
}

// Announcements are implicitly club-authored until we wire an editor field
// in a follow-up phase (see PRD #1330 open questions). The metadata bar
// defaults to the club banner.
const AUTHOR = "KCVV Elewijt";

/**
 * Phase 4 (#1330) — the default article template.
 *
 * Composition:
 * 1. `AnnouncementHero` — design §5.1 (kicker + title + 16:9 cover). No
 *    byline row: author + reading time live in the §7.6 metadata bar
 *    rendered immediately below, so repeating them on the hero was pure
 *    duplication.
 * 2. `ArticleMetadata` — design §7.6 metadata bar (date · author ·
 *    reading time + share controls).
 * 3. `ArticleBodyMotion` wrapping `SanityArticleBody` inside an
 *    `.article-body` container, so:
 *      - §7.3 drop-cap applies to the first `<p>`
 *      - §7.4 rule-framed blockquote rework overrides the legacy 15rem glyph
 *      - §7.5 fade-up motion attaches to every `<p>`/`<h2>`/`<h3>`
 *    All three rules are scoped to `.article-body` in `globals.css` so the
 *    Sanity Studio `.prose` previews remain untouched.
 *
 * Used as the fallback for any `articleType` that is not `interview`,
 * including legacy documents with no `articleType` set at all.
 */
export const AnnouncementTemplate = ({
  title,
  category,
  coverImageUrl,
  publishedDate,
  readingTime,
  shareConfig,
  body,
  articleId,
  articleType,
}: AnnouncementTemplateProps) => {
  const hasBody = Array.isArray(body) && body.length > 0;

  return (
    <>
      <AnnouncementHero
        title={title}
        category={category}
        date={publishedDate}
        coverImageUrl={coverImageUrl}
      />

      <ArticleMetadata
        author={AUTHOR}
        date={publishedDate}
        readingTime={readingTime}
        shareConfig={shareConfig}
        articleId={articleId}
        articleType={articleType}
        className="mt-10"
      />

      {hasBody && (
        <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
          <ArticleBodyMotion>
            <SanityArticleBody className="article-body" content={body} />
          </ArticleBodyMotion>
        </div>
      )}
    </>
  );
};
