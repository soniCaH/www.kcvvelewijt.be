import { PortableText } from "@portabletext/react";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DropCapParagraph } from "@/components/design-system/DropCapParagraph";
import { EndMark } from "@/components/design-system/EndMark";
import {
  PullQuote,
  type PullQuoteTone,
} from "@/components/design-system/PullQuote";
import { QASectionDivider } from "@/components/design-system/QASectionDivider";
import { SubjectAvatar } from "@/components/design-system/SubjectAvatar";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import { DownloadButton } from "@/components/design-system/DownloadButton";
import {
  resolvePairRespondent,
  resolveSubject,
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
 *   - `fileAttachment` routes to `<DownloadButton variant="card">`
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
  className?: string;
}

interface PullQuoteBlock {
  _type: "pullQuote";
  _key?: string;
  body?: string;
  tone?: PullQuoteTone;
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

interface InternalLinkReference {
  _type: string;
  slug?: string;
  psdId?: string;
}

interface InternalLinkValue {
  reference?: InternalLinkReference;
}

type PortableTextSpanLike = {
  _type?: string;
  text?: string;
  marks?: string[];
};

type PortableTextBlockLike = {
  _type?: string;
  style?: string;
  children?: PortableTextSpanLike[];
};

function isNormalParagraph(block: PortableTextBlock): boolean {
  if (block._type !== "block") return false;
  const style = (block as PortableTextBlockLike).style;
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

function resolveInternalLinkHref(ref?: InternalLinkReference): string {
  if (!ref) return "#";
  switch (ref._type) {
    case "player":
      return ref.psdId ? `/spelers/${ref.psdId}` : "#";
    case "staffMember":
      return ref.psdId ? `/staf/${ref.psdId}` : "#";
    case "team":
      return ref.slug ? `/ploegen/${ref.slug}` : "#";
    case "article":
      return ref.slug ? `/nieuws/${ref.slug}` : "#";
    case "page":
      // Page documents are served at /club/[slug].
      return ref.slug ? `/club/${ref.slug}` : "#";
    default:
      return "#";
  }
}

/**
 * Segment the body content into PT-block runs and consecutive-
 * transferFact groups, per the 5.d-tra adjacency rule.
 */
type ArticleBodySegment =
  | { kind: "pt"; key: string; blocks: PortableTextBlock[] }
  | { kind: "transfer-facts"; key: string; facts: TransferFactValue[] };

function buildSegments(blocks: PortableTextBlock[]): ArticleBodySegment[] {
  const segments: ArticleBodySegment[] = [];
  let ptBuffer: PortableTextBlock[] = [];
  let tfBuffer: TransferFactValue[] = [];
  let idx = 0;

  const flushPt = () => {
    if (ptBuffer.length > 0) {
      segments.push({ kind: "pt", key: `pt-${idx++}`, blocks: ptBuffer });
      ptBuffer = [];
    }
  };
  const flushTf = () => {
    if (tfBuffer.length > 0) {
      segments.push({
        kind: "transfer-facts",
        key: `tf-${idx++}`,
        facts: tfBuffer,
      });
      tfBuffer = [];
    }
  };

  for (const block of blocks) {
    if (block._type === "transferFact") {
      const fact = block as TransferFactValue;
      if (!fact.playerName?.trim()) continue;
      flushPt();
      tfBuffer.push(fact);
      continue;
    }
    flushTf();
    ptBuffer.push(block);
  }
  flushPt();
  flushTf();
  return segments;
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

function renderSegments(
  segments: ArticleBodySegment[],
  components: PortableTextComponents,
): ReactNode {
  return segments.map((seg) =>
    seg.kind === "pt" ? (
      <PortableText key={seg.key} value={seg.blocks} components={components} />
    ) : (
      <TransferFactGroup key={seg.key} facts={seg.facts} />
    ),
  );
}

function renderPullQuote(
  value: PullQuoteBlock,
  subjects: IndexedSubject[] | null,
): ReactNode {
  const body = value.body?.trim();
  if (!body) return null;

  const respondent = resolvePairRespondent(value.respondentKey, subjects);
  const resolved = resolveSubject(respondent);
  const emphasis = value.emphasis ? { text: value.emphasis } : undefined;
  const tone = value.tone ?? "cream";

  let inner: ReactNode;

  if (resolved && respondent) {
    const firstNameFromRef =
      (respondent.kind === "player" && respondent.playerRef?.firstName) ||
      (respondent.kind === "staff" && respondent.staffRef?.firstName) ||
      (respondent.kind === "custom" && respondent.customName) ||
      resolved.name;
    inner = (
      <PullQuote
        tone={tone}
        attribution={{
          name: resolved.name,
          role: resolved.role || undefined,
        }}
        emphasis={emphasis}
        avatarSlot={
          <SubjectAvatar
            firstName={firstNameFromRef || resolved.name}
            fullName={resolved.name}
            photoUrl={resolved.photoUrl}
            scale="attribution"
          />
        }
      >
        {body}
      </PullQuote>
    );
  } else {
    const externalName = value.externalName?.trim();
    inner = externalName ? (
      <PullQuote
        tone={tone}
        attribution={{
          name: externalName,
          role: value.externalRole?.trim() || undefined,
          source: value.externalSource?.trim() || undefined,
        }}
        emphasis={emphasis}
      >
        {body}
      </PullQuote>
    ) : (
      <PullQuote tone={tone} attribution={{ name: "" }} emphasis={emphasis}>
        {body}
      </PullQuote>
    );
  }

  return (
    <div data-pullquote-spacer="true" className="my-10">
      {inner}
    </div>
  );
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

function buildComponents({
  subjects,
  articleSlug,
  videoBlockPositions,
}: ComponentsBuildArgs): PortableTextComponents {
  return {
    block: {
      h2: ({ value }: { value?: PortableTextBlock }) => {
        if (!value) return null;
        return <QASectionDivider title={[value]} />;
      },
      blockquote: ({ children }) => (
        // Italic Freight body, ink-muted left rule. Reuses the existing
        // typography tokens — no new design-system primitive.
        <blockquote
          data-article-blockquote="true"
          className="border-ink-muted text-ink font-display my-8 border-l-2 pl-5 text-[19px] leading-[1.55] italic"
        >
          {children}
        </blockquote>
      ),
    },
    types: {
      pullQuote: ({ value }: { value: PullQuoteBlock }) =>
        renderPullQuote(value, subjects),
      qaBlock: ({ value }: { value: QaBlockValue }) => (
        <QaBlock value={value} subjects={subjects} />
      ),
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
              variant="card"
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
        return (
          <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            data-article-link="external"
            // Phase 5 cream-surface link styling — jersey-deep underline,
            // 2px offset, full-opacity on hover. Mirrors the locked
            // article-body link vocabulary from the cream redesign.
            className="text-jersey-deep decoration-jersey-deep/40 hover:decoration-jersey-deep underline underline-offset-[3px] hover:decoration-2"
          >
            {children}
            {isExternal ? (
              <>
                <ExternalLinkIcon
                  aria-hidden="true"
                  className="ml-0.5 inline-block align-baseline opacity-60"
                  size="0.75em"
                />
                <span className="sr-only"> (opens in new tab)</span>
              </>
            ) : null}
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
        const href = resolveInternalLinkHref(value?.reference);
        return (
          <Link
            href={href}
            data-article-link="internal"
            className="text-jersey-deep decoration-jersey-deep/40 hover:decoration-jersey-deep underline underline-offset-[3px] hover:decoration-2"
          >
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
  const hasRenderableBody = content.some(blockHasRenderableOutput);

  return (
    <div
      data-article-body="true"
      className={cn("bg-cream w-full px-4 py-12 lg:px-0 lg:py-16", className)}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-prose)" }}
      >
        {beforeDropCap.length > 0
          ? renderSegments(buildSegments(beforeDropCap), components)
          : null}
        {hasDropCap && dropCapText.length > 0 ? (
          <DropCapParagraph tone="ink">{dropCapText}</DropCapParagraph>
        ) : null}
        {afterDropCap.length > 0
          ? renderSegments(buildSegments(afterDropCap), components)
          : null}
        {hasRenderableBody ? <EndMark /> : null}
      </div>
    </div>
  );
}
