import { PortableText } from "@portabletext/react";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { FacebookLogo, InstagramLogo, X } from "@/lib/icons.redesign";
import type { ReactNode } from "react";
import { DropCapParagraph } from "@/components/design-system/DropCapParagraph";
import { EndMark } from "@/components/design-system/EndMark";
import { ExternalMark } from "@/components/design-system/ExternalMark";
import { PullQuote } from "@/components/design-system/PullQuote";
import { QASectionDivider } from "@/components/design-system/QASectionDivider";
import { SubjectAvatar } from "@/components/design-system/SubjectAvatar";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import { DownloadButton } from "@/components/design-system/DownloadButton";
import {
  resolvePairRespondent,
  resolveSubject,
  deriveSubjectFirstName,
  type IndexedSubject,
} from "@/components/article/SubjectAttribution";
import { TransferFactCard } from "@/components/article/blocks/TransferFactCard";
import type { TransferFactValue } from "@/components/article/blocks/TransferFact/types";
import {
  QaBlock,
  type QaBlockValue,
} from "@/components/article/blocks/QaBlock";
import {
  EventFactInline,
  type EventFactInlineProps,
} from "@/components/article/blocks/EventFactInline";
import { deriveIsPast } from "@/components/article/blocks/EventDetailBlock";
import type { EventFactValue } from "@/components/article/blocks/EventFact";
import {
  VideoBlock,
  type VideoBlockValue,
} from "@/components/article/VideoBlock";
import { HtmlTableBlock } from "@/components/article/blocks/HtmlTableBlock";
import {
  resolveInternalLinkHref,
  type InternalLinkReference,
} from "@/lib/utils/resolve-internal-link-href";
import { renderTextWithEmphasis } from "@/lib/portable-text/renderTextWithEmphasis";
import type { PortableTextBlockLike } from "@/lib/portable-text/findPullquoteText";
import {
  segmentArticleBody,
  type ArticleBodySegment,
} from "@/lib/portable-text/segmentArticleBody";
import { cn } from "@/lib/utils/cn";

/**
 * <ArticleBody> — shared article-body container for every articleType.
 *
 * Renders the Sanity Portable Text body at `--container-prose` width on a
 * cream surface and emits Phase 1 + Phase 5 primitives in PT-block order:
 *
 *   - First normal paragraph wraps in <DropCapParagraph tone="ink">.
 *   - `accent` mark renders italic + jersey-deep (5.A.1).
 *   - `h2` block delegates to <QASectionDivider> for the section-break
 *     treatment (5.d3 lock).
 *   - `blockquote` style block renders <PullQuote> as the full taped card
 *     — the only quote object on the site (#2566, decision #2515).
 *   - `pullQuote` block renders <PullQuote> with a <SubjectAvatar
 *     scale="attribution"> in the attribution slot (5.A.2 + 5.d2 lock).
 *   - `transferFact` runs renders as a 1-up / 2-up grid via the
 *     adjacency segmenter (5.d-tra lock).
 *   - `qaBlock` routes to `<QaBlock>` (5.d-int / 5.d-int-rapidfire locks).
 *     `groupAtTail` qaBlocks are expected to be hoisted out of `content`
 *     by the page composition (`qaBlocksToTailSection`) before reaching
 *     this renderer; the in-flow serializer treats every qaBlock it
 *     sees as in-flow content.
 *   - `eventFact` (body-flow) routes to `<EventFactInline>`. The hero
 *     absorption rule from #1798 (first eventFact in event articles →
 *     `<EventDetailBlock>`) is a page-level concern; ArticleBody simply
 *     renders whatever body it receives.
 *   - `articleImage` routes through `<TapedFigure>` with caption + credit
 *     pulled from `asset.description` + `asset.creditLine` (5.d-img lock).
 *   - `videoBlock` routes to `<VideoBlock>` (5.d-vid lock).
 *   - `fileAttachment` routes to `<DownloadButton>`
 *     (fileattachment-htmltable-locked §5.1).
 *   - `htmlTable` routes to `<HtmlTableBlock>` (§5.2).
 *   - `link` / `internalLink` marks ship cream-surface Phase 5 styling.
 *   - `<EndMark>` closes the body when any content was rendered.
 */
