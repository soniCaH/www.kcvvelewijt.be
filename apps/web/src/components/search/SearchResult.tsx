/**
 * SearchResult Component
 * Individual search result card
 */

import Link from "next/link";
import Image from "next/image";
import { SearchResult as SearchResultType } from "./SearchInterface";
import { Icon } from "@/components/design-system";
import { Newspaper, User, UserCog, Users, ArrowRight } from "lucide-react";

export interface SearchResultProps {
  /**
   * Search result data
   */
  result: SearchResultType;
  /**
   * Click handler for analytics tracking
   */
  onClick?: () => void;
  // Note: query prop removed until highlighting feature is implemented (YAGNI)
}

const typeIcons = {
  article: Newspaper,
  player: User,
  staff: UserCog,
  team: Users,
} as const;

const typeLabels = {
  article: "Nieuws",
  player: "Speler",
  staff: "Staf",
  team: "Team",
} as const;

/**
 * Individual search result card
 */
export const SearchResult = ({ result, onClick }: SearchResultProps) => {
  return (
    <Link
      href={result.url}
      onClick={onClick}
      className="group relative overflow-hidden block bg-white rounded-card shadow-sm hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 p-4 border border-gray-100 hover:border-green-main"
    >
      <div
        className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
        aria-hidden="true"
      />
      <div className="flex gap-4">
        {/* Image */}
        {result.imageUrl && (
          <div className="flex-shrink-0 w-24 h-24 relative rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={result.imageUrl}
              alt={result.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
              <Icon icon={typeIcons[result.type]} size="xs" />
              {typeLabels[result.type]}
            </span>

            {/* Date for articles */}
            {result.type === "article" && result.date && (
              <span className="text-xs text-gray-500">
                {new Date(result.date).toLocaleDateString("nl-BE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-blue mb-1 group-hover:text-green-main transition-colors line-clamp-2">
            {result.title}
          </h3>

          {/* Description */}
          {result.description && (
            <p className="text-sm text-gray-dark line-clamp-2 mb-2">
              {result.description}
            </p>
          )}

          {/* Tags (for articles) */}
          {result.type === "article" &&
            result.tags &&
            result.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {result.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {result.tags.length > 3 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{result.tags.length - 3} meer
                  </span>
                )}
              </div>
            )}
        </div>

        {/* Arrow Icon */}
        <div
          className="flex-shrink-0 self-center"
          data-testid="search-result-arrow"
        >
          <Icon
            icon={ArrowRight}
            size="sm"
            className="text-gray-400 group-hover:text-green-main group-hover:translate-x-1 transition-all"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
};
