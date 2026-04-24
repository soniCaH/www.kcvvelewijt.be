import type { PortableTextBlock } from "@portabletext/react";
import { ArticleMetadata } from "../ArticleMetadata";
import { ArticleBodyMotion } from "../ArticleBodyMotion";
import { SanityArticleBody } from "../SanityArticleBody/SanityArticleBody";
import { EventHero } from "../EventHero";
import { EventStrip } from "../EventStrip";
import type { EventFactValue } from "@/components/article/blocks/EventFact";

export interface EventTemplateProps {
  title: string;
  /**
   * 16:9 landscape cover image. Same `article.coverImage` projection
   * announcement uses — events always upload landscape for TV +
   * Facebook reuse.
   */
  coverImageUrl?: string | null;
  publishedDate?: string;
  readingTime?: string;
  shareConfig: { url: string; title?: string };
  body: PortableTextBlock[] | null;
  /** Sanity document id — threaded to ArticleMetadata for `article_share` and EventStrip for `event_cta_click`. */
  articleId?: string;
  /** Article type (for analytics param `article_type`). */
  articleType?: string | null;
}

// Event articles are implicitly club-authored — same pattern the other
// templates use. The §7.6 metadata bar is the single source of truth for
// author + date + reading time.
const AUTHOR = "KCVV Elewijt";

const isEventFact = (
  block: PortableTextBlock,
): block is PortableTextBlock & EventFactValue =>
  (block as { _type?: string })._type === "eventFact";

/**
 * Phase 6 (#1332) — event article template.
 *
 * Composition:
 *   1. `EventHero` — typographic kicker (`EVENT | ageGroup`) + article
 *      title. No image, no date block — the hero keeps the body column
 *      width so the narrative title sits in the reading rhythm.
 *   2. `ArticleMetadata` — design §7.6 metadata bar.
 *   3. `EventStrip` — full-bleed horizontal band with the serif-style
 *      date block + title + metadata + note + optional CTA. Absorbs the
 *      first `eventFact` in the body.
 *   4. Body prose via `SanityArticleBody` (class `article-body` so
 *      Phase 4 drop-cap / blockquote / fade-up scope applies). The
 *      feature eventFact is filtered out of the body — the strip owns
 *      it. Subsequent eventFacts render inline as `EventFactOverview`
 *      dark-band rows via the SanityArticleBody dispatch.
 *
 * Mirrors the Phase 5 transfer template shape so editors work in a
 * familiar editorial pattern across the three feature-block article
 * types (transfer, event, later).
 */
export const EventTemplate = ({
  title,
  coverImageUrl,
  publishedDate,
  readingTime,
  shareConfig,
  body,
  articleId,
  articleType,
}: EventTemplateProps) => {
  const hasBody = Array.isArray(body) && body.length > 0;
  const firstEventFact: EventFactValue | undefined = hasBody
    ? body.find(isEventFact)
    : undefined;

  // Feature eventFact is absorbed by the strip — strip it from the body
  // so it doesn't render a second time as an overview row.
  const bodyWithoutFeature =
    hasBody && firstEventFact ? body.filter((b) => b !== firstEventFact) : body;
  const hasRemainingBody =
    Array.isArray(bodyWithoutFeature) && bodyWithoutFeature.length > 0;

  return (
    <>
      <EventHero
        feature={firstEventFact ?? null}
        title={title}
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

      {firstEventFact && (
        <EventStrip feature={firstEventFact} articleId={articleId} />
      )}

      {hasRemainingBody && (
        <div className="max-w-inner-lg mx-auto mb-6 w-full px-6 lg:mb-10">
          <ArticleBodyMotion>
            <SanityArticleBody
              className="article-body"
              content={bodyWithoutFeature}
            />
          </ArticleBodyMotion>
        </div>
      )}
    </>
  );
};