export interface ArticleBodyProps {
  content: PortableTextBlock[];
  /**
   * Article-level subjects passed through to the `pullQuote` + `qaBlock`
   * serializers so a `respondentKey` can resolve back to a `SubjectValue`
   * and render the `<SubjectAvatar>` + display name. On non-interview
   * articles (transfer / event / announcement) this is typically `null`
   * and every pull-quote falls back to the external-attribution path.
   */
  subjects?: IndexedSubject[] | null;
  /**
   * Article slug — threaded into `videoBlock` so the Phase 4 (#1366)
   * `article_video_play` / `article_video_complete` analytics events can
   * carry `article_slug`. Omit on non-article surfaces (staff bio, club
   * page); video analytics is suppressed in that case.
   */
  articleSlug?: string;
  /**
   * articleType drives the `<EndMark>` closer copy:
   *   - `"interview"`     → `EINDE GESPREK` (preserves the interview lock)
   *   - everything else   → `EINDE ARTIKEL` (generic neutral closer)
   *
   * Omit on non-article surfaces (staff bio, club page) — the body still
   * renders, just with the neutral default label.
   */
  articleType?: string | null;
  className?: string;
}

function endMarkLabelFor(articleType: string | null | undefined): string {
  return articleType === "interview" ? "EINDE GESPREK" : "EINDE ARTIKEL";
}

interface PullQuoteBlock {
  _type: "pullQuote";
  _key?: string;
  body?: string;
  respondentKey?: string;
  emphasis?: string;
  externalName?: string;
  externalRole?: string;
  externalSource?: string;
}

interface ArticleImageAsset {
  url?: string;
  title?: string;
  description?: string;
  creditLine?: string;
  metadata?: {
    dimensions?: {
      width?: number;
      height?: number;
      aspectRatio?: number;
    } | null;
    lqip?: string | null;
  } | null;
}

interface ArticleImageValue {
  _type?: "articleImage";
  _key?: string;
  alt?: string;
  width?: "prose" | "wide" | "bleed" | null;
  /** Flattened from GROQ `image.asset->{...}` projection. */
  asset?: ArticleImageAsset | null;
}

interface FileAttachmentValue {
  _type: "fileAttachment";
  label?: string;
  fileUrl?: string;
  fileSize?: number;
  fileMimeType?: string;
  fileOriginalFilename?: string;
}

interface HtmlTableValue {
  _type: "htmlTable";
  html?: string;
}

interface InternalLinkValue {
  reference?: InternalLinkReference;
}

function isNormalParagraph(block: PortableTextBlock): boolean {
  if (block._type !== "block") return false;
  const b = block as PortableTextBlockLike;
  // A list item carries style "normal" too — but it must render as a bullet,
  // not get lifted into the drop-cap lead paragraph.
  if (b.listItem !== undefined) return false;
  const style = b.style;
  return style === undefined || style === "normal";
}

function extractBlockText(block: PortableTextBlock): string {
  const children = (block as PortableTextBlockLike).children;
  if (!Array.isArray(children)) return "";
  return children
    .map((span) => span.text ?? "")
    .join("")
    .trim();
}

/**
 * Does the block actually render something? Used to decide whether
 * `<EndMark />` should appear at the bottom of the body — an article
 * whose `content` is non-empty but contains only empty paragraphs or an
 * empty `pullQuote` block shouldn't get an orphan closer below blank
 * space.
 */
function blockHasRenderableOutput(block: PortableTextBlock): boolean {
  if (block._type === "block") {
    return extractBlockText(block).length > 0;
  }
  if (block._type === "pullQuote") {
    return ((block as PullQuoteBlock).body ?? "").trim().length > 0;
  }
  if (block._type === "transferFact") {
    return ((block as TransferFactValue).playerName ?? "").trim().length > 0;
  }
  if (block._type === "articleImage") {
    return Boolean((block as ArticleImageValue).asset?.url);
  }
  if (block._type === "fileAttachment") {
    return Boolean((block as FileAttachmentValue).fileUrl);
  }
  if (block._type === "htmlTable") {
    return ((block as HtmlTableValue).html ?? "").trim().length > 0;
  }
  // qaBlock / eventFact / videoBlock / unknown types are assumed to
  // render — they own their own empty-state checks.
  return true;
}

