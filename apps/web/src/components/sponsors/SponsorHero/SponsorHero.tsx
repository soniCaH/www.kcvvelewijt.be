import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { FeaturedSponsorCard } from "../FeaturedSponsorCard";
import type { Sponsor } from "../Sponsors";

export interface SponsorHeroProps {
  /**
   * The sponsor to feature in the "In de kijker" marquee, or `null` to collapse
   * the hero to a full-width headline (0-featured — see `selectFeaturedSponsor`).
   */
  featured: Sponsor | null;
}

/**
 * <SponsorHero> — the `/sponsors` split hero (7.d2 lock).
 *
 * Left column: MonoLabel kicker + `<EditorialHeading>` "Merci aan onze
 * sponsors." (jersey-deep period) + italic-display lead. Right column: the
 * single `<FeaturedSponsorCard>` marquee. When `featured` is `null` the left
 * column spans the full width and no card renders.
 */
export function SponsorHero({ featured }: SponsorHeroProps) {
  return (
    <header
      className={cn(
        "mb-10 grid items-start gap-8 sm:mb-12",
        featured
          ? "lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-12"
          : "grid-cols-1",
      )}
    >
      {/* Block flow: the lead sits directly under the heading. `mb-0` on the
          heading cancels the global `h1 { margin-bottom: 1em }` base rule (≈96px
          at this font size) so the gap is the lead's own `mt-6`, not the
          inherited heading margin. The display-2xl heading makes the left
          column taller than the marquee card, so the columns are top-aligned. */}
      <div>
        <span className="mb-4 block">
          <MonoLabel variant="plain">
            Er is maar één plezante compagnie
          </MonoLabel>
        </span>
        <EditorialHeading
          level={1}
          size="display-2xl"
          emphasis={{ text: "." }}
          className="mb-0"
        >
          Merci aan onze sponsors
        </EditorialHeading>
        <p className="font-display text-ink-muted mt-6 text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] italic">
          Samen met hen blijven we de plezantste compagnie.
        </p>
      </div>

      {featured && <FeaturedSponsorCard sponsor={featured} />}
    </header>
  );
}
