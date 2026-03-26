/**
 * TeamHeader Component
 *
 * Hero section for team detail pages.
 * Displays team name, photo, and optional coach info.
 *
 * Features:
 * - Team name with optional tagline
 * - Team/group photo banner
 * - Age group badge for youth teams
 * - Optional coach info display
 * - Loading skeleton state
 */

import { forwardRef, type HTMLAttributes, type Ref } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface TeamHeaderProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title"
> {
  /** Team name */
  name: string;
  /** Team tagline or motto */
  tagline?: string;
  /** Team/group photo URL */
  imageUrl?: string;
  /** Age group for youth teams (e.g., U15, U21) */
  ageGroup?: string;
  /** Type of team for visual styling */
  teamType?: "senior" | "youth" | "club";
  /** Coach information */
  coach?: {
    name: string;
    role?: string;
    imageUrl?: string;
  };
  /** Loading state */
  isLoading?: boolean;
}

export const TeamHeader = forwardRef<HTMLElement, TeamHeaderProps>(
  (
    {
      name,
      tagline,
      imageUrl,
      ageGroup,
      teamType = "senior",
      coach,
      isLoading = false,
      className,
      ...props
    },
    ref,
  ) => {
    // Team type badge colors
    const badgeColors = {
      senior: "bg-kcvv-green-bright text-white",
      youth: "bg-blue-500 text-white",
      club: "bg-amber-500 text-white",
    };

    // Loading skeleton
    if (isLoading) {
      return (
        <header
          ref={ref as Ref<HTMLElement>}
          className={cn("relative w-full", className)}
          aria-label="Team header laden..."
          {...props}
        >
          {/* Banner skeleton */}
          <div className="relative h-[200px] md:h-[300px] lg:h-[400px] bg-gray-200 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Content skeleton */}
          <div className="container mx-auto px-4 -mt-16 relative z-10">
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-64 animate-pulse" />
              </div>
            </div>
          </div>
        </header>
      );
    }

    return (
      <header ref={ref} className={cn("relative w-full", className)} {...props}>
        {/* Banner Image */}
        <div className="relative h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${name} teamfoto`}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div
              className={cn(
                "absolute inset-0",
                teamType === "youth" && "bg-blue-600",
                teamType === "senior" && "bg-kcvv-green-dark",
                teamType === "club" && "bg-amber-600",
              )}
            />
          )}

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Age group badge (positioned in banner) */}
          {ageGroup && (
            <div
              className={cn(
                "absolute top-4 left-4 md:top-6 md:left-6",
                "px-4 py-2 rounded-sm",
                "text-lg md:text-xl font-bold uppercase tracking-wide",
                badgeColors[teamType],
              )}
            >
              {ageGroup}
            </div>
          )}

          {/* Team type indicator for non-youth */}
          {!ageGroup && teamType === "club" && (
            <div
              className={cn(
                "absolute top-4 left-4 md:top-6 md:left-6",
                "px-4 py-2 rounded-sm",
                "text-sm font-medium uppercase tracking-wide",
                badgeColors[teamType],
              )}
            >
              Club
            </div>
          )}
        </div>

        {/* Content Card (overlapping banner) */}
        <div className="container mx-auto px-4 -mt-16 md:-mt-20 relative z-10">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Team Info */}
              <div className="flex-1">
                <h1
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900"
                  style={{
                    fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
                  }}
                >
                  {name}
                </h1>

                {tagline && (
                  <p className="text-lg md:text-xl text-gray-600 mt-2">
                    {tagline}
                  </p>
                )}

                {/* Coach Info */}
                {coach && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                    {coach.imageUrl ? (
                      <Image
                        src={coach.imageUrl}
                        alt={coach.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {coach.name}
                      </p>
                      {coach.role && (
                        <p className="text-sm text-gray-500">{coach.role}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  },
);

TeamHeader.displayName = "TeamHeader";