/**
 * Known social hosts → the brand icon that turns a plain body link into a
 * recognisable affordance (CMS-2). Returns null for everything else, so
 * ordinary external links keep the canonical `.prose-link` highlighter marker.
 */
function socialBrandFor(
  href: string,
): { Icon: typeof FacebookLogo; label: string } | null {
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return null; // relative / malformed href → not a social affordance
  }
  // Match a registrable domain OR any of its subdomains (www., m., web.,
  // business., l. …) — the `.` prefix on the suffix check rejects look-alikes
  // like notfacebook.com.
  const isHost = (domains: string[]) =>
    domains.some((d) => host === d || host.endsWith(`.${d}`));
  if (isHost(["facebook.com", "fb.com", "fb.me", "fb.watch"]))
    return { Icon: FacebookLogo, label: "Facebook" };
  if (isHost(["instagram.com", "instagr.am"]))
    return { Icon: InstagramLogo, label: "Instagram" };
  // X (formerly Twitter) — Phosphor has no brand glyph in this version, so the
  // plain `X` mark stands in (the brand is literally an X). `t.co` is excluded:
  // it's Twitter's shortener for ALL outbound links, so it can point anywhere.
  if (isHost(["x.com", "twitter.com"])) return { Icon: X, label: "X" };
  return null;
}

function TransferFactGroup({ facts }: { facts: TransferFactValue[] }) {
  if (facts.length === 0) return null;
  if (facts.length === 1) {
    return (
      <div data-transfer-fact-group="single" className="my-8 w-full">
        <TransferFactCard fact={facts[0]!} />
      </div>
    );
  }
  const isOddCount = facts.length % 2 === 1;
  return (
    <div
      data-transfer-fact-group="grid"
      data-transfer-fact-count={facts.length}
      className="my-8 grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      {facts.map((fact, i) => {
        const isLast = i === facts.length - 1;
        const fullWidth = isOddCount && isLast;
        return (
          <TransferFactCard
            key={fact._key ?? `${i}-${fact.playerName ?? "fact"}`}
            fact={fact}
            className={cn(fullWidth ? "md:col-span-2" : "")}
          />
        );
      })}
    </div>
  );
}

// The one shared spacer wrapper for a card that stands alone in the body
// flow — a `pullQuote` block's card and a blockquote-group's card are the
// same object rendered from two different authoring paths (#2515 rule 2),
// so they share one wrapper. Keeps the pre-existing `data-pullquote-spacer`
// attribute name.
function QuoteSpacer({ children }: { children: ReactNode }) {
  return (
    <div data-pullquote-spacer="true" className="my-10">
      {children}
    </div>
  );
}

// One source `blockquote`-style block becomes one `<p>` inside a merged
// blockquote-group card. Hoisted to module scope (not a closure allocated
// fresh per group per render) so `@portabletext/react` sees the same
// component reference across renders.
function BlockquoteGroupParagraph({ children }: { children?: ReactNode }) {
  return <p className="mb-3 last:mb-0">{children}</p>;
}

/**
 * Components for rendering the merged children of a blockquote group —
 * identical to the outer `components` (so accent/link marks inside a quote
 * still resolve) except `block.blockquote` itself renders
 * `<BlockquoteGroupParagraph>` instead of recursing into another
 * `<PullQuote>`. Built from `ARTICLE_BLOCK_STYLE_HANDLERS` (a concretely
 * typed record) rather than spreading `base.block` — `PortableTextComponents["block"]`
 * is a union of that record shape and a single catch-all component
 * function, and spreading the union directly would either fail to compile
 * or (behind a cast) silently accept the single-component member and drop
 * every other style handler inside a quote.
 */
function buildBlockquoteGroupComponents(
  base: PortableTextComponents,
): PortableTextComponents {
  return {
    ...base,
    block: {
      ...ARTICLE_BLOCK_STYLE_HANDLERS,
      blockquote: BlockquoteGroupParagraph,
    },
  };
}

