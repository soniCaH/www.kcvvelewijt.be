"use client";

// "use client": this section imports a Phosphor icon (ArrowRight), and
// @phosphor-icons/react is ESM-only (calls React.createContext at module init).
// A server component importing it breaks Next.js's build-time config collection
// (same root cause as <TeamAgendaRow>). The section has no server-only logic.
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { ArrowRight } from "@/lib/icons.redesign";
import { TeamAgendaRow } from "./TeamAgendaRow";
import type { ScheduleMatch } from "@/components/match/types";

export interface TeamMatchesSectionProps {
  matches: readonly ScheduleMatch[];
  /** Slug used to build the /ploegen/[slug]/wedstrijden href. */
  teamSlug: string;
  /** PSD team ID of the KCVV team (passed to agenda rows for home/away context). */
  kcvvTeamId?: number;
  className?: string;
}

const RECENT_COUNT = 3;

function findNextMatch(
  matches: readonly ScheduleMatch[],
  now: Date,
): ScheduleMatch | undefined {
  return matches
    .filter((m) => m.status === "scheduled" && m.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}

function recentResults(
  matches: readonly ScheduleMatch[],
  excludeId: number | undefined,
  now: Date,
): ScheduleMatch[] {
  return matches
    .filter(
      (m) => m.status === "finished" && m.date < now && m.id !== excludeId,
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, RECENT_COUNT);
}

export function TeamMatchesSection({
  matches,
  teamSlug,
  kcvvTeamId,
  className,
}: TeamMatchesSectionProps) {
  if (matches.length === 0) return null;

  const now = new Date();
  const next = findNextMatch(matches, now);
  const recent = recentResults(matches, next?.id, now);

  if (!next && recent.length === 0) return null;

  const calendarHref = `/ploegen/${teamSlug}/wedstrijden`;

  return (
    <section
      data-testid="team-matches-section"
      aria-label="Wedstrijden"
      className={cn("flex flex-col gap-3", className)}
    >
      {next ? (
        <div className="flex flex-col gap-1">
          <MonoLabel variant="plain" size="sm">
            Eerstvolgende
          </MonoLabel>
          <TeamAgendaRow match={next} kcvvTeamId={kcvvTeamId} featured />
        </div>
      ) : null}

      {recent.length > 0 ? (
        <div className="flex flex-col gap-2">
          {recent.map((m) => (
            <TeamAgendaRow key={m.id} match={m} kcvvTeamId={kcvvTeamId} />
          ))}
        </div>
      ) : null}

      <Link
        href={calendarHref}
        data-testid="team-matches-calendar-link"
        className="text-ink hover:text-jersey-deep inline-flex items-center gap-1 font-mono text-[11px] tracking-widest uppercase transition-colors"
      >
        Volledige kalender
        <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </section>
  );
}
