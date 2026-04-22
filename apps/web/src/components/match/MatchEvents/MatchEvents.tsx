/**
 * MatchEvents Component
 *
 * Timeline of match events (goals, cards, substitutions).
 *
 * Features:
 * - Chronological timeline display
 * - Event type icons (goal, card, substitution)
 * - Home/Away team distinction
 * - Filter by event type
 * - Group by team option
 */

import { cn } from "@/lib/utils/cn";
import { CircleDot, Square, ArrowLeftRight } from "lucide-react";

export interface MatchEvent {
  /** Unique event ID */
  id: number;
  /** Event type */
  type: "goal" | "yellow_card" | "red_card" | "substitution";
  /** Minute of the event */
  minute: number;
  /** Additional time (e.g., 90+3) */
  additionalTime?: number;
  /** Team the event belongs to */
  team: "home" | "away";
  /** Player name (for goals and cards) */
  player?: string;
  /** Assist player name (for goals) */
  assist?: string;
  /** Player coming in (for substitutions) */
  playerIn?: string;
  /** Player going out (for substitutions) */
  playerOut?: string;
  /** Is penalty goal */
  isPenalty?: boolean;
  /** Is own goal */
  isOwnGoal?: boolean;
}

export interface MatchEventsProps {
  /** Home team name */
  homeTeamName: string;
  /** Away team name */
  awayTeamName: string;
  /** List of match events */
  events: readonly MatchEvent[];
  /** Filter events by type */
  filter?: "all" | "goals" | "cards" | "substitutions";
  /** Show event type icons */
  showIcons?: boolean;
  /** Group events by team */
  groupBy?: "chronological" | "team";
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format the minute display
 */
function formatMinute(minute: number, additionalTime?: number): string {
  if (additionalTime) {
    return `${minute}+${additionalTime}'`;
  }
  return `${minute}'`;
}

/**
 * Get icon for event type
 */
function EventIcon({ type }: { type: MatchEvent["type"] }) {
  switch (type) {
    case "goal":
      return <CircleDot className="h-4 w-4" aria-label="Doelpunt" />;
    case "yellow_card":
      return (
        <Square
          className="h-4 w-3 fill-yellow-400 text-yellow-500"
          aria-label="Gele kaart"
        />
      );
    case "red_card":
      return (
        <Square
          className="h-4 w-3 fill-red-500 text-red-600"
          aria-label="Rode kaart"
        />
      );
    case "substitution":
      return <ArrowLeftRight className="h-4 w-4" aria-label="Wissel" />;
    default:
      return null;
  }
}

/**
 * Render match events timeline showing goals, cards, and substitutions.
 *
 * @param homeTeamName - Home team name for context
 * @param awayTeamName - Away team name for context
 * @param events - Array of match events
 * @param filter - Filter to specific event types
 * @param showIcons - Whether to show event type icons
 * @param groupBy - How to group events (chronological or by team)
 * @param isLoading - Show loading skeleton
 * @param className - Additional CSS classes
 * @returns The rendered events timeline
 */
export function MatchEvents({
  homeTeamName,
  awayTeamName,
  events,
  filter = "all",
  showIcons = true,
  groupBy = "chronological",
  isLoading = false,
  className,
}: MatchEventsProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-6 w-10 animate-pulse rounded bg-gray-200" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
            <div className="h-6 flex-1 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  // Filter events
  let filteredEvents = [...events];
  if (filter === "goals") {
    filteredEvents = filteredEvents.filter((e) => e.type === "goal");
  } else if (filter === "cards") {
    filteredEvents = filteredEvents.filter(
      (e) => e.type === "yellow_card" || e.type === "red_card",
    );
  } else if (filter === "substitutions") {
    filteredEvents = filteredEvents.filter((e) => e.type === "substitution");
  }

  // Sort by minute
  filteredEvents.sort((a, b) => {
    const aTime = a.minute + (a.additionalTime || 0) / 100;
    const bTime = b.minute + (b.additionalTime || 0) / 100;
    return aTime - bTime;
  });

  // Empty state
  if (filteredEvents.length === 0) {
    return (
      <div role="status" className={cn("py-8 text-center", className)}>
        <p className="text-gray-500">
          Nog geen gebeurtenissen in deze wedstrijd.
        </p>
      </div>
    );
  }

  // Group by team if requested
  if (groupBy === "team") {
    const homeEvents = filteredEvents.filter((e) => e.team === "home");
    const awayEvents = filteredEvents.filter((e) => e.team === "away");

    return (
      <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2", className)}>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            {homeTeamName}
          </h3>
          <EventList events={homeEvents} showIcons={showIcons} side="home" />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            {awayTeamName}
          </h3>
          <EventList events={awayEvents} showIcons={showIcons} side="away" />
        </div>
      </div>
    );
  }

  // Chronological timeline
  return (
    <div className={cn("space-y-2", className)}>
      {filteredEvents.map((event) => (
        <EventRow
          key={event.id}
          event={event}
          showIcon={showIcons}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
        />
      ))}
    </div>
  );
}

/**
 * List of events for team grouping
 */
function EventList({
  events,
  showIcons,
  side,
}: {
  events: readonly MatchEvent[];
  showIcons: boolean;
  side: "home" | "away";
}) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-500">Geen gebeurtenissen</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="flex items-center gap-3 text-sm">
          <span className="w-10 font-mono text-gray-500">
            {formatMinute(event.minute, event.additionalTime)}
          </span>
          {showIcons && (
            <span
              className={cn(
                "flex-shrink-0",
                event.type === "goal" &&
                  (side === "home"
                    ? "text-kcvv-green-bright"
                    : "text-gray-700"),
              )}
            >
              <EventIcon type={event.type} />
            </span>
          )}
          <span className="text-gray-900">
            <EventDescription event={event} />
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Single event row for chronological view
 */
function EventRow({
  event,
  showIcon,
  homeTeamName,
  awayTeamName,
}: {
  event: MatchEvent;
  showIcon: boolean;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const isHome = event.team === "home";
  const teamName = isHome ? homeTeamName : awayTeamName;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2",
        isHome ? "bg-kcvv-green-bright/5" : "bg-gray-50",
      )}
    >
      {/* Minute */}
      <span className="w-12 flex-shrink-0 font-mono text-sm text-gray-500">
        {formatMinute(event.minute, event.additionalTime)}
      </span>

