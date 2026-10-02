import type { ReactNode } from "react";

export interface PersonCardRunProps {
  /**
   * The run's own word — becomes both the section's accessible name
   * (`aria-label`) and its visible mono-caps heading text (with
   * `hideHeading`, neither: see there). Required: a
   * shared structural primitive must never bake a role word (e.g. "Staf")
   * into itself — the caller who knows what the run actually contains
   * supplies it (#2575 review). `<SquadGrid>` passes a position-group
   * label ("Doelmannen", …); `<TeamStaff>`'s callers pass whatever word
   * fits their page ("Staf" on the team page, "De leden" on a board page).
   */
  label: string;
  children: ReactNode;
  /** Forwarded to the card-grid element, for a caller that needs to query it directly. */
  "data-testid"?: string;
  /**
   * Suppress the visible `<h3>` heading (#2638) AND the section's
   * `aria-label` (#3334). `<SquadGrid>`'s single-group gate: a heading that
   * separates nobody from the group next to it is the same lie as a label
   * that classifies nobody — there is no group next to it to separate
   * from. Every caller that sets this already has a display heading or a
   * named section directly around the run (the team page's `#spelers` /
   * `#staf` `<PageContainer ariaLabel>`, `<BestuurPage>`'s `<SectionHeader>`),
   * so a second same-named region would be listed twice by a screen reader.
   * Default `false`: a run that sits next to a sibling keeps both.
   */
  hideHeading?: boolean;
}

/**
 * `<RunLabel>` — the one run-label treatment (#3305 rule 2): an `<h3>`, mono,
 * uppercase, `text-ink-muted`, the `text-label` step (its own tracking,
 * #2663) and a `border-paper-edge` hairline below. It is a sub-heading: the
 * host section must put an `<h2>` above it (axe `heading-order`). Exported so
 * a card run outside this module (`<SponsorTiers>`' Hoofdsponsors) renders the
 * same heading instead of a lookalike (#3334).
 */
export function RunLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-ink-muted border-paper-edge text-label mb-3 border-b pb-1.5 font-mono uppercase">
      {children}
    </h3>
  );
}

/**
 * `<PersonCardRun>` — one labelled run of person cards: a mono-caps
 * heading (also the run's `aria-label`) over `<SquadGrid>`'s canonical
 * `auto-fill` grid track.
 *
 * Extracted from `<SquadGrid>` and `<TeamStaff>` (#2575 review), which had
 * landed on byte-identical section/heading/grid markup independently —
 * "One grid" (#2477) was two string literals kept in sync by hand, so
 * editing one silently reintroduced the column-count break the ticket
 * exists to close. This is now the one place the grid track lives;
 * `minmax(140px,1fr)` never appears a second time in either caller.
 */
export function PersonCardRun({
  label,
  children,
  "data-testid": dataTestId,
  hideHeading = false,
}: PersonCardRunProps) {
  return (
    <section aria-label={hideHeading ? undefined : label}>
      {hideHeading ? null : <RunLabel>{label}</RunLabel>}
      <div
        data-testid={dataTestId}
        className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4"
      >
        {children}
      </div>
    </section>
  );
}
