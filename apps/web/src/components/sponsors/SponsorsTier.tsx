/**
 * SponsorsTier Component
 * Displays a single tier of sponsors (gold/silver/bronze) with title and grid
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { Sponsor } from "./Sponsors";

export type { Sponsor };
export type SponsorTier = "gold" | "silver" | "bronze";

export interface SponsorsTierProps {
  /**
   * Tier level for styling
   */
  tier: SponsorTier;
  /**
   * Section title
   */
  title: string;
  /**
   * Sponsors to display
   */
  sponsors: Omit<Sponsor, "tier">[];
  /**
   * Show sponsor names below logos (default: true)
   */
  showNames?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Tier-specific grid column configuration and styling
 * Gold (crossing): Larger logos, fewer columns, gold accent
 * Silver (green/white): Medium logos, silver accent
 * Bronze (training/panel/other): Smaller logos, more columns, bronze accent
 */
const tierConfig: Record<
  SponsorTier,
  { columns: string; imageSize: number; badgeColor: string; badgeIcon: string }
> = {
  gold: {
    columns: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    imageSize: 280,
    badgeColor: "bg-gradient-to-r from-yellow-400 to-yellow-600",
    badgeIcon: "⭐",
  },
  silver: {
    columns: "grid-cols-2 md:grid-cols-4 lg:grid-cols-5",
    imageSize: 200,
    badgeColor: "bg-gradient-to-r from-gray-300 to-gray-500",
    badgeIcon: "🥈",
  },
  bronze: {
    columns: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
    imageSize: 160,
    badgeColor: "bg-gradient-to-r from-orange-400 to-orange-600",
    badgeIcon: "🥉",
  },
};

export const SponsorsTier = ({
  tier,
  title,
  sponsors,
  showNames = true,
  className,
}: SponsorsTierProps) => {
  const config = tierConfig[tier];

  if (sponsors.length === 0) {
    return null;
  }

  return (
    <section className={cn("mb-12", className)}>
      <div className="flex items-center gap-3 mb-6">
        <span
          className={cn(
            "inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-xl font-bold shadow-lg",
            config.badgeColor,
          )}
        >
          {config.badgeIcon}
        </span>
        <h2 className="text-2xl font-bold text-kcvv-gray-blue">{title}</h2>
      </div>
      <div className={cn("grid gap-6", config.columns)}>
        {sponsors.map((sponsor, index) => {
          const content = (
            <div className="group">
              <div
                className={cn(
                  "relative bg-white rounded border border-gray-200 p-4",
                  "flex items-center justify-center aspect-[3/2]",
                  "transition-all duration-300 ease-out",
                  "hover:shadow-xl hover:scale-105 hover:-translate-y-1",
                  "animate-in fade-in slide-in-from-bottom-4",
                  "overflow-hidden",
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  width={config.imageSize}
                  height={config.imageSize * (2 / 3)}
                  className="object-contain max-w-full max-h-full"
                />
                {sponsor.url && (
                  <div className="absolute inset-0 bg-kcvv-green-bright/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white font-semibold text-center px-4">
                      Bezoek website
                      <svg
                        className="w-5 h-5 mx-auto mt-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
              {showNames && (
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-kcvv-green-bright transition-colors">
                    {sponsor.name}
                  </p>
                </div>
              )}
            </div>
          );

          if (sponsor.url) {
            return (
              <Link
                key={sponsor.id}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                aria-label={`Bezoek website van ${sponsor.name}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={sponsor.id} aria-label={sponsor.name}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
};
