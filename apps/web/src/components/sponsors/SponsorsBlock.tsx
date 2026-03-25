/**
 * SponsorsBlock Server Component
 * Fetches and displays sponsors from Sanity CMS
 */

import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SponsorRepository } from "@/lib/repositories/sponsor.repository";
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
      const repo = yield* SponsorRepository;
      const all = yield* repo.findAll();
      return all
        .filter(
          (s) =>
            s.tier === "hoofdsponsor" ||
            s.tier === "sponsor" ||
            // Backward compat: include legacy types until all sponsors are re-tagged
            (!s.tier &&
              s.type &&
              ["crossing", "green", "white"].includes(s.type)),
        )
        .map(
          (s): Sponsor => ({
            id: s.id,
            name: s.name,
            logo: s.logoUrl ?? "/images/placeholder-sponsor.png",
            url: s.url,
            tier: s.tier,
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
