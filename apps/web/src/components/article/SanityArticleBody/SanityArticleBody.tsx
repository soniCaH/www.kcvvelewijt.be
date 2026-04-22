"use client";

import { PortableText } from "@portabletext/react";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import sanitizeHtml from "sanitize-html";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DownloadButton } from "@/components/design-system/DownloadButton";
import { useScrollHint } from "@/components/design-system/ScrollHint/useScrollHint";
import { useMemo } from "react";
import {
  QaBlock,
  type QaBlockValue,
} from "@/components/article/blocks/QaBlock";
import {
  TransferFactFeature,
  TransferFactOverview,
  type TransferFactValue,
} from "@/components/article/blocks/TransferFact";
import type { SubjectValue } from "@/components/article/SubjectAttribution";

const TABLE_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "colgroup",
    "col",
  ],
  allowedAttributes: {
    "*": ["colspan", "rowspan", "scope"],
  },
};

interface ArticleImageValue {
  asset?: { url?: string };
  alt?: string;
  width?: number;
  height?: number;
  fullBleed?: boolean;
}

function ArticleImageBlock({ value }: { value: ArticleImageValue }) {
  if (!value.asset?.url) return null;
  const isFullBleed = value.fullBleed === true;
  return (
    <figure
      className={cn(
        "my-8 overflow-hidden rounded-lg",
        isFullBleed && "full-bleed rounded-none",
      )}
    >
      <Image
        src={value.asset.url}
        alt={value.alt ?? ""}
        width={value.width ?? 800}
        height={value.height ?? 450}
        className="h-auto w-full transition-transform duration-300 ease-in-out hover:scale-105"
        sizes={isFullBleed ? "100vw" : "(max-width: 768px) 100vw, 720px"}
      />
    </figure>
  );
}

interface FileAttachmentValue {
  _type: "fileAttachment";
  label?: string;
  fileUrl?: string;
  fileSize?: number;
  fileMimeType?: string;
  fileOriginalFilename?: string;
}

interface InternalLinkReference {
  _type: string;
  slug?: string;
  psdId?: string;
}

interface InternalLinkValue {
  reference?: InternalLinkReference;
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
      // Page documents are served at /club/[slug] — see apps/web/src/app/(main)/club/[slug]/page.tsx.
      return ref.slug ? `/club/${ref.slug}` : "#";
    default:
      return "#";
  }
}

interface HtmlTableValue {
  _type: "htmlTable";
  html?: string;
}

function HtmlTableBlock({ value }: { value: HtmlTableValue }) {
  const { scrollRef, canScrollRight } = useScrollHint<HTMLDivElement>();

  if (!value.html) return null;

  return (
    <div className="relative my-4">
      <div
        ref={scrollRef}
        role="region"
        aria-label="Scrollable table"
        tabIndex={0}
        className={cn(
          "overflow-x-auto",
          "focus:outline-2 focus:outline-kcvv-green focus:outline-offset-2",
          "[&>table]:w-full [&>table]:border-collapse [&>table]:text-sm",
          "[&>table>thead]:bg-table-header-bg",
          "[&>table_th]:border [&>table_th]:border-table-border-header [&>table_th]:p-2 [&>table_th]:text-left [&>table_th]:font-semibold",
          "[&>table_td]:border [&>table_td]:border-table-border [&>table_td]:p-2 [&>table_td]:align-top",
          "[&>table>tbody>tr:nth-child(odd)_td]:bg-white",
          "[&>table>tbody>tr:nth-child(even)_td]:bg-table-row-even",
          canScrollRight && [
            "[&>table_td:first-child]:sticky [&>table_td:first-child]:left-0 [&>table_td:first-child]:z-10",
            "[&>table>tbody>tr:nth-child(odd)>td:first-child]:bg-white",
            "[&>table>tbody>tr:nth-child(even)>td:first-child]:bg-table-row-even",
            "[&>table_th:first-child]:sticky [&>table_th:first-child]:left-0 [&>table_th:first-child]:z-20 [&>table_th:first-child]:bg-table-header-bg",
            "[&>table_td:first-child]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]",
            "[&>table_th:first-child]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]",
          ],
        )}
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(value.html, TABLE_SANITIZE_OPTIONS),
        }}
      />
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/90 to-transparent" />
      )}
    </div>
  );
}

