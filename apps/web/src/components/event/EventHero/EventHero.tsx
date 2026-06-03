import type { ReactNode } from "react";
import {
  EditorialHeading,
  MonoLabel,
  TapedFigure,
} from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { parseEventDateTime } from "@/lib/utils/event-datetime";
import {
  accentLastWord,
  buildEventHeroKicker,
} from "@/lib/utils/event-hero-format";
import { DEFAULT_EVENT_TYPE, type EventType } from "../event-type-style";

export interface EventHeroProps {
  /** Event title — the centred display-serif headline (last word accented). */
  title: string;
  /**
   * Event category — drives the jersey-deep pill label. A missing / `null`
   * value renders as "Andere" (PRD §7 render-time fallback).
   */
  eventType?: EventType | null;
  /** ISO datetime of the event start; drives the mono date kicker. */
  dateStart: string;
  /** ISO datetime of the event end; when on a later day, the kicker shows a range. */
  dateEnd?: string | null;
  /** Where the event happens; shown in the mono line under the title. */
  location?: string | null;
  /**
   * The cover image element (e.g. `next/image`). When present it is wrapped in
   * a tilted + taped `<TapedFigure>` below the CTAs; omitted for the common
   * no-cover event. Passed as a slot so the component stays server-renderable
   * and Storybook/VR stay deterministic (no network image).
   */
  cover?: ReactNode;
  /**
   * Centred CTA row — the client `<EventDetailCtas>` island on the live page.
   * A slot keeps the hero itself free of analytics / download side effects.
   */
  ctas?: ReactNode;
}

const MONO_META_CLASS =
  "font-mono text-[length:var(--text-label)] tracking-[var(--text-label--tracking)] text-ink-muted uppercase";

/**
 * Editorial detail hero for `/evenementen/[slug]` (design lock 6e5 — variant D
 * "Editoriaal"). A calm, centred, cream-page counterpoint to the dark ticket-
 * wall list: jersey-deep `eventType` pill → mono date/location kicker →
 * display-serif title with a last-word italic jersey-deep accent → mono
 * location line → centred CTAs → an optional tilted + taped cover figure.
 *
 * NOT a variant of `<EditorialHero>` (lock §6). Composes the locked primitives
 * (`MonoLabel`, `EditorialHeading`, `TapedFigure`).
 */
export function EventHero({
  title,
  eventType,
  dateStart,
  dateEnd,
  location,
  cover,
  ctas,
}: EventHeroProps) {
  const type = eventType ?? DEFAULT_EVENT_TYPE;
  const start = parseEventDateTime(dateStart);
  const end = dateEnd ? parseEventDateTime(dateEnd) : null;
  const kicker = buildEventHeroKicker(start, end);
  const accent = accentLastWord(title);
  const trimmedLocation = location?.trim();

  return (
    <article className="mx-auto max-w-[680px] px-4 text-center">
      <MonoLabel variant="pill-jersey-deep" size="sm">
        {type}
      </MonoLabel>

      {kicker && <p className={cn(MONO_META_CLASS, "mt-3.5")}>{kicker}</p>}

      <EditorialHeading
        level={1}
        size="display-xl"
        tone="ink"
        emphasis={accent ? { text: accent } : undefined}
        className="mt-1.5"
      >
        {title}
      </EditorialHeading>

      {trimmedLocation && (
        <p className={cn(MONO_META_CLASS, "mt-2")}>{trimmedLocation}</p>
      )}

      {ctas && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">{ctas}</div>
      )}

      {cover && (
        <div className="mt-8">
          <TapedFigure
            aspect="landscape-16-9"
            rotation={-1}
            tape={{ color: "warm", length: "md", rotation: "b" }}
          >
            {cover}
          </TapedFigure>
        </div>
      )}
    </article>
  );
}
