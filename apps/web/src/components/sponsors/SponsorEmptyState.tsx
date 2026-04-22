/**
 * SponsorEmptyState Component
 * Displayed when no sponsors are available
 */

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface SponsorEmptyStateProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SponsorEmptyState = ({ className }: SponsorEmptyStateProps) => {
  return (
    <div className={cn("px-6 py-16 text-center", className)}>
      {/* Illustration */}
      <div className="mx-auto mb-8 max-w-md">
        <div className="relative mx-auto h-64 w-64">
          {/* Football field illustration using emoji and shapes */}
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-200">
            <div className="text-center">
              <div className="mb-4 text-8xl opacity-30">⚽</div>
              <div className="flex justify-center gap-8 opacity-20">
                <div className="h-16 w-16 rounded border-4 border-gray-400" />
                <div className="h-16 w-16 rounded border-4 border-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      <h3 className="text-kcvv-gray-blue mb-4 text-2xl font-bold">
        Nog geen sponsors beschikbaar
      </h3>
      <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
        We zijn op zoek naar partners die onze club willen steunen. Word één van
        de eerste sponsors en versterk uw zichtbaarheid in de regio!
      </p>

      {/* CTA Button */}
      <Link
        href="/contact"
        className="bg-kcvv-green-bright hover:bg-kcvv-green inline-flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        Word sponsor
      </Link>
    </div>
  );
};
