import { PortableText } from "@portabletext/react";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import type { ReactNode } from "react";
import { DropCapParagraph } from "@/components/design-system/DropCapParagraph";
import { QASectionDivider } from "@/components/design-system/QASectionDivider";
import { cn } from "@/lib/utils/cn";

/**
 * <ArticleBody> — shared article-body container for every articleType.
 *
 * Renders the Sanity Portable Text body at `--container-prose` width on a
 * cream surface and emits Phase 1 primitives in PT-block order. The first
 * normal paragraph is wrapped in <DropCapParagraph tone="ink"> per Phase 5
 * 5.A.1; subsequent paragraphs render through the PortableText default.
 *
 * Scope intentionally narrow (per Phase 5 PRD §3, 5.A.1):
 *   - DropCap injection on the first normal paragraph.
 *   - `accent` mark serializer (italic + jersey-deep).
 *   - `h2` block serializer (section-break treatment per 5.d3 lock).
 *
 * <PullQuote>, <EndMark>, <VerderLezenRow>, and variant-specific PT block
 * types (qaBlock, transferFact, eventFact, etc.) wire in subsequent
 * sub-issues (5.A.2 → 5.B.*). Unknown PT block types fall through to
 * PortableText's default behaviour (silent no-op for unknown types,
 * default styling for unknown block styles).
 */
export interface ArticleBodyProps {
  content: PortableTextBlock[];
  className?: string;
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

const components: PortableTextComponents = {
  block: {
    // h2 body headings delegate to <QASectionDivider> per the 5.d3 lock:
    // "<QASectionDivider title> is the Phase 3-b lock and ships verbatim."
    // The body h2 is the section-break treatment; QASectionDivider already
    // emits the italic centered title flanked by rules + ✦ glyphs, with
    // `accent` decorator support inside the title. We hand it the raw PT
    // block as its single-block title so any inline `accent` marks ride
    // through to the divider's accent renderer.
    h2: ({ value }: { value?: PortableTextBlock }) => {
      if (!value) return null;
      return <QASectionDivider title={[value]} />;
    },
  },
  marks: {
    // accent — italic + jersey-deep inline emphasis. The schema decorator
    // is not exposed on `article.body` today; the serializer ships ahead
    // of the schema migration so the renderer is forward-compatible. See
    // PRD §11 (Open follow-ups).
    accent: ({ children }: { children?: ReactNode }) => (
      <em className="text-jersey-deep font-black italic">{children}</em>
    ),
  },
};

export function ArticleBody({ content, className }: ArticleBodyProps) {
  const dropCapIdx = content.findIndex(isNormalParagraph);
  const hasDropCap = dropCapIdx >= 0;
  const dropCapBlock = hasDropCap ? content[dropCapIdx] : null;
  const dropCapText = dropCapBlock ? extractBlockText(dropCapBlock) : "";
  const beforeDropCap = hasDropCap ? content.slice(0, dropCapIdx) : content;
  const afterDropCap = hasDropCap ? content.slice(dropCapIdx + 1) : [];

  return (
    <div
      data-article-body="true"
      className={cn("bg-cream w-full px-4 py-12 lg:px-0 lg:py-16", className)}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-prose)" }}
      >
        {beforeDropCap.length > 0 ? (
          <PortableText value={beforeDropCap} components={components} />
        ) : null}
        {hasDropCap && dropCapText.length > 0 ? (
          <DropCapParagraph tone="ink">{dropCapText}</DropCapParagraph>
        ) : null}
        {afterDropCap.length > 0 ? (
          <PortableText value={afterDropCap} components={components} />
        ) : null}
      </div>
    </div>
  );
}
