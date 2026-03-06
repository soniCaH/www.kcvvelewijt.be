"use client";

import { PortableText } from "@portabletext/react";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface FileAttachmentValue {
  _type: "fileAttachment";
  label?: string;
  fileUrl?: string;
}

interface HtmlTableValue {
  _type: "htmlTable";
  html?: string;
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
    htmlTable: ({ value }: { value: HtmlTableValue }) => {
      if (!value.html) return null;
      return (
        <div
          className="my-4 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: value.html }}
        />
      );
    },
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
        <figure className="my-6">
          <Image
            src={value.asset.url}
            alt={value.alt ?? ""}
            width={value.width ?? 800}
            height={value.height ?? 450}
            className="rounded w-full h-auto"
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
          className="text-kcvv-green-bright underline hover:text-kcvv-green-darker transition-colors"
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
        "prose-a:text-kcvv-green-bright prose-a:no-underline hover:prose-a:text-kcvv-green-darker",
        "prose-blockquote:border-l-4 prose-blockquote:border-kcvv-green-bright prose-blockquote:not-italic prose-blockquote:text-gray-600",
        "prose-table:w-full prose-th:bg-gray-100 prose-th:text-left prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-gray-200",
        className,
      )}
    >
      <PortableText value={content} components={components} />
    </div>
  );
};
