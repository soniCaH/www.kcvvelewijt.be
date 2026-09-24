import type { ReactNode } from "react";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";

/**
 * A cream editorial body section for `/club/ultras` — `<MonoLabel>` kicker +
 * `<EditorialHeading>` (replaces the legacy green-left-border `h2`). The body
 * is a vertical flow that spaces prose paragraphs and embedded blocks
 * (`<TapedFigure>`, `<PullQuote>`, the raffle callout) evenly.
 */
export interface UltrasSectionProps {
  id?: string;
  kicker: string;
  heading: string;
  /**
   * Substring of `heading` to render in the jersey-deep accent. The redesign
   * idiom `accent="."` colours just the trailing period (`EditorialHeading`
   * auto-appends one, then accents it) — the same period-accent used on the
   * `/ploegen` and `/club/geschiedenis` headings. Only pass a `.` for headings
   * that don't already contain one.
   */
  accent?: string;
  children: ReactNode;
}

export function UltrasSection({
  id,
  kicker,
  heading,
  accent,
  children,
}: UltrasSectionProps) {
  return (
    <section id={id} className="mt-14 first:mt-0">
      <header className="mb-5 flex flex-col gap-2">
        <span>
          <MonoLabel variant="plain">{kicker}</MonoLabel>
        </span>
        <EditorialHeading
          level={2}
          size="display-md"
          emphasis={accent ? { text: accent } : undefined}
          className="mb-0"
        >
          {heading}
        </EditorialHeading>
      </header>
      {/* #2436: only <p> children clamp to the prose token — the embedded
          TapedFigure / PullQuote blocks keep the container's full width.
          #2552 rule 3: no gap or space-y utilities over prose — a paragraph
          owns the air below itself (globals.css). Plain block flow instead
          of a flex column so adjacent margins collapse: a non-paragraph
          embed (TapedFigure, PullQuote, RaffleCallout — none carry their
          own margin) gets an explicit my-6, which collapses against a
          neighbouring paragraph's mb-4 to one 24px gap either side, rather
          than compounding with it or, if the gap utility were simply
          deleted, touching it outright. */}
      <div className="text-body-md text-ink leading-relaxed [&_strong]:font-semibold [&>:not(p)]:my-6 [&>p]:max-w-[var(--container-prose)]">
        {children}
      </div>
    </section>
  );
}