function BlockquoteGroup({
  blocks,
  components,
}: {
  blocks: PortableTextBlock[];
  components: PortableTextComponents;
}) {
  return (
    <QuoteSpacer>
      {/* Editor blockquotes carry no structured attribution — the null
          path. `attribution={undefined}` is required by PullQuoteProps'
          attribution-XOR-labels union. */}
      <PullQuote attribution={undefined}>
        <PortableText value={blocks} components={components} />
      </PullQuote>
    </QuoteSpacer>
  );
}

function renderSegments(
  segments: ArticleBodySegment[],
  components: PortableTextComponents,
  blockquoteGroupComponents: PortableTextComponents,
): ReactNode {
  return segments.map((seg) => {
    if (seg.kind === "pt") {
      return (
        <PortableText
          key={seg.key}
          value={seg.blocks}
          components={components}
        />
      );
    }
    if (seg.kind === "transfer-facts") {
      return <TransferFactGroup key={seg.key} facts={seg.facts} />;
    }
    return (
      <BlockquoteGroup
        key={seg.key}
        blocks={seg.blocks}
        components={blockquoteGroupComponents}
      />
    );
  });
}

function renderPullQuote(
  value: PullQuoteBlock,
  subjects: IndexedSubject[] | null,
): ReactNode {
  const body = value.body?.trim();
  if (!body) return null;

  const respondent = resolvePairRespondent(value.respondentKey, subjects);
  const resolved = resolveSubject(respondent);
  // `emphasis` moved off <PullQuote> (design-system stays presentational —
  // inline emphasis is a Portable Text concern) — ArticleBody, which
  // already knows the phrase and already builds node trees, resolves it
  // to a ReactNode here and hands it over as `children` directly.
  const quoteBody = renderTextWithEmphasis(body, value.emphasis?.trim());

  let inner: ReactNode;

  if (resolved && respondent) {
    inner = (
      <PullQuote
        attribution={{
          name: resolved.name,
          role: resolved.role || undefined,
        }}
        avatarSlot={
          <SubjectAvatar
            firstName={deriveSubjectFirstName(respondent, resolved.name)}
            photoUrl={resolved.photoUrl}
            scale="attribution"
          />
        }
      >
        {quoteBody}
      </PullQuote>
    );
  } else {
    const externalName = value.externalName?.trim();
    inner = externalName ? (
      <PullQuote
        attribution={{
          name: externalName,
          role: value.externalRole?.trim() || undefined,
          source: value.externalSource?.trim() || undefined,
        }}
      >
        {quoteBody}
      </PullQuote>
    ) : (
      // No resolvable speaker and no external name — a nameless quote.
      // `attribution` is omitted entirely; <PullQuote> skips the row
      // rather than rendering an empty one (#2515 rule 1).
      <PullQuote attribution={undefined}>{quoteBody}</PullQuote>
    );
  }

  return <QuoteSpacer>{inner}</QuoteSpacer>;
}

/**
 * Map the `articleImage.width` enum to (a) the wrapper width class /
 * style and (b) the `<Image>` `sizes` attribute. `bleed` breaks out
 * of the `--container-prose` parent via negative-margin pinning to the
 * viewport edges, suppresses the tape strip, and lets the figcaption
 * stay at prose width below.
 *
 * Locked in `docs/design/mockups/phase-5-article-detail/articleimage-locked.md` §R3.
 */
type ArticleImageWidth = "prose" | "wide" | "bleed";

function resolveArticleImageWidth(
  width: ArticleImageValue["width"] | undefined,
): ArticleImageWidth {
  if (width === "wide" || width === "bleed") return width;
  return "prose";
}

