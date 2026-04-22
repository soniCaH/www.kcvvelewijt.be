/**
 * SponsorCallToAction Component
 * Minimal dark CTA encouraging businesses to become sponsors
 */

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ArrowRight } from "@/lib/icons";

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
    <div className={cn("px-6 py-16 text-white", className)}>
      <div className="max-w-inner mx-auto text-center">
        <h2 className="font-title mb-4 text-5xl font-extrabold text-white uppercase">
          Word sponsor
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-white/70">
          Steun onze club en word partner van KCVV Elewijt.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="mailto:sponsoring@kcvvelewijt.be"
            className="group text-kcvv-black inline-flex items-center justify-center gap-2 rounded bg-white px-8 py-3 text-base font-medium transition-all duration-300 hover:bg-gray-200"
          >
            Contact opnemen
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>
          <Link
            href="/contact"
            className="group inline-flex items-center justify-center gap-2 rounded border-2 border-white px-8 py-3 text-base font-medium text-white transition-all duration-300 hover:bg-white/10"
          >
            Meer informatie
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};
