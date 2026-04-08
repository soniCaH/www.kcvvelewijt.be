/**
 * PlayerCard Component
 *
 * Diagonal-cut player card for team rosters and player listings.
 *
 * The photo is clipped via CSS `clip-path` so the white card surface flows
 * up into the cut-away triangle, with a stenciletta-font jersey number
 * sitting on the diagonal seam. A green accent bar at the top of the card
 * scales from the center on hover.
 *
 * The card uses `flex h-full flex-col` so siblings inside a CSS Grid row
 * stay equal height regardless of name length.
 */

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface PlayerCardProps {
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
  /** Loading state */
  isLoading?: boolean;
  /** Optional extra classes on the card root */
  className?: string;
}

export function PlayerCard({
  firstName,
  lastName,
  position,
  href,
  number,
  imageUrl,
  isLoading = false,
  className,
}: PlayerCardProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-sm animate-pulse",
          className,
        )}
        aria-label="Laden..."
      >
        <div
          className="relative shrink-0 bg-gray-200"
          style={{ aspectRatio: "4 / 5" }}
        />
        <div className="flex-1 space-y-2 px-4 pb-5 pt-3">
          <div className="h-3 w-1/3 rounded bg-gray-200" />
          <div className="h-5 w-3/4 rounded bg-gray-200" />
          <div className="h-5 w-1/2 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const numberText = number !== undefined ? String(number) : null;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-sm bg-white text-inherit no-underline shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-hover",
        className,
      )}
      title={`${position} - ${fullName}`}
      aria-label={`Bekijk profiel van ${fullName}, ${position}${
        numberText !== null ? `, nummer ${numberText}` : ""
      }`}
    >
      {/* Green hover top-accent bar — scales from center */}
      <div
        data-testid="player-hover-accent"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] origin-center scale-x-0 bg-kcvv-green-bright transition-transform duration-300 ease-out group-hover:scale-x-100"
        aria-hidden="true"
      />

      {/* Photo wrapper — diagonal clip-path on the inner div lets the
          parent's white background bleed into the cut-away triangle. */}
      <div
        data-testid="player-photo-wrapper"
        className="relative shrink-0"
        style={{ aspectRatio: "4 / 5" }}
      >
        <div
          data-testid="player-photo-clip"
          className="absolute inset-0 bg-gray-100"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 86%, 0 100%)" }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={fullName}
              fill
              className="object-cover object-top"
              sizes="(min-width: 1280px) 240px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-end justify-center text-gray-300"
              aria-hidden="true"
            >
              <svg
                className="h-[60%] w-auto"
                fill="currentColor"
                viewBox="0 0 24 32"
              >
                <path d="M12 0C8.7 0 6 2.7 6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 14c-6.6 0-12 3.4-12 8v10h24V22c0-4.6-5.4-8-12-8z" />
              </svg>
            </div>
          )}
        </div>

        {/* Stencil number sitting on the diagonal seam */}
        {numberText !== null && (
          <div
            data-testid="player-number"
            className="pointer-events-none absolute right-3 z-10 select-none font-black leading-none text-kcvv-green-bright"
            style={{
              bottom: "-1rem",
              fontFamily: "stenciletta, sans-serif",
              fontSize: numberText.length > 2 ? "3rem" : "5.5rem",
              WebkitTextStroke: "2px white",
            }}
            aria-hidden="true"
          >
            {numberText}
          </div>
        )}
      </div>

      {/* Name section */}
      <div className="flex-1 px-4 pb-5 pt-3">
        <div className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-kcvv-green-dark">
          {position}
        </div>
        <h3 className="mt-1 font-title text-lg uppercase leading-tight text-kcvv-black">
          <span className="font-semibold">{firstName}</span>
          <br />
          <span className="font-thin">{lastName}</span>
        </h3>
      </div>
    </Link>
  );
}
