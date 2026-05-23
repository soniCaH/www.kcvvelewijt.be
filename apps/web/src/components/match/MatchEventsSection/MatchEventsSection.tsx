import { EditorialHeading, MonoLabelRow } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import { MatchEvents, type MatchEvent } from "../MatchEvents/MatchEvents";

export interface MatchEventsSectionProps {
  homeTeamName: string;
  awayTeamName: string;
  /** Optional PSD shield URL — surfaces as the 20px logo chip on each row. */
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  events: readonly MatchEvent[];
  className?: string;
}

/**
 * Section wrapper around `<MatchEvents>` for the Phase 6.B match-detail page
 * (6.B.d3 lock). Adds the editorial chrome — mono caps kicker
 * (`* WEDSTRIJDVERLOOP`) + display-md italic heading (`Hoe het ging.`) +
 * paper container — around the existing per-row primitive.
 *
 * Auto-hide: returns `null` when `events` is empty (typically upcoming
 * matches). The caller mounts this unconditionally; this component owns the
 * "render or not" decision.
 */
export function MatchEventsSection({
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  events,
  className,
}: MatchEventsSectionProps) {
  if (events.length === 0) return null;

  return (
    <section
      data-component="match-events-section"
      className={cn(
        "bg-cream mx-auto w-full max-w-[var(--container-wide)] px-4 py-10 md:py-14",
        className,
      )}
    >
      <MonoLabelRow
        items={[{ label: "WEDSTRIJDVERLOOP" }]}
        className="text-ink mb-3"
      />
      <EditorialHeading level={2} size="display-md" className="mb-8 md:mb-10">
        Hoe het ging.
      </EditorialHeading>

      <MatchEvents
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        events={events}
      />
    </section>
  );
}
