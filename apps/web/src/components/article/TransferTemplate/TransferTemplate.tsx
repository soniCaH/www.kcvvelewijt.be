import type { PortableTextBlock } from "@portabletext/react";
import { ArticleMetadata } from "../ArticleMetadata";
import { ArticleBodyMotion } from "../ArticleBodyMotion";
import { SanityArticleBody } from "../SanityArticleBody/SanityArticleBody";
import { TransferHero } from "../TransferHero";
import type { TransferFactValue } from "@/components/article/blocks/TransferFact";

export interface TransferTemplateProps {
  /**
   * Article title. Used as the h1 fallback when the body has no
   * `transferFact` block (legacy/misconfigured documents).
   */
  title: string;
  publishedDate?: string;
  readingTime?: string;
  shareConfig: { url: string; title?: string };
  body: PortableTextBlock[] | null;
}

// Transfer articles are implicitly club-authored — the same pattern the
// announcement + interview templates use. A future phase can wire an
// editor byline field when ghost-written features arrive.
const AUTHOR = "KCVV Elewijt";

/**
 * Phase 5 (#1331) — transfer article template.
 *
 * Composition:
 * 1. `TransferHero` — typographic hero. No image. Reads the **first**
 *    `transferFact` block in the body to build the kicker (`TRANSFER |
 *    INCOMING/OUTGOING/EXTENSION`), the player-name h1, an age/position
 *    subline, and the from/to composition at display scale.
 * 2. `ArticleMetadata` — design §7.6 metadata bar (date · author ·
 *    reading time + share). Single source of truth for those facts —
 *    the hero intentionally doesn't repeat them (see `AnnouncementHero`
 *    doc comment for the cross-template rule).
 * 3. Body renders through `SanityArticleBody` with `className=
 *    "article-body"` so drop-cap / blockquote / fade-up scoping from
 *    Phase 4 applies. `featureTransferKey` is the _key of the first
 *    `transferFact` block — the SanityArticleBody dispatch renders it
 *    as a full-bleed `TransferFactFeature`; every other `transferFact`
 *    renders as `TransferFactOverview`.
 */
export const TransferTemplate = ({
  title,
  publishedDate,
  readingTime,
  shareConfig,
  body,
}: TransferTemplateProps) => {
  const hasBody = Array.isArray(body) && body.length > 0;
  const firstTransferFact = hasBody
    ? (body.find((b) => (b as { _type?: string })._type === "transferFact") as
        | TransferFactValue
        | undefined)
    : undefined;

  return (
    <>
      <TransferHero feature={firstTransferFact ?? null} fallbackTitle={title} />

      <ArticleMetadata
        author={AUTHOR}
        date={publishedDate}
        readingTime={readingTime}
        shareConfig={shareConfig}
        className="mt-10"
      />

      {hasBody && (
        <main className="w-full max-w-inner-lg mx-auto px-6 mb-6 lg:mb-10">
          <ArticleBodyMotion>
            <SanityArticleBody
              className="article-body"
              content={body}
              featureTransferKey={firstTransferFact?._key}
            />
          </ArticleBodyMotion>
        </main>
      )}
    </>
  );
};
