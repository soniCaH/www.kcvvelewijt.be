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
      className="group rounded-card hover:shadow-card-hover hover:border-green-main relative block overflow-hidden border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1"
    >
      <div
        className="bg-kcvv-green-bright pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] transition-[clip-path] duration-300 ease-out [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]"
        aria-hidden="true"
      />
      <div className="flex gap-4">
        {/* Image */}
        {result.imageUrl && (
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
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
        <div className="min-w-0 flex-1">
          {/* Type Badge */}
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
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
          <h3 className="text-gray-blue group-hover:text-green-main mb-1 line-clamp-2 text-lg font-semibold transition-colors">
            {result.title}
          </h3>

          {/* Description */}
          {result.description && (
            <p className="text-gray-dark mb-2 line-clamp-2 text-sm">
              {result.description}
            </p>
          )}

          {/* Tags (for articles) */}
          {result.type === "article" &&
            result.tags &&
            result.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {result.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
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
            className="group-hover:text-green-main text-gray-400 transition-all group-hover:translate-x-1"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
};
