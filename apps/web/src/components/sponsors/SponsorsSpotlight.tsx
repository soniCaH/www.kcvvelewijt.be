/**
 * SponsorsSpotlight Component
 * Featured sponsor carousel showcasing key partners
 */

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatSponsorAlt } from "./formatSponsorAlt";

export interface SpotlightSponsor {
  id: string;
  name: string;
  logo: string;
  url?: string;
  description?: string;
}

export interface SponsorsSpotlightProps {
  /**
   * Featured sponsors to display
   */
  sponsors: SpotlightSponsor[];
  /**
   * Auto-rotate interval in milliseconds (0 to disable)
   */
  autoRotateInterval?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SponsorsSpotlight = ({
  sponsors,
  autoRotateInterval = 5000,
  className,
}: SponsorsSpotlightProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (autoRotateInterval === 0 || sponsors.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % sponsors.length);
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [autoRotateInterval, sponsors.length]);

  if (sponsors.length === 0) {
    return null;
  }

  const activeSponsor = sponsors[activeIndex];

  return (
    <div className={cn("bg-kcvv-green-dark px-6 py-12 text-white", className)}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">In de kijker</h2>
          <p className="text-white/70">Onze featured partners</p>
        </div>

        <div className="relative">
          <div className="rounded-lg bg-white/10 p-8 backdrop-blur-sm md:p-12">
            <div className="flex flex-col items-center gap-8 md:flex-row">
              {/* Logo */}
              <div className="relative h-48 w-64 flex-shrink-0">
                <Image
                  src={activeSponsor.logo}
                  alt={formatSponsorAlt(activeSponsor.name)}
                  fill
                  className="object-contain"
                  sizes="256px"
                />
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="mb-4 text-3xl font-bold text-white">
                  {activeSponsor.name}
                </h3>
                {activeSponsor.description && (
                  <p className="mb-6 text-lg text-white/80">
                    {activeSponsor.description}
                  </p>
                )}
                {activeSponsor.url && (
                  <Link
                    href={activeSponsor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-kcvv-green-dark inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold transition-colors hover:bg-gray-100"
                  >
                    Bezoek website
                    <svg
                      className="h-5 w-5"
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
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Navigation dots */}
          {sponsors.length > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {sponsors.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-3 w-3 rounded-full transition-all",
                    index === activeIndex
                      ? "w-8 bg-white"
                      : "bg-white/30 hover:bg-white/50",
                  )}
                  aria-label={`Ga naar sponsor ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
