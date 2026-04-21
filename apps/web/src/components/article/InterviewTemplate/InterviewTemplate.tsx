import type { PortableTextBlock } from "@portabletext/react";
import { ArticleMetadata } from "../ArticleMetadata";
import { InterviewHero } from "../InterviewHero";
import { SanityArticleBody } from "../SanityArticleBody/SanityArticleBody";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

export interface InterviewTemplateProps {
  title: string;
  coverImageUrl?: string | null;
  publishedDate?: string;
  readingTime?: string;
  shareConfig: { url: string; title?: string };
  body: PortableTextBlock[] | null;
  /**
   * Resolved from the article's `subject` field. Drives the InterviewHero
   * kicker (jersey + position), subtitle (full name), and the key/quote
   * qaBlock attribution blocks. When absent, the hero collapses to
   * `INTERVIEW` + title only.
   */
  subject?: SubjectValue | null;
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
  subject = null,
}: InterviewTemplateProps) => {
  return (
    <>
      <InterviewHero
        title={title}
        subject={subject}
        coverImageUrl={coverImageUrl}
      />

      <ArticleMetadata
        author={AUTHOR}
        date={publishedDate}
        readingTime={readingTime}
        shareConfig={shareConfig}
        className="mt-10"
      />

      <main className="w-full max-w-inner-lg mx-auto px-6 mb-6 lg:mb-10">
        {Array.isArray(body) && body.length > 0 && (
          <SanityArticleBody content={body} subject={subject} />
        )}
      </main>
    </>
  );
};