export interface SanityArticleBodyProps {
  content: PortableTextBlock[];
  className?: string;
  /**
   * Article-level subject passed into `qaBlock` so the `key` and `quote`
   * pair treatments can render the shared attribution + photo. Not used
   * when rendering non-interview articles (subject will be null).
   */
  subject?: SubjectValue | null;
  /**
   * `_key` of the `transferFact` block that should render as the feature
   * variant (full-bleed, player cutout + from/to). All other
   * `transferFact` blocks render as overview cards. Computed by
   * `TransferTemplate` from the article body; leave undefined for
   * non-transfer articles — every transferFact then renders as overview.
   *
   * TODO (Phase 6, #1332): the upcoming `eventFact` block follows the
   * same first-is-feature / rest-are-overview pattern. When adding the
   * second caller, replace this type-specific prop with a generic
   * body-block pre-processor that annotates the winning block with a
   * `_variant: "feature"` marker — keeps `SanityArticleBody` agnostic
   * of which article type owns the feature slot.
   */
  featureTransferKey?: string;
}

export const SanityArticleBody = ({
  content,
  className,
  subject = null,
  featureTransferKey,
}: SanityArticleBodyProps) => {
  // Rebuild the components map whenever `subject` or the feature-transfer
  // key changes so the per-block renderers see the current article state
  // without reaching for a context provider.
  const components = useMemo<PortableTextComponents>(
    () => ({
      types: {
        fileAttachment: ({ value }: { value: FileAttachmentValue }) => {
          if (!value.fileUrl) return null;
          return (
            <div className="my-4">
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
        htmlTable: HtmlTableBlock,
        image: ArticleImageBlock,
        articleImage: ArticleImageBlock,
        qaBlock: ({ value }: { value: QaBlockValue }) => (
          <QaBlock value={value} subject={subject} />
        ),
        transferFact: ({ value }: { value: TransferFactValue }) =>
          featureTransferKey && value._key === featureTransferKey ? (
            <TransferFactFeature value={value} />
          ) : (
            <TransferFactOverview value={value} />
          ),
      },
      block: {
        blockquote: ({ children }) => (
          <blockquote>
            <p>{children}</p>
          </blockquote>
        ),
      },
      marks: {
        link: ({ children, value }) => {
          const href: string = value?.href ?? "#";
          const isExternal = href.startsWith("http");
          return (
            <a
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="content-link"
            >
              {children}
              {isExternal && (
                <>
                  <ExternalLinkIcon
                    aria-hidden="true"
                    className="ml-0.5 inline-block align-baseline opacity-60"
                    size="0.75em"
                  />
                  <span className="sr-only"> (opens in new tab)</span>
                </>
              )}
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
            <Link href={href} className="content-link">
              {children}
            </Link>
          );
        },
      },
    }),
    [subject, featureTransferKey],
  );

  return (
    <div
      className={cn(
        // Design §5.2 / §7.2 — body reading column constrained to 65 ch
        // and centred inside the 60 rem `max-w-inner-lg` main wrapper.
        // `full-bleed` children (qaBlock key/quote) still break out to
        // 100 vw because the wrapper is mx-auto centred.
        "prose prose-lg max-w-[65ch] mx-auto px-3 py-3 lg:px-0",
        "prose-headings:font-title prose-headings:font-bold prose-headings:text-kcvv-black",
        "prose-h2:mt-10 prose-h2:text-2xl prose-h3:mt-8 prose-h3:text-xl",
        "prose-p:leading-relaxed prose-p:text-kcvv-gray-dark",
        /* prose-a: fallback for <a> tags not rendered via marks (e.g. inside htmlTable raw HTML) */
        "prose-a:text-kcvv-green-dark prose-a:decoration-kcvv-green/30 prose-a:underline-offset-2 hover:prose-a:text-kcvv-green hover:prose-a:decoration-kcvv-green",
        /* Blockquote: legacy `.prose blockquote` glyph treatment in
           globals.css by default; announcement/transfer templates pass
           `className="article-body"` which swaps to the §7.4 rule-framed
           treatment via `.article-body blockquote`. */
        "prose-table:w-full prose-th:bg-table-header-bg prose-th:p-2 prose-th:text-left prose-td:border prose-td:border-table-border prose-td:p-2",
        className,
      )}
    >
      <PortableText value={content} components={components} />
    </div>
  );
};
