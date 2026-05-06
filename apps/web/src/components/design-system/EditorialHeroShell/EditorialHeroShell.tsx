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
    <section className="border-ink mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-x-12 gap-y-8 border-b py-12 lg:grid-cols-[60fr_40fr]">
      <div className="flex flex-col gap-3">{editorial}</div>
      {cover !== undefined ? (
        <div className="flex items-start justify-center">{cover}</div>
      ) : null}
    </section>
  );
}