      {/* Icon */}
      {showIcon && (
        <span
          className={cn(
            "flex-shrink-0",
            event.type === "goal" &&
              (isHome ? "text-kcvv-green-bright" : "text-gray-700"),
          )}
        >
          <EventIcon type={event.type} />
        </span>
      )}

      {/* Description */}
      <div className="min-w-0 flex-1">
        <span className="text-sm text-gray-900">
          <EventDescription event={event} />
        </span>
        <span className="ml-2 text-xs text-gray-500">{teamName}</span>
      </div>
    </div>
  );
}

/**
 * Event description text
 */
function EventDescription({ event }: { event: MatchEvent }) {
  switch (event.type) {
    case "goal":
      return (
        <>
          <span className="font-semibold">{event.player}</span>
          {event.isPenalty && (
            <span className="ml-1 text-xs text-gray-500">(pen)</span>
          )}
          {event.isOwnGoal && (
            <span className="ml-1 text-xs text-red-500">(e.d.)</span>
          )}
          {event.assist && (
            <span className="text-gray-500"> (assist: {event.assist})</span>
          )}
        </>
      );
    case "yellow_card":
    case "red_card":
      return <span className="font-medium">{event.player}</span>;
    case "substitution":
      return (
        <>
          <span className="text-green-600">{event.playerIn}</span>
          <span className="mx-1 text-gray-400">⟷</span>
          <span className="text-red-600">{event.playerOut}</span>
        </>
      );
    default:
      return null;
  }
}
