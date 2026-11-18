"use client";

// "use client": the section re-derives next/recent from a clock read on
// hydration (see `now` below) and renders <TeamAgendaRow>, which imports a
// Phosphor icon — @phosphor-icons/react is ESM-only (calls
// React.createContext at module init), so a server component importing it
// breaks Next.js's build-time config collection.
import { useId, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { trackEvent } from "@/lib/analytics/track-event";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialLink } from "@/components/design-system/EditorialLink";
import { CalendarSubscribePanel } from "@/components/calendar/CalendarSubscribePanel";
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
  /**
   * The team the "Volg je ploeg" subscribe panel offers (#3644). The caller
   * passes it only for a team with a strictly parsed PSD id (`parsePsdId`);
   * without it no panel renders. The panel lives in this section, so it hides
   * with it between seasons. It starts closed behind a toggle (#3786).
   */
  subscribeTeam?: {
    psdId: number;
    label: string;
    /** Whether `/kalender` lists this team; off drops the `Meer ploegen`
     * link, which would open nothing (#3788). Defaults to on. */
    onKalender?: boolean;
  };
  className?: string;
}

export function TeamMatchesSection({
  matches,
  teamSlug,
  kcvvTeamId,
  now = new Date(),
  subscribeTeam,
  className,
}: TeamMatchesSectionProps) {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const subscribePanelId = useId();

  const toggleSubscribe = () => {
    const nextOpen = !subscribeOpen;
    setSubscribeOpen(nextOpen);
    // Fire only on open (the panel revealing), not on collapse.
    if (nextOpen) trackEvent("kalender_subscribe_open", { source: "team" });
  };

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <EditorialLink
          href={calendarHref}
          data-testid="team-matches-calendar-link"
        >
          Volledige kalender
        </EditorialLink>

        {subscribeTeam ? (
          // `/kalender`'s "Abonneer" toggle (CalendarWidget) without the glyph,
          // on the `text-label` step instead of its frozen `text-[11px]` (line-height 1,
          // so `py-2` keeps the height close) (#3786).
          <button
            type="button"
            onClick={toggleSubscribe}
            aria-expanded={subscribeOpen}
            aria-controls={subscribePanelId}
            className={cn(
              "border-ink text-label inline-flex items-center gap-1.5 border-2 px-3 py-2 font-mono uppercase transition-colors",
              subscribeOpen
                ? "bg-ink text-cream"
                : "text-ink hover:bg-cream-soft",
            )}
          >
            Zet in je agenda
          </button>
        ) : null}
      </div>

      {subscribeTeam ? (
        <CalendarSubscribePanel
          teams={[
            {
              id: String(subscribeTeam.psdId),
              name: subscribeTeam.label,
              psdId: subscribeTeam.psdId,
              label: subscribeTeam.label,
            },
          ]}
          isOpen={subscribeOpen}
          source="team"
          id={subscribePanelId}
          showMoreTeamsLink={subscribeTeam.onKalender ?? true}
        />
      ) : null}
    </section>
  );
}
