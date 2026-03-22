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
    <div className={cn("text-center py-16 px-6", className)}>
      {/* Illustration */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative w-64 h-64 mx-auto">
          {/* Football field illustration using emoji and shapes */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-4 opacity-30">⚽</div>
              <div className="flex justify-center gap-8 opacity-20">
                <div className="w-16 h-16 border-4 border-gray-400 rounded" />
                <div className="w-16 h-16 border-4 border-gray-400 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      <h3 className="text-2xl font-bold text-kcvv-gray-blue mb-4">
        Nog geen sponsors beschikbaar
      </h3>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        We zijn op zoek naar partners die onze club willen steunen. Word één van
        de eerste sponsors en versterk uw zichtbaarheid in de regio!
      </p>

      {/* CTA Button */}
      <Link
        href="/contact"
        className="inline-flex items-center gap-2 px-8 py-4 bg-kcvv-green-bright text-white rounded-lg font-semibold text-lg hover:bg-kcvv-green transition-colors shadow-lg"
      >
        <svg
          className="w-6 h-6"
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
