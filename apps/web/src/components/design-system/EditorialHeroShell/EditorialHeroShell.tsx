/**
 * <EditorialHeroShell> — 60/40 grid + 1px ink rule.
 *
 * The structural frame every <EditorialHero> variant fills. The grid
 * collapses to a single column below the `lg` breakpoint so narrow
 * viewports stack the cover artefact under the editorial column.
 *
 * Spec: PRD redesign-phase-3 §5.B.1.
 */
import type { ReactNode } from "react";

export interface EditorialHeroShellProps {
  /** Editorial column — kicker, headline, lead, byline. */
  editorial: ReactNode;
  /** Cover artefact column — TapedCard + TapedFigure composition. Optional. */
  cover?: ReactNode;
}

export function EditorialHeroShell({
  editorial,
  cover,
}: EditorialHeroShellProps) {
  return (
    <section className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-x-12 gap-y-8 pt-12 pb-6 lg:grid-cols-[60fr_40fr]">
      {/* `min-w-0` on each grid child stops a long unbreakable token in the
          headline (e.g. "doorzettingsvermogen") from blowing out the
          `60fr_40fr` ratio — default grid-item `min-width: auto` resolves to
          min-content and lets fr columns expand past their fraction.
          `hyphens-auto` then asks the browser to hyphenate the headline using
          the page's `lang="nl"` dictionary so long Dutch compound words split
          on syllable boundaries (door-zet-tings-ver-mo-gen) rather than
          overflowing the column. */}
      <div className="flex min-w-0 flex-col gap-3 hyphens-auto">
        {editorial}
      </div>
      {cover ? (
        <div className="flex min-w-0 items-start justify-center">{cover}</div>
      ) : null}
    </section>
  );
}
