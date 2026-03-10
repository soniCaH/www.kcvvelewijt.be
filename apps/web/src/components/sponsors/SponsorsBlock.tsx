/**
 * SponsorsBlock Server Component
 * Fetches and displays sponsors from Sanity CMS
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { Sponsors, type Sponsor } from "./Sponsors";

export interface SponsorsBlockProps {
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
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Fetches sponsors of types "crossing", "green", and "white" from the CMS and renders the Sponsors component with the resulting list.
 *
 * The function falls back to an empty sponsor list on error and forwards received display props (title, description, columns, variant, showViewAll, viewAllHref, className) to the rendered Sponsors component.
 *
 * @returns A JSX element rendering the Sponsors component populated with the fetched sponsor list
 */
export async function SponsorsBlock({
  title = "Onze sponsors",
  description = "KCVV Elewijt wordt mede mogelijk gemaakt door onze trouwe sponsors.",
  columns = 4,
  variant = "light",
  showViewAll = true,
  viewAllHref = "/sponsors",
  className,
}: SponsorsBlockProps) {
  const sponsors = await runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      const all = yield* sanity.getSponsors();
      return all
        .filter((s) => ["crossing", "green", "white"].includes(s.type))
        .map(
          (s): Sponsor => ({
            id: s._id,
            name: s.name,
            logo: s.logoUrl ?? "/images/placeholder-sponsor.png",
            url: s.url ?? undefined,
          }),
        );
    }).pipe(
      Effect.catchAll((error) => {
        console.error("[SponsorsBlock] Failed to fetch sponsors:", error);
        return Effect.succeed([]);
      }),
    ),
  );

  return (
    <Sponsors
      sponsors={sponsors}
      title={title}
      description={description}
      columns={columns}
      variant={variant}
      showViewAll={showViewAll}
      viewAllHref={viewAllHref}
      className={className}
    />
  );
}
