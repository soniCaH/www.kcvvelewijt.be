import type { PortableTextBlock } from "@portabletext/react";
import { ArticleMetadata } from "../ArticleMetadata";
import { ArticleBodyMotion } from "../ArticleBodyMotion";
import { SanityArticleBody } from "../SanityArticleBody/SanityArticleBody";
import { TransferHero } from "../TransferHero";
import { TransferStrip } from "../TransferStrip";
import type { TransferFactValue } from "@/components/article/blocks/TransferFact";

export interface TransferTemplateProps {
  /**
   * Article title. Used as the h1 fallback when the body has no
   * `transferFact` block (legacy/misconfigured documents).
   */
  title: string;
  /**
   * Hotspot-aware 4:5 portrait crop of `article.coverImage`. Same
   * projection the interview template uses. The editor bakes the
   * pattern/texture into the image.
   */
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

// Transfer articles are implicitly club-authored — same pattern the
// announcement + interview templates use.
const AUTHOR = "KCVV Elewijt";

const isTransferFact = (
  block: PortableTextBlock,
): block is PortableTextBlock & TransferFactValue =>
  (block as { _type?: string })._type === "transferFact";

/**
 * Phase 5 (#1331) — transfer article template.
 *
 * Composition:
 *   1. `TransferHero` — kicker + h1 + age/position meta + optional
 *      pull-quote on the left; 4:5 cover portrait on the right. The
 *      first `transferFact` block in the body supplies the hero data.
 *   2. `ArticleMetadata` — design §7.6 metadata bar.
 *   3. `TransferStrip` — horizontal van → direction → naar composition
 *      beneath the metadata bar. Extensions render centered with no
 *      arrow.
 *   4. Body prose via `SanityArticleBody` (with `className="article-body"`
 *      so the Phase 4 drop-cap / blockquote / fade-up scope applies).
 *      The feature transferFact is filtered out of the body — the hero
 *      and strip already own it. Subsequent transferFacts render inline
 *      as `TransferFactOverview` rows (typically beneath an editor-
 *      authored `Ander transfernieuws` H2).
 */
export const TransferTemplate = ({
  title,
  coverImageUrl,
  publishedDate,
  readingTime,
  shareConfig,
  body,
  articleId,
  articleType,
}: TransferTemplateProps) => {
  const hasBody = Array.isArray(body) && body.length > 0;
  const firstTransferFact: TransferFactValue | undefined = hasBody
    ? body.find(isTransferFact)
    : undefined;

  // Feature transferFact is absorbed by the hero + strip — strip it from
  // the body so it doesn't render a second time as an overview card.
  const bodyWithoutFeature =
    hasBody && firstTransferFact
      ? body.filter((b) => b !== firstTransferFact)
      : body;
  const hasRemainingBody =
    Array.isArray(bodyWithoutFeature) && bodyWithoutFeature.length > 0;

  return (
    <>
      <TransferHero
        feature={firstTransferFact ?? null}
        coverImageUrl={coverImageUrl}
        fallbackTitle={title}
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

      {firstTransferFact && <TransferStrip feature={firstTransferFact} />}

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
