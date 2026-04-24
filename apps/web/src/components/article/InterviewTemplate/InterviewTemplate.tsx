import type { PortableTextBlock } from "@portabletext/react";
import { ArticleMetadata } from "../ArticleMetadata";
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

// Byline — Phase 4 (#1330) may wire this to an editor-authored field when
// ghost-written articles are introduced. For interviews the club is the
// implicit author.
const AUTHOR = "KCVV Elewijt";

/**
 * Phase 3 (#1329): full interview template.
 * - `InterviewHero` — subject-driven kicker, subtitle (full name), title
 *   `clamp(2rem,4.5vw,3.5rem)`, 4:5 portrait crop of the cover image.
 * - `ArticleMetadata` — design §7.6 (mono small-caps facts + Share2 +
 *   Facebook share icons).
 * - `SanityArticleBody` — body with subject threaded down so the
 *   `key`/`quote` qaBlock pairs can render attribution + photo.
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
  return (
    <>
      <InterviewHero
        title={title}
        subjects={subjects}
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

      <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
        {Array.isArray(body) && body.length > 0 && (
          <SanityArticleBody content={body} subjects={subjects} />
        )}
      </div>
    </>
  );
};
