/**
 * StaffCard Component
 *
 * Diagonal-cut card for technical staff (trainers, delegates, etc.) — the
 * staff equivalent of `PlayerCard`. Same diagonal `clip-path` photo, same
 * stencil-font seam badge, but uses the navy `kcvv-gray-blue` accent color
 * and shows the abbreviated function title in the badge instead of a
 * jersey number.
 *
 * Staff members do not have a profile route in the public site, so the
 * card is rendered as a non-interactive `<article>` (no `<a>` wrapper).
 */

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface StaffCardProps {
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Editorial role label (e.g., "Hoofdtrainer", "Afgevaardigde") */
  role: string;
  /** PSD function title shown in the seam badge (e.g., "T1", "TVJO") */
  functionTitle?: string;
  /** Photo URL */
  imageUrl?: string;
  /** Optional extra classes on the card root */
  className?: string;
}

/**
 * Abbreviate a PSD function title to fit inside the seam badge.
 * Short codes (≤4 chars, e.g. "T1", "TVJO") pass through unchanged.
 * Longer titles are reduced to uppercase initials of word boundaries.
 */
function abbreviateFunctionTitle(title: string): string {
  if (title.length <= 4) return title;
  const expanded = title.replace(/([a-z])([A-Z])/g, "$1 $2");
  const words = expanded.split(/[\s-]+/).filter(Boolean);
  if (words.length > 1) {
    return words.map((w) => w[0]!.toUpperCase()).join("");
  }
  return title.slice(0, 4).toUpperCase();
}

export function StaffCard({
  firstName,
  lastName,
  role,
  functionTitle,
  imageUrl,
  className,
}: StaffCardProps) {
  const fullName = `${firstName} ${lastName}`.trim();
  const badge = functionTitle ? abbreviateFunctionTitle(functionTitle) : null;

  return (
    <article
      className={cn(
        "staff-card group relative flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-hover",
        className,
      )}
      title={fullName}
    >
      {/* Hover top accent bar */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] origin-center scale-x-0 bg-kcvv-green-bright transition-transform duration-300 ease-out group-hover:scale-x-100"
        aria-hidden="true"
      />

      {/* Photo wrapper with diagonal clip */}
      <div className="relative shrink-0" style={{ aspectRatio: "4 / 5" }}>
        <div
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

        {badge && (
          <div
            className="pointer-events-none absolute right-3 z-10 select-none font-black leading-none text-kcvv-gray-blue"
            style={{
              bottom: "-1rem",
              fontFamily: "stenciletta, sans-serif",
              fontSize: badge.length > 2 ? "3rem" : "5.5rem",
              WebkitTextStroke: "2px white",
            }}
            aria-hidden="true"
          >
            {badge}
          </div>
        )}
      </div>

      {/* Name section */}
      <div className="flex-1 px-4 pb-5 pt-3">
        <div className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-kcvv-gray-blue">
          {role}
        </div>
        <h3 className="mt-1 font-title text-lg uppercase leading-tight text-kcvv-black">
          <span className="font-semibold">{firstName}</span>
          <br />
          <span className="font-thin">{lastName}</span>
        </h3>
      </div>
    </article>
  );
}