function renderArticleImage(value: ArticleImageValue): ReactNode {
  const url = value.asset?.url?.trim();
  if (!url) return null;
  const width = resolveArticleImageWidth(value.width);
  const dims = value.asset?.metadata?.dimensions;
  const dimsWidth = typeof dims?.width === "number" ? dims.width : 1600;
  const dimsHeight = typeof dims?.height === "number" ? dims.height : 900;
  const caption = value.asset?.description?.trim() || undefined;
  const credit = value.asset?.creditLine?.trim() || undefined;
  const alt = value.alt?.trim() || value.asset?.title?.trim() || "";

  const sizes =
    width === "bleed"
      ? "100vw"
      : width === "wide"
        ? "(max-width: 640px) 100vw, 1040px"
        : "(max-width: 640px) 100vw, 680px";

  const showTape = width !== "bleed";

  // Wrapper carries the width treatment. `prose` is the default
  // (no override — already inside the body's prose container). `wide`
  // breaks out via negative margins on `md:` and above; on `<640px`
  // it collapses to prose. `bleed` pins to viewport edges via
  // `mx-[calc(50%-50vw)] max-w-[100vw]` (the canonical Phase 5
  // full-bleed escape).
  const wrapperClass =
    width === "wide"
      ? "my-8 mx-auto w-full md:w-auto md:max-w-[var(--container-wide,1040px)] md:mx-[calc(50%-min(50vw,calc(var(--container-wide,1040px)/2)))]"
      : width === "bleed"
        ? "my-8 mx-[calc(50%-50vw)] w-screen max-w-[100vw]"
        : "my-8 mx-auto w-full";

  return (
    <div
      data-article-image="true"
      data-article-image-width={width}
      className={wrapperClass}
    >
      <TapedFigure
        aspect="auto"
        bg="cream"
        tint="newsprint"
        caption={caption}
        credit={credit}
        // articleimage-locked.md §R1 ships a single warm/ochre tape
        // strip on the top edge with a slight rotation. The TapeStrip
        // primitive (post-#1855) anchors `left`/`right` via shared
        // `--tape-left` / `--tape-right` custom properties — center
        // isn't directly supported, so we use the canonical `left`
        // anchor (matches the design-system default for figure-scale
        // tape) and the `a` rotation token (~−2°).
        tape={
          showTape
            ? {
                color: "warm",
                length: "sm",
                position: "left",
                rotation: "a",
              }
            : undefined
        }
      >
        <Image
          src={url}
          alt={alt}
          width={dimsWidth}
          height={dimsHeight}
          className="h-auto w-full"
          sizes={sizes}
          style={{ maxHeight: "70vh", objectFit: "contain" }}
          placeholder={value.asset?.metadata?.lqip ? "blur" : undefined}
          blurDataURL={value.asset?.metadata?.lqip ?? undefined}
        />
      </TapedFigure>
    </div>
  );
}

/**
 * Builds the 1-indexed position map for every `videoBlock` in the body.
 * Used by the `videoBlock` serializer to drive the `article_video_play`
 * `video_position` analytics field. Pure: a fresh map per render is
 * cheap (one pass, no allocations beyond the Map itself).
 */
function buildVideoBlockPositions(
  content: PortableTextBlock[],
): Map<string, number> {
  const map = new Map<string, number>();
  let i = 0;
  for (const block of content) {
    if (
      block._type === "videoBlock" &&
      typeof block._key === "string" &&
      block._key.length > 0
    ) {
      map.set(block._key, ++i);
    }
  }
  return map;
}

interface ComponentsBuildArgs {
  subjects: IndexedSubject[] | null;
  articleSlug?: string;
  videoBlockPositions: Map<string, number>;
}

// h2–h6 are static — none of them close over `subjects` / `articleSlug` /
// `videoBlockPositions` — so they're hoisted out of `buildComponents` to a
// module-level constant rather than reallocated every render. Concretely
// typed (not the wide `PortableTextComponents["block"]` union) so
// `buildBlockquoteGroupComponents` can spread it directly with no cast.
//
// `blockquote` is deliberately absent: `segmentArticleBody` diverts every
// blockquote-style block (single or consecutive) into a `blockquote-group`
// segment before any block ever reaches this map (see `BlockquoteGroup`),
// so a `blockquote` entry here would be permanently unreachable dead code.
// The serializer-completeness guard (#2278) models this the same way it
// already models `transferFact` — a `SEGMENTER_HANDLED` style, not a decoy
// handler — see `ArticleBody.serializer-completeness.test.tsx`.
const ARTICLE_BLOCK_STYLE_HANDLERS = {
  h2: ({ value }: { value?: PortableTextBlock }) => {
    if (!value) return null;
    return <QASectionDivider title={[value]} />;
  },
  // h3–h6 are plain in-body subheadings. Preflight zeroes heading size,
  // weight and margins, so each level restates its own scale — without
  // this they'd render as flat body text (same failure mode as lists).
  // h1 is not selectable in the schema: the article title is the only <h1>.
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="font-display text-ink mt-10 mb-3 text-2xl font-black">
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: ReactNode }) => (
    <h4 className="font-display text-ink mt-8 mb-2 text-xl font-black">
      {children}
    </h4>
  ),
  h5: ({ children }: { children?: ReactNode }) => (
    <h5 className="font-display text-ink mt-6 mb-2 text-lg font-bold">
      {children}
    </h5>
  ),
  h6: ({ children }: { children?: ReactNode }) => (
    <h6 className="text-ink mt-6 mb-2 font-mono text-sm font-semibold tracking-[0.14em] uppercase">
      {children}
    </h6>
  ),
};

