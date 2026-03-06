"use client";

import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/react";
import { cn } from "@/lib/utils/cn";

interface FileAttachmentValue {
  _type: "fileAttachment";
  label?: string;
  fileUrl?: string;
}

const components = {
  types: {
    fileAttachment: ({ value }: { value: FileAttachmentValue }) => {
      if (!value.fileUrl) return null;
      return (
        <div className="my-4">
          <a
            href={value.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-kcvv-green-bright text-white rounded hover:bg-kcvv-green-darker transition-colors"
          >
            ↓ {value.label ?? "Download"}
          </a>
        </div>
      );
    },
    image: ({
      value,
    }: {
      value: { asset?: { url?: string }; alt?: string };
    }) => {
      if (!value.asset?.url) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.asset.url}
          alt={value.alt ?? ""}
          className="my-4 rounded"
        />
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
    <div className={cn("article-body px-3 lg:px-0 py-3", className)}>
      <style>{`
        .article-body a:not(.btn) {
          color: var(--color-kcvv-green-bright);
          text-decoration: underline;
        }
        .article-body a:not(.btn):hover {
          color: var(--color-kcvv-green-darker);
        }
        .article-body blockquote {
          border-left: 4px solid var(--color-kcvv-green-bright);
          padding-left: 1rem;
          margin: 1rem 0;
          color: #555;
          font-style: italic;
        }
        .article-body h1, .article-body h2, .article-body h3,
        .article-body h4, .article-body h5, .article-body h6 {
          font-weight: bold;
          margin: 1rem 0 0.5rem;
        }
        .article-body p { margin: 0.75rem 0; }
        .article-body ul { list-style: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
        .article-body ol { list-style: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
      `}</style>
      <PortableText value={content} components={components} />
    </div>
  );
};
