"use client";

/**
 * ArticleMetadata Component
 * Inline horizontal bar with breadcrumb navigation, date, author, and share icons
 */

import Link from "next/link";
import { Icon } from "@/components/design-system";
import { Facebook, Twitter } from "@/lib/icons";
import { FacebookShareButton, TwitterShareButton } from "react-share";
import { cn } from "@/lib/utils/cn";

export interface ArticleMetadataProps {
  /** Article author name */
  author: string;
  /** Publication date (formatted string) */
  date?: string;
  /** Primary category for breadcrumb */
  category?: {
    name: string;
    href: string;
  };
  /** Share configuration */
  shareConfig?: {
    url: string;
    title: string;
    twitterHandle?: string;
    hashtags?: string[];
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Article metadata bar — horizontal layout below the hero.
 * Breadcrumb left, date + author + share icons right.
 */
export const ArticleMetadata = ({
  author,
  date,
  category,
  shareConfig,
  className,
}: ArticleMetadataProps) => {
  return (
    <nav
      aria-label="Article info"
      className={cn(
        "w-full border-b border-gray-200 py-3 px-6 text-sm text-gray-600",
        className,
      )}
    >
      <div className="w-full max-w-inner-lg mx-auto flex flex-wrap items-center justify-between gap-y-2">
        {/* Breadcrumb — left */}
        <div className="flex items-center gap-1.5">
          <Link href="/news" className="text-kcvv-green-bright hover:underline">
            News
          </Link>
          {category && (
            <>
              <span className="text-gray-400" aria-hidden="true">
                ›
              </span>
              <Link
                href={category.href}
                className="text-kcvv-green-bright hover:underline"
              >
                {category.name}
              </Link>
            </>
          )}
        </div>

        {/* Right side: date, author, share */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {date && <span>{date}</span>}
          {author && <span>{author}</span>}

          {shareConfig && (
            <div className="flex items-center gap-2">
              <span className="sr-only md:not-sr-only text-gray-400">
                Delen:
              </span>
              <FacebookShareButton
                url={shareConfig.url}
                aria-label="Delen op Facebook"
                className="text-gray-400 hover:text-[#3b5998] transition-colors"
              >
                <Icon icon={Facebook} size="xs" />
              </FacebookShareButton>
              <TwitterShareButton
                url={shareConfig.url}
                title={shareConfig.title}
                via={shareConfig.twitterHandle?.replace("@", "")}
                hashtags={shareConfig.hashtags}
                aria-label="Delen op X"
                className="text-gray-400 hover:text-kcvv-black transition-colors"
              >
                <Icon icon={Twitter} size="xs" />
              </TwitterShareButton>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
