/**
 * PlayerProfile Component
 *
 * Main player profile page layout component.
 * Displays player hero, bio, and stats sections.
 *
 * Features:
 * - Hero section with large jersey number and player photo
 * - Player name with first name (semibold) / last name (thin) styling
 * - Position and team information
 * - Biography section (via PlayerBio)
 * - Loading and error states
 */

import { forwardRef, type HTMLAttributes } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { PlayerBio } from "../PlayerBio";

/**
 * Generate text-shadow CSS for the 3D effect on jersey number
 * Matches the Gatsby SCSS textShadow function exactly
 */
function generateTextShadow(precision: number, size: number): string {
  const shadows: string[] = [];
  let offset = 0;
  const length = Math.floor(size * (1 / precision)) - 1;

  for (let i = 0; i <= length; i++) {
    offset += precision;
    shadows.push(`${-offset}px ${offset}px #4B9B48`);
  }

  return shadows.join(", ");
}

// Pre-calculate the text shadow for performance
const JERSEY_NUMBER_SHADOW = generateTextShadow(0.25, 12);

export interface PlayerProfileProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Player first name */
  firstName: string;
  /** Player last name */
  lastName: string;
  /** Player position (Keeper, Verdediger, Middenvelder, Aanvaller) */
  position: string;
  /** Jersey number */
  number?: number;
  /** Player photo URL */
  imageUrl?: string;
  /** Team name */
  teamName: string;
  /** Is team captain */
  isCaptain?: boolean;
  /** Birth date (YYYY-MM-DD format) */
  birthDate?: string;
  /** Date player joined the club (YYYY-MM-DD format) */
  joinDate?: string;
  /** Date player left the club (YYYY-MM-DD format) */
  leaveDate?: string;
  /** Biography text */
  biography?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Retry callback for error state */
  onRetry?: () => void;
}

export const PlayerProfile = forwardRef<HTMLDivElement, PlayerProfileProps>(
  (
    {
      firstName,
      lastName,
      position,
      number,
      imageUrl,
      teamName,
      isCaptain = false,
      birthDate,
      joinDate,
      leaveDate,
      biography,
      isLoading = false,
      error,
      onRetry,
      className,
      ...props
    },
    ref,
  ) => {
    const fullName = `${firstName} ${lastName}`.trim();

    // Loading skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn("animate-pulse", className)}
          aria-label="Profiel laden..."
          {...props}
        >
          {/* Hero skeleton */}
          <div className="relative bg-gray-200 h-[400px] lg:h-[500px]">
            <div className="absolute bottom-8 left-6 space-y-4">
              <div className="h-12 w-64 bg-gray-300 rounded" />
              <div className="h-8 w-48 bg-gray-300 rounded" />
              <div className="h-6 w-32 bg-gray-300 rounded" />
            </div>
          </div>
          {/* Content skeleton */}
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded-lg" />
              <div className="h-24 bg-gray-200 rounded-lg" />
              <div className="h-24 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-48 bg-gray-200 rounded-lg" />
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center min-h-[400px] p-8 text-center",
            className,
          )}
          role="alert"
          {...props}
        >
          <svg
            className="w-16 h-16 text-red-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-lg text-kcvv-gray-dark mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-kcvv-green-bright text-white rounded-lg hover:bg-kcvv-green-DEFAULT transition-colors"
            >
              Opnieuw proberen
            </button>
          )}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("player-profile", className)} {...props}>
        {/* Hero Section */}
        <section className="relative bg-[#edeff4] overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "linear-gradient(135deg, #edeff4 0%, #e0e3eb 50%, #edeff4 100%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 lg:py-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8">
              {/* Left side - Name and info */}
              <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
                {/* Captain badge */}
                {isCaptain && (
                  <span className="inline-flex items-center gap-1 mb-2 text-xs font-medium uppercase tracking-wide text-white bg-kcvv-green-bright rounded px-2 py-1">
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

                {/* Player name */}
                <h1 className="mb-2">
                  <span
                    className="block text-4xl lg:text-6xl uppercase font-semibold text-kcvv-gray-blue"
                    style={{
                      fontFamily:
                        "quasimoda, acumin-pro, Montserrat, sans-serif",
                      lineHeight: 1,
                    }}
                  >
                    {firstName}
                  </span>
                  <span
                    className="block text-4xl lg:text-6xl uppercase font-thin text-kcvv-gray-blue"
                    style={{
                      fontFamily:
                        "quasimoda, acumin-pro, Montserrat, sans-serif",
                      lineHeight: 1,
                    }}
                  >
                    {lastName}
                  </span>
                </h1>

                {/* Position and team */}
                <div className="flex flex-col sm:flex-row items-center lg:items-start gap-2 text-kcvv-gray-DEFAULT">
                  <span className="font-medium">{position}</span>
                  <span className="hidden sm:inline" aria-hidden="true">
                    •
                  </span>
                  <span>{teamName}</span>
                </div>
              </div>

              {/* Right side - Photo with jersey number */}
              <div className="relative order-1 lg:order-2">
                {/* Jersey number behind photo */}
                {number !== undefined && (
                  <div
                    className="absolute -left-4 lg:-left-8 top-0 z-0 select-none"
                    style={{
                      fontFamily: "stenciletta, sans-serif",
                      fontSize: "clamp(8rem, 20vw, 14rem)",
                      lineHeight: 0.71,
                      letterSpacing: "-6px",
                      color: "#4B9B48",
                      WebkitTextStroke: "4px #4B9B48",
                      WebkitTextFillColor: "white",
                      textShadow: JERSEY_NUMBER_SHADOW,
                      mixBlendMode: "darken",
                    }}
                    aria-hidden="true"
                  >
                    {number}
                  </div>
                )}

                {/* Player photo */}
                <div className="relative z-10 w-[280px] h-[350px] lg:w-[350px] lg:h-[440px]">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={fullName}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 1024px) 280px, 350px"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
                      <svg
                        className="w-24 h-24 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom gradient overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 z-20 pointer-events-none"
            style={{
              background: "linear-gradient(0deg, white 0%, transparent 100%)",
            }}
            aria-hidden="true"
          />
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          {/* Bio section */}
          <PlayerBio
            birthDate={birthDate}
            joinDate={joinDate}
            leaveDate={leaveDate}
            biography={biography}
          />

          {/* Stats section placeholder */}
          {/* TODO: Add PlayerStats component when Footbalisto integration is ready */}
        </section>
      </div>
    );
  },
);

PlayerProfile.displayName = "PlayerProfile";
