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
    <div className={cn("text-white py-16 px-6", className)}>
      <div className="max-w-[40rem] mx-auto text-center">
        <h2
          className="font-title font-extrabold uppercase text-white mb-4"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
        >
          Word sponsor
        </h2>
        <p className="text-sm text-white/70 mb-8 leading-relaxed">
          Steun onze club en word partner van KCVV Elewijt.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="mailto:sponsoring@kcvvelewijt.be"
            className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-kcvv-black rounded font-medium text-base hover:bg-gray-200 transition-all duration-300"
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
            className="group inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-white text-white rounded font-medium text-base hover:bg-white/10 transition-all duration-300"
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
