"use client";

import { PortableText } from "@portabletext/react";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/utils/cn";

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

interface FileAttachmentValue {
  _type: "fileAttachment";
  label?: string;
  fileUrl?: string;
}

interface HtmlTableValue {
  _type: "htmlTable";
  html?: string;
}

function HtmlTableBlock({ value }: { value: HtmlTableValue }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showOverflowHint, setShowOverflowHint] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setShowOverflowHint(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [checkOverflow]);

  if (!value.html) return null;

  return (
    <div className="relative my-4">
      <div
        ref={containerRef}
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
          showOverflowHint && [
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
      {showOverflowHint && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/90 to-transparent" />
      )}
    </div>
  );
}

const components: PortableTextComponents = {
  types: {
    fileAttachment: ({ value }: { value: FileAttachmentValue }) => {
      if (!value.fileUrl) return null;
      return (
        <div className="my-4">
          <a
            href={value.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-kcvv-green-bright text-white rounded hover:bg-kcvv-green-darker transition-colors no-underline"
          >
            ↓ {value.label ?? "Download"}
          </a>
        </div>
      );
    },
    htmlTable: HtmlTableBlock,
    image: ({
      value,
    }: {
      value: {
        asset?: { url?: string };
        alt?: string;
        width?: number;
        height?: number;
      };
    }) => {
      if (!value.asset?.url) return null;
      return (
        <figure className="my-6 overflow-hidden rounded lg:-mr-80">
          <Image
            src={value.asset.url}
            alt={value.alt ?? ""}
            width={value.width ?? 800}
            height={value.height ?? 450}
            className="w-full h-auto rounded transition-transform duration-300 ease-in-out hover:scale-105"
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </figure>
      );
    },
  },
  block: {
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-kcvv-green-bright pl-4 my-4 italic text-gray-600 not-italic">
        {children}
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
          className="text-kcvv-green-bright hover:underline"
        >
          {children}
        </a>
      );
    },
  },
};

export interface SanityArticleBodyProps {
  content: PortableTextBlock[];
  className?: string;
}

export const SanityArticleBody = ({
  content,
  className,
}: SanityArticleBodyProps) => {
  return (
    <div
      className={cn(
        "prose prose-lg max-w-none px-3 lg:px-0 py-3",
        "prose-headings:font-bold prose-headings:text-gray-900",
        "prose-a:text-kcvv-green-bright prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-4 prose-blockquote:border-kcvv-green-bright prose-blockquote:not-italic prose-blockquote:text-gray-600",
        "prose-table:w-full prose-th:bg-table-header-bg prose-th:text-left prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-table-border",
        className,
      )}
    >
      <PortableText value={content} components={components} />
    </div>
  );
};
