"use client";

// "use client": the section re-derives next/recent from a clock read on
// hydration (see `now` below) and renders <TeamAgendaRow>, which imports a
// Phosphor icon — @phosphor-icons/react is ESM-only (calls
// React.createContext at module init), so a server component importing it
// breaks Next.js's build-time config collection.
import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialLink } from "@/components/design-system/EditorialLink";
import { TeamAgendaRow } from "./TeamAgendaRow";
import { findNextMatch, recentResults } from "./match-visibility";
import type { ScheduleRow } from "@/components/match/types";

export interface TeamMatchesSectionProps {
  matches: readonly ScheduleRow[];
  /** Slug used to build the /ploegen/[slug]/wedstrijden href. */
  teamSlug: string;
  /** PSD team ID of the KCVV team (passed to agenda rows for home/away context). */
  kcvvTeamId?: number;
  /**
   * The instant "next" vs. "recent" is decided against. Defaults to
   * `new Date()` for a caller with no reason to pin one, but
   * `/ploegen/[slug]/page.tsx` MUST pass its own snapshot here — the page is
   * ISR-cached for up to 15 minutes with `showWedstrijden` (and the seam and
   * nav chip it gates) baked into that HTML, while this `"use client"`
   * component re-derives on hydration with a fresh clock read. Two
   * independent reads can disagree by up to the cache window, not
   * milliseconds — see the review-round-3 paragraph on `hasVisibleMatches`
   * in `match-visibility.ts` for the reachable failure this closes.
   */
  now?: Date;
  className?: string;
}

export function TeamMatchesSection({
  matches,
  teamSlug,
  kcvvTeamId,
  now = new Date(),
  className,
}: TeamMatchesSectionProps) {
  const next = findNextMatch(matches, now);
  const recent = recentResults(matches, next?.id, now);

  // This is `hasVisibleMatches`'s own definition (`match-visibility.ts`),
  // applied directly to the `next`/`recent` already derived for rendering
  // rather than a second call through that function — `page.tsx` imports
  // and calls `hasVisibleMatches` itself (with the SAME `now` it passes as
  // this prop) to decide the seam, the `<section>` and the sticky-nav entry,
  // so the two can never drift apart without also duplicating this
  // derivation (#2636 finding 2 / finding 4).
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

      <EditorialLink
        href={calendarHref}
        data-testid="team-matches-calendar-link"
      >
        Volledige kalender
      </EditorialLink>
    </section>
  );
}
