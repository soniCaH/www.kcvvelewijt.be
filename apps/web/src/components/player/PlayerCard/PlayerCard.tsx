/**
 * PlayerCard Component
 *
 * Visual player card for team rosters and player listings.
 * Features unified card design matching TeamCard styling.
 *
 * Features:
 * - White card container with border and shadow
 * - 3D jersey number badge (using NumberBadge component)
 * - Player photo with hover shift effect (contained)
 * - Separate content section for names and position
 * - Captain badge support
 * - Loading skeleton state
 */

import { forwardRef, type HTMLAttributes, type Ref } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { NumberBadge } from "@/components/shared/NumberBadge";
import { CARD_COLORS } from "@/lib/utils/card-tokens";

export interface PlayerCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title"
> {
  /** Player first name */
  firstName: string;
  /** Player last name */
  lastName: string;
  /** Player position (Keeper, Verdediger, Middenvelder, Aanvaller) */
  position: string;
  /** Link to player profile page */
  href: string;
  /** Jersey number */
  number?: number;
  /** Player photo URL */
  imageUrl?: string;
  /** Is team captain */
  isCaptain?: boolean;
  /** Card size variant */
  variant?: "default" | "compact";
  /** Loading state */
  isLoading?: boolean;
}

export const PlayerCard = forwardRef<HTMLElement, PlayerCardProps>(
  (
    {
      firstName,
      lastName,
      position,
      href,
      number,
      imageUrl,
      isCaptain = false,
      variant = "default",
      isLoading = false,
      className,
      ...props
    },
    ref,
  ) => {
    const fullName = `${firstName} ${lastName}`.trim();
    const isCompact = variant === "compact";

    // Loading skeleton
    if (isLoading) {
      const skeletonBg = CARD_COLORS.background.skeleton;
      return (
        <div
          ref={ref as Ref<HTMLDivElement>}
          className={cn(
            "relative overflow-hidden bg-white rounded-sm shadow-sm animate-pulse border",
            isCompact ? "h-[280px]" : "",
            className,
          )}
          style={{ borderColor: CARD_COLORS.border.default }}
          aria-label="Laden..."
        >
          {/* Image skeleton */}
          <div
            className={cn(isCompact ? "h-[200px]" : "aspect-[3/4]")}
            style={{ backgroundColor: skeletonBg }}
          />
          {/* Content skeleton */}
          <div className="p-4 space-y-2">
            <div
              className="h-6 rounded w-3/4"
              style={{ backgroundColor: skeletonBg }}
            />
            <div
              className="h-6 rounded w-1/2"
              style={{ backgroundColor: skeletonBg }}
            />
            <div
              className="h-4 rounded w-1/3"
              style={{ backgroundColor: skeletonBg }}
            />
          </div>
        </div>
      );
    }

    return (
      <article
        ref={ref}
        className={cn("player-card group h-full", className)}
        {...props}
      >
        <Link
          href={href}
          className={cn(
            "relative flex flex-col overflow-hidden rounded-sm h-full",
            "no-underline text-inherit",
            "bg-white border shadow-sm",
            "transition-shadow duration-200 ease-out",
            "hover:shadow-lg",
          )}
          style={{ borderColor: CARD_COLORS.border.default }}
          title={`${position} - ${fullName}`}
          aria-label={`Bekijk profiel van ${fullName}, ${position}${number !== undefined ? `, nummer ${number}` : ""}`}
        >
          {/* Image Section - fixed height with contained image */}
          <div
            className={cn(
              "relative overflow-hidden flex-shrink-0",
              isCompact ? "h-[200px]" : "aspect-[3/4]",
            )}
            style={{ backgroundColor: CARD_COLORS.background.placeholder }}
          >
            {/* 3D Jersey number badge */}
            {number !== undefined && (
              <NumberBadge
                value={number}
                color="green"
                size={isCompact ? "sm" : "lg"}
              />
            )}

            {/* Player image container - z-6 to be above badge (z-5), slides left on hover */}
            <div
              className={cn(
                "absolute inset-0 z-[6]",
                "transition-transform duration-300 ease-in-out",
                "group-hover:-translate-x-[30px]",
              )}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={fullName}
                  fill
                  className="object-cover object-top"
                  sizes={
                    isCompact ? "180px" : "(max-width: 960px) 232px, 299px"
                  }
                />
              ) : (
                /* Placeholder silhouette - sized to match real player photos */
                <div className="absolute inset-0 flex items-end justify-center">
                  <svg
                    className={cn(
                      isCompact
                        ? "w-[120px] h-[155px]"
                        : "w-[160px] h-[160px] lg:w-[210px] lg:h-[240px]",
                    )}
                    style={{ color: CARD_COLORS.background.icon }}
                    fill="currentColor"
                    viewBox="0 0 24 32"
                    aria-hidden="true"
                  >
                    <path d="M12 0C8.7 0 6 2.7 6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 14c-6.6 0-12 3.4-12 8v10h24V22c0-4.6-5.4-8-12-8z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Subtle gradient overlay at bottom of image */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[40%] z-[3] pointer-events-none"
              style={{
                background: `linear-gradient(0deg, ${CARD_COLORS.gradient.green}40 0%, transparent 100%)`,
              }}
              aria-hidden="true"
            />
          </div>

          {/* Content Section */}
          <div className="p-4 flex-1 flex flex-col">
            {/* Captain badge */}
            {isCaptain && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 mb-2 self-start",
                  "text-xs font-medium uppercase tracking-wide",
                  "bg-kcvv-green-bright/10 text-kcvv-green-bright rounded px-2 py-0.5",
                )}
                aria-label="Aanvoerder"
              >
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Aanvoerder
              </span>
            )}

            {/* First name - semibold */}
            <div
              className={cn(
                "text-gray-900 uppercase font-semibold truncate",
                isCompact ? "text-lg" : "text-xl lg:text-2xl",
              )}
              style={{
                fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
                lineHeight: 1.2,
              }}
            >
              {firstName}
            </div>

            {/* Last name - thin */}
            <div
              className={cn(
                "text-gray-900 uppercase font-thin truncate",
                isCompact ? "text-lg" : "text-xl lg:text-2xl",
              )}
              style={{
                fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
                lineHeight: 1.2,
              }}
            >
              {lastName}
            </div>

            {/* Position */}
            <div
              className={cn(
                "text-gray-500 mt-1",
                isCompact ? "text-xs" : "text-sm",
              )}
            >
              {position}
            </div>
          </div>
        </Link>
      </article>
    );
  },
);

PlayerCard.displayName = "PlayerCard";
