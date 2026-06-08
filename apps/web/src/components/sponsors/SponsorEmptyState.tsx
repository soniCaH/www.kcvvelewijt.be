/**
 * SponsorEmptyState — the `/sponsors` 0-sponsors-total body (7.d4 §4).
 *
 * A gracious cream message that sits between the headline-only hero and the
 * `<SponsorCtaBand>` when there are no sponsors yet — no empty grids or tier
 * labels. The "Word sponsor" action lives in the band below, so this block is
 * message-only.
 */

import { cn } from "@/lib/utils/cn";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";

export interface SponsorEmptyStateProps {
  /** Additional CSS classes */
  className?: string;
}

export const SponsorEmptyState = ({ className }: SponsorEmptyStateProps) => {
  return (
    <div className={cn("py-12 text-center sm:py-16", className)}>
      <EditorialHeading
        level={2}
        size="display-md"
        emphasis={{ text: "." }}
        className="mb-3"
      >
        Nog geen sponsors
      </EditorialHeading>
      <p className="font-display text-ink-muted mx-auto max-w-xl text-lg leading-snug italic">
        We zoeken partners die mee de plezantste compagnie willen dragen — jouw
        zaak kan de eerste langs de lijn zijn.
      </p>
    </div>
  );
};
