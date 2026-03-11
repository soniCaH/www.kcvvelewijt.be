/**
 * MatchReport Component
 *
 * Written match report section with text and optional photos.
 *
 * Features:
 * - Rich HTML content support
 * - Author and publication date
 * - Optional photo gallery
 * - Summary variant for shorter display
 * - Empty state when no report available
 */

import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/utils/cn";
import { User, Calendar } from "lucide-react";

export interface MatchReportPhoto {
  /** Photo URL */
  url: string;
  /** Alt text for accessibility */
  alt: string;
}

export interface MatchReportProps {
  /** Report title */
  title: string;
  /** Report content (HTML) */
  content: string;
  /** Author name */
  author?: string;
  /** Publication date (ISO string) */
  publishedAt?: string;
  /** Photo gallery */
  photos?: MatchReportPhoto[];
  /** Display variant */
  variant?: "default" | "summary";
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format date for display with validation
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString("nl-BE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Render a match report with rich text content, author info, and optional photos.
 *
 * @param title - Report title
 * @param content - HTML content of the report
 * @param author - Optional author name
 * @param publishedAt - Optional publication date (ISO string)
 * @param photos - Optional array of photos
 * @param variant - Display variant (default or summary)
 * @param isLoading - Show loading skeleton
 * @param className - Additional CSS classes
 * @returns The rendered match report element
 */
export function MatchReport({
  title,
  content,
  author,
  publishedAt,
  photos,
  variant = "default",
  isLoading = false,
  className,
}: MatchReportProps) {
  const isSummary = variant === "summary";

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!content || content.trim() === "") {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-gray-500">
          Nog geen wedstrijdverslag beschikbaar voor deze wedstrijd.
        </p>
      </div>
    );
  }

  return (
    <article className={cn("space-y-4", className)}>
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 font-title">{title}</h2>

      {/* Author and date */}
      {(author || publishedAt) && (
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {author && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" aria-hidden="true" />
              <span>{author}</span>
            </div>
          )}
          {publishedAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            </div>
          )}
        </div>
      )}

      {/* Content - sanitized with DOMPurify to prevent XSS */}
      <div
        className={cn(
          "prose prose-gray max-w-none",
          isSummary && "prose-sm",
          // Style nested headings
          "prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2",
          // Style paragraphs
          "prose-p:text-gray-700 prose-p:leading-relaxed",
        )}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />

      {/* Photo gallery */}
      {photos && photos.length > 0 && !isSummary && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Foto&apos;s
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