/**
 * Builds the Portable Text serializer map for the body. Exported so the
 * serializer-completeness guard (#2278) can assert every `article.body` /
 * `page.body` `of:[]` type + mark declared in `@kcvv/sanity-schemas` has a
 * handler here — a missing entry (the shipped `qaSectionDivider` bug) renders
 * nothing, which no type-check catches.
 */
export function buildComponents({
  subjects,
  articleSlug,
  videoBlockPositions,
}: ComponentsBuildArgs): PortableTextComponents {
  return {
    block: ARTICLE_BLOCK_STYLE_HANDLERS,
    // Tailwind v4 Preflight strips list-style + padding from ul/ol; the body is
    // not wrapped in `prose`, so lists need explicit markers/indent here or they
    // render as flat text.
    list: {
      bullet: ({ children }) => (
        <ul className="my-4 list-disc space-y-1 pl-6">{children}</ul>
      ),
      number: ({ children }) => (
        <ol className="my-4 list-decimal space-y-1 pl-6">{children}</ol>
      ),
    },
    listItem: ({ children }) => <li className="pl-1">{children}</li>,
    types: {
      pullQuote: ({ value }: { value: PullQuoteBlock }) =>
        renderPullQuote(value, subjects),
      qaBlock: ({ value }: { value: QaBlockValue }) => (
        <QaBlock value={value} subjects={subjects} />
      ),
      // qaSectionDivider is an object block inserted via the body + menu
      // (distinct from an `h2` style, which the block serializer above also
      // routes to QASectionDivider). Without this entry the block renders
      // nothing.
      qaSectionDivider: ({
        value,
      }: {
        value: { title?: PortableTextBlock[]; kicker?: string };
      }) => <QASectionDivider title={value.title} kicker={value.kicker} />,
      eventFact: ({ value }: { value: EventFactValue }) => {
        // `linkedEventSlug` is a body-block authoring concern that lives
        // on `<EventDetailBlock>` (hero composition) — body-flow inline
        // cards never link to a separate event. If editorial need ever
        // surfaces, surface a per-block field and project through here.
        const props: EventFactInlineProps = {
          value,
          isPast: deriveIsPast(value),
        };
        return <EventFactInline {...props} />;
      },
      articleImage: ({ value }: { value: ArticleImageValue }) =>
        renderArticleImage(value),
      videoBlock: ({
        value,
      }: {
        value: VideoBlockValue & { _key?: string };
      }) => (
        <VideoBlock
          value={value}
          articleSlug={articleSlug}
          videoPosition={
            typeof value._key === "string"
              ? videoBlockPositions.get(value._key)
              : undefined
          }
        />
      ),
      fileAttachment: ({ value }: { value: FileAttachmentValue }) => {
        if (!value.fileUrl) return null;
        return (
          <div className="my-8">
            <DownloadButton
              href={value.fileUrl}
              label={value.label}
              mimeType={value.fileMimeType}
              fileSize={value.fileSize}
              fileName={value.fileOriginalFilename}
            />
          </div>
        );
      },
      htmlTable: ({ value }: { value: HtmlTableValue }) => {
        if (!value.html) return null;
        return <HtmlTableBlock html={value.html} />;
      },
    },
    marks: {
      // accent — italic + jersey-deep inline emphasis (5.A.1).
      accent: ({ children }: { children?: ReactNode }) => (
        <em className="text-jersey-deep font-black italic">{children}</em>
      ),
      link: ({
        children,
        value,
      }: {
        children: ReactNode;
        value?: { href?: string };
      }) => {
        const href = value?.href ?? "#";
        const isExternal = href.startsWith("http");
        const social = isExternal ? socialBrandFor(href) : null;
        if (social) {
          const { Icon } = social;
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              data-article-link="social"
              // Social links read as a bordered icon affordance (CMS-2), reusing
              // the footer's square brand-button idiom on the cream body surface.
              className="border-jersey-deep/40 text-jersey-deep hover:border-jersey-deep hover:bg-jersey-deep/5 my-1 inline-flex items-center gap-1.5 border px-2 py-0.5 align-baseline font-medium no-underline transition-colors"
            >
              <Icon
                aria-hidden="true"
                className="inline-block size-[1em] shrink-0"
              />
              {children}
              {/* No <ExternalMark> and no sr-only announcement here — rule
                  1 exempts a social link (the brand icon already names the
                  destination), and #2547's "Consequence for rule 4"
                  explicitly says the sentence goes where the box goes: no
                  box, no sentence, in any language. This is the one line
                  the chosen rule removes an existing assistive cue from,
                  rather than translating it. */}
            </a>
          );
        }
        return (
          <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            data-article-link={isExternal ? "external" : "internal"}
            // Canonical inline body-text link — animated highlighter marker
            // (`.prose-link` in globals.css), shared with every body surface.
            className="prose-link"
          >
            {children}
            {isExternal ? <ExternalMark /> : null}
          </a>
        );
      },
      internalLink: ({
        children,
        value,
      }: {
        children: ReactNode;
        value?: InternalLinkValue;
      }) => {
        // A team PSD retired has no page any more (#3000): keep the words,
        // drop the link. Archived players keep theirs — /spelers still
        // serves them.
        const ref = value?.reference;
        if (ref?._type === "team" && ref.archived === true) return children;
        const href = resolveInternalLinkHref(ref);
        return (
          <Link href={href} data-article-link="internal" className="prose-link">
            {children}
          </Link>
        );
      },
    },
  };
}

