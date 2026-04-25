import type { PortableTextBlock } from "@portabletext/react";
import { ArticleMetadata } from "../ArticleMetadata";
import { ArticleBodyMotion } from "../ArticleBodyMotion";
import { InterviewHero } from "../InterviewHero";
import { SanityArticleBody } from "../SanityArticleBody/SanityArticleBody";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";

export interface InterviewTemplateProps {
  title: string;
  coverImageUrl?: string | null;
  publishedDate?: string;
  readingTime?: string;
  shareConfig: { url: string; title?: string };
  body: PortableTextBlock[] | null;
  /**
   * Article subjects from `article.subjects[]` (1–4). Drives the hero
   * layout (single portrait / duo / trio / panel), the kicker meta slot
   * (only on N=1 players), the Dutch-Oxford-joined subtitle, and the
   * `key`/`quote` qaBlock attribution via per-pair `respondentKey`
   * resolution in `SanityArticleBody`.
   */
  subjects?: IndexedSubject[] | null;
  /** Sanity document id — threaded to ArticleMetadata for `article_share` analytics. */
  articleId?: string;
  /** Article type (for analytics param `article_type`). */
  articleType?: string | null;
}

/**
 * Phase 3 (#1329): full interview template.
 * - `InterviewHero` — subject-driven kicker, subtitle (full name), title
 *   `clamp(2rem,4.5vw,3.5rem)`, 4:5 portrait crop of the cover image.
 * - `ArticleMetadata` — design §7.6 (mono small-caps facts + Share2 +
 *   Facebook share icons).
 * - `ArticleBodyMotion` wrapping `SanityArticleBody` inside an
 *   `.article-body` container — same scope the announcement / transfer /
 *   event templates use. Design §7.4 blockquote rework and §7.5 fade-up
 *   motion apply uniformly; §7.3 drop-cap only triggers when the body
 *   leads with a prose `<p>` (interviews that open with a `qaBlock`
 *   skip the drop-cap by selector design — `.article-body > p:first-of-type`
 *   has no match). Q&A pair `<p>` and answer paragraphs gain the
 *   staggered fade-up reveal as they cross the viewport. Wired in #1361
 *   as part of the cross-template polish pass. Subjects are threaded
 *   down so the `key`/`quote` qaBlock pairs can render attribution +
 *   photo.
 */
export const InterviewTemplate = ({
  title,
  coverImageUrl,
  publishedDate,
  readingTime,
  shareConfig,
  body,
  subjects = null,
  articleId,
  articleType,
}: InterviewTemplateProps) => {
  const hasBody = Array.isArray(body) && body.length > 0;

  return (
    <>
      <InterviewHero
        title={title}
        subjects={subjects}
        coverImageUrl={coverImageUrl}
      />

      <ArticleMetadata
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
            <SanityArticleBody
              className="article-body"
              content={body}
              subjects={subjects}
            />
          </ArticleBodyMotion>
        </div>
      )}
    </>
  );
};
