/**
 * SponsorCallToAction Component
 * Minimal dark CTA encouraging businesses to become sponsors
 */

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface SponsorCallToActionProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const SponsorCallToAction = ({
  className,
}: SponsorCallToActionProps) => {
  return (
    <div className={cn("bg-kcvv-green-dark text-white py-16 px-6", className)}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Word sponsor</h2>
        <p className="text-lg md:text-xl mb-10 text-white/80">
          Steun onze club en word partner van KCVV Elewijt.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="mailto:sponsoring@kcvvelewijt.be"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-kcvv-green-dark rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Contact opnemen
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
          >
            Meer informatie
          </Link>
        </div>
      </div>
    </div>
  );
};