export function ArticleBody({
  content,
  subjects = null,
  articleSlug,
  articleType,
  className,
}: ArticleBodyProps) {
  const dropCapIdx = content.findIndex(isNormalParagraph);
  const hasDropCap = dropCapIdx >= 0;
  const dropCapBlock = hasDropCap ? content[dropCapIdx] : null;
  const dropCapText = dropCapBlock ? extractBlockText(dropCapBlock) : "";
  const beforeDropCap = hasDropCap ? content.slice(0, dropCapIdx) : content;
  const afterDropCap = hasDropCap ? content.slice(dropCapIdx + 1) : [];

  const videoBlockPositions = buildVideoBlockPositions(content);
  const components = buildComponents({
    subjects,
    articleSlug,
    videoBlockPositions,
  });
  // Derived once per render here (not once per blockquote-group per
  // render, inside BlockquoteGroup) — it depends only on `components`,
  // which is itself already built once per render.
  const blockquoteGroupComponents = buildBlockquoteGroupComponents(components);
  const hasRenderableBody = content.some(blockHasRenderableOutput);

  return (
    <div
      data-article-body="true"
      className={cn("bg-cream w-full px-4 py-12 sm:py-16 lg:px-0", className)}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-prose)" }}
      >
        {beforeDropCap.length > 0
          ? renderSegments(
              segmentArticleBody(beforeDropCap),
              components,
              blockquoteGroupComponents,
            )
          : null}
        {hasDropCap && dropCapText.length > 0 ? (
          <DropCapParagraph tone="ink">{dropCapText}</DropCapParagraph>
        ) : null}
        {afterDropCap.length > 0
          ? renderSegments(
              segmentArticleBody(afterDropCap),
              components,
              blockquoteGroupComponents,
            )
          : null}
        {hasRenderableBody ? (
          <EndMark label={endMarkLabelFor(articleType)} />
        ) : null}
      </div>
    </div>
  );
}
