/**
 * Sponsors Component
 * Displays sponsor logos in a grid with hover effects
 * Can be used on homepage and in PageFooter
 */

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { SponsorGrid } from "./SponsorGrid/SponsorGrid";

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  url?: string;
}

export interface SponsorsProps {
  /**
   * Array of sponsors to display
   */
  sponsors: Sponsor[];
  /**
   * Title for the sponsors section
   * @default "Onze sponsors"
   */
  title?: string;
  /**
   * Description text below title
   * @default "KCVV Elewijt wordt mede mogelijk gemaakt door onze trouwe sponsors."
   */
  description?: string;
  /**
   * Show "View All" link
   * @default true
   */
  showViewAll?: boolean;
  /**
   * URL for "View All" link
   * @default "/sponsors"
   */
  viewAllHref?: string;
  /**
   * Number of columns in grid
   * @default 4
   */
  columns?: 2 | 3 | 4 | 5 | 6;
  /**
   * Theme variant
   * @default "light"
   */
  variant?: "light" | "dark";
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const Sponsors = ({
  sponsors,
  title = "Onze sponsors",
  description = "KCVV Elewijt wordt mede mogelijk gemaakt door onze trouwe sponsors.",
  showViewAll = true,
  viewAllHref = "/sponsors",
  columns = 4,
  variant = "light",
  className,
}: SponsorsProps) => {
  if (sponsors.length === 0) {
    return null;
  }

  const textColorClass = variant === "dark" ? "text-white" : "text-gray-900";
  const descriptionColorClass =
    variant === "dark" ? "text-white/80" : "text-gray-600";

  return (
    <section className={cn("py-8", className)}>
      {/* Section Header */}
      <div className="mb-6">
        <h3 className={cn("text-xl font-bold mb-2", textColorClass)}>
          {title}
        </h3>
        {description && (
          <p className={cn("text-sm opacity-80", descriptionColorClass)}>
            {description}
          </p>
        )}
      </div>

      {/* Sponsors Grid — delegated to SponsorGrid */}
      <SponsorGrid sponsors={sponsors} columns={columns} variant={variant} />

      {/* View All Link */}
      {showViewAll && (
        <Link
          href={viewAllHref}
          className={cn(
            "inline-block mt-6 text-sm hover:underline",
            variant === "dark"
              ? "text-kcvv-green-bright"
              : "text-kcvv-green-dark",
          )}
        >
          Alle sponsors &raquo;
        </Link>
      )}
    </section>
  );
};
