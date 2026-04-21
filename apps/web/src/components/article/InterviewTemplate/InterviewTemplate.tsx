import type { PortableTextBlock } from "@portabletext/react";
import { ArticleHeader } from "../ArticleHeader";
import { ArticleMetadata } from "../ArticleMetadata";
import { SanityArticleBody } from "../SanityArticleBody/SanityArticleBody";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

export interface InterviewTemplateProps {
  title: string;
  coverImageUrl?: string | null;
  publishedDate?: string;
  category?: { name: string; href: string };
  shareConfig: { url: string };
  body: PortableTextBlock[] | null;
  /**
   * Resolved from the article's `subject` field. Forwarded to
   * `SanityArticleBody` so the qaBlock `key` and `quote` pair treatments
   * can render attribution + photo without re-fetching the reference.
   */
  subject?: SubjectValue | null;
}

// Byline for Phase 1 — Phase 3 (#1329) replaces this with the author
// resolved from the article's `subject` field.
const AUTHOR = "KCVV Elewijt";

/**
 * Phase 1 tracer for the interview template. Structurally identical to the
 * legacy renderer (header + metadata + body) — the unique 4:5 portrait hero,
 * subject kicker, and related-slider integration ship in Phase 3 (#1329).
 *
 * Its value at this phase is proving the `articleType` dispatch end-to-end
 * and giving the Phase 3 work a stable landing site.
 */
export const InterviewTemplate = ({
  title,
  coverImageUrl,
  publishedDate,
  category,
  shareConfig,
  body,
  subject = null,
}: InterviewTemplateProps) => {
  return (
    <>
      <ArticleHeader
        title={title}
        imageUrl={coverImageUrl ?? undefined}
        imageAlt={title}
        category={category?.name}
        date={publishedDate}
        author={AUTHOR}
      />

      <ArticleMetadata
        author={AUTHOR}
        date={publishedDate}
        category={category}
        shareConfig={shareConfig}
      />

      <main className="w-full max-w-inner-lg mx-auto px-6 mb-6 lg:mb-10">
        {Array.isArray(body) && body.length > 0 && (
          <SanityArticleBody content={body} subject={subject} />
        )}
      </main>
    </>
  );
};
