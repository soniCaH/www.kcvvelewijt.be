import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { PageContainer } from "@/components/design-system/PageContainer";
import { TapedCard } from "@/components/design-system/TapedCard";
import { TapedFigure } from "@/components/design-system/TapedFigure";

/**
 * Presentational primitives for the `/club/geschiedenis` chronicle, reskinned
 * to the retro-terrace-fanzine vocabulary (design contract
 * `docs/design/mockups/phase-7-geschiedenis/7g1-timeline-treatment-locked.md`,
 * panel T1 — "alternating + seam").
 *
 * These are pure/server-renderable; the page-view event lives in
 * `<HistoryContent>` via `<PageViewTracker>`. Content stays hardcoded in
 * `<HistoryContent>` — this file owns the visual treatment only.
 */

/**
 * Heritage sibling hero — kicker + display headline + italic lead, composed
 * from design-system primitives on the cream page surface (no
 * `<InteriorPageHero>` / `<EditorialHero>`). Mirrors the `/ploegen` page header.
 */
export function HeritageHero() {
  return (
    <PageContainer as="header" className="flex flex-col gap-3 pt-10 sm:pt-14">
      <span>
        <MonoLabel variant="plain">De club · sinds 1909</MonoLabel>
      </span>
      <EditorialHeading
        level={1}
        size="display-2xl"
        emphasis={{ text: "." }}
        className="mb-0"
      >
        Meer dan een eeuw
      </EditorialHeading>
      <p className="font-display text-ink-muted text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] italic">
        Van de Jonge Footbalclub in 1909 tot het nationale voetbal vandaag — de
        rijke geschiedenis van één plezante compagnie.
      </p>
    </PageContainer>
  );
}

/**
 * A vertical run of timeline items. Renders the decorative dashed-ink centre
 * line (replaces the legacy `kcvv-green-bright` rule); the cards carry the
 * semantic order, so the line is `aria-hidden`.
 */
export function TimelineSection({ children }: { children: ReactNode }) {
  return (
    <div className="relative py-4">
      <div
        className="border-ink/50 pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-px border-l-2 border-dashed md:block"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

/**
 * A single dated card on one side of the centre line, with a `jersey-deep`
 * node marker (border-2 ink) punched through the line. Mobile collapses to a
 * single full-width column (preserves the legacy behaviour).
 */
export function TimelineItem({
  date,
  children,
  side = "left",
}: {
  date?: string;
  children: ReactNode;
  side?: "left" | "right";
}) {
  // The card lives on one side; the opposite column renders as an invisible
  // md spacer so the alternating two-sided layout stays balanced. Defining the
  // card once keeps the two columns from drifting apart.
  const card = <TimelineCard date={date}>{children}</TimelineCard>;
  return (
    <div
      data-timeline-item
      data-side={side}
      className="relative mb-10 md:flex md:items-start md:justify-between"
    >
      <div
        data-timeline-card
        className={cn(
          "w-full md:w-[45%]",
          side === "right" && "hidden md:invisible md:block",
        )}
      >
        {side === "left" && card}
      </div>

      {/* Node marker — decorative; cream ring masks the dashed line behind it.
          HIST-1: stays anchored and colours in (see globals.css timeline rules). */}
      <div
        data-timeline-bullet
        className="bg-jersey-deep border-ink absolute top-2 left-1/2 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 shadow-[0_0_0_4px_var(--color-cream)] md:block"
        aria-hidden="true"
      />

      <div
        data-timeline-card
        className={cn(
          "w-full md:w-[45%]",
          side === "left" && "hidden md:invisible md:block",
        )}
      >
        {side === "right" && card}
      </div>
    </div>
  );
}

/**
 * The paper card itself — `<TapedCard>` (cream-soft, border-2 ink, paper
 * shadow). The date / era label renders as a `<MonoLabel>` ink chip (era names
 * and years both render as chips, per the data).
 */
export function TimelineCard({
  date,
  children,
}: {
  date?: string;
  children: ReactNode;
}) {
  return (
    <TapedCard bg="cream-soft" shadow="md" padding="md">
      {date && (
        <div className="mb-3">
          <MonoLabel variant="pill-ink" size="sm">
            {date}
          </MonoLabel>
        </div>
      )}
      <div className="text-body-sm leading-relaxed">{children}</div>
    </TapedCard>
  );
}

/**
 * A full-width historical photograph — `<TapedFigure>` (newsprint tint, warm
 * tape strip) with an italic caption. The caller supplies the image node
 * (next/image in the page, a deterministic placeholder in stories), matching
 * the `<TapedFigure>` contract.
 *
 * `<TapedFigure>`'s native `caption` prop only accepts a `string`, but these
 * archival captions are rich nodes (bold "Figuur N" label + `<br>` + roster
 * lines). So the figure is wrapped in an outer `<figure>` that owns the
 * `<figcaption>`, keeping the caption programmatically tied to the image.
 */
export function TimelineImage({
  children,
  caption,
  rotation = "a",
}: {
  children: ReactNode;
  caption: ReactNode;
  rotation?: "a" | "b" | "none";
}) {
  return (
    <figure data-timeline-item className="mx-auto my-12 max-w-2xl">
      <TapedFigure
        aspect="landscape-16-9"
        bg="cream"
        tint="newsprint"
        rotation={rotation}
        tape={{ color: "warm", length: "sm", position: "left", rotation: "a" }}
      >
        {children}
      </TapedFigure>
      <figcaption className="text-body-sm text-ink-soft mt-3 px-1 text-center italic">
        {caption}
      </figcaption>
    </figure>
  );
}
