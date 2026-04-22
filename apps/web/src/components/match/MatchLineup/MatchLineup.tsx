/**
 * MatchLineup Component
 *
 * Displays starting XI and substitutes for both teams.
 *
 * Features:
 * - Two-column layout (home vs away) on desktop
 * - Stacked layout on mobile
 * - Groups players by status (starters, substitutes)
 * - Captain indicator
 * - Jersey number display
 * - Substitution status icons (in/out arrows)
 * - Card icons (yellow, red, yellow-red)
 */

import { cn } from "@/lib/utils/cn";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { CardType } from "@/lib/effect/schemas/match.schema";

/**
 * Yellow card icon component
 */
function YellowCardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 16"
      className={cn("h-4 w-3", className)}
      aria-label="Gele kaart"
      role="img"
    >
      <rect
        x="1"
        y="1"
        width="10"
        height="14"
        rx="1"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="1"
      />
    </svg>
  );
}

/**
 * Red card icon component
 */
function RedCardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 16"
      className={cn("h-4 w-3", className)}
      aria-label="Rode kaart"
      role="img"
    >
      <rect
        x="1"
        y="1"
        width="10"
        height="14"
        rx="1"
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth="1"
      />
    </svg>
  );
}

/**
 * Double yellow (yellow-red) card icon component
 */
function DoubleYellowCardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 16"
      className={cn("h-4 w-4.5", className)}
      aria-label="Tweede gele kaart"
      role="img"
    >
      {/* Yellow card (back) */}
      <rect
        x="1"
        y="1"
        width="10"
        height="14"
        rx="1"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="1"
      />
      {/* Red card (front, offset) */}
      <rect
        x="6"
        y="1"
        width="10"
        height="14"
        rx="1"
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth="1"
      />
    </svg>
  );
}

/**
 * Renders the appropriate card icon based on card type
 */
function CardIcon({ cardType }: { cardType: CardType }) {
  switch (cardType) {
    case "yellow":
      return <YellowCardIcon />;
    case "red":
      return <RedCardIcon />;
    case "double_yellow":
      return <DoubleYellowCardIcon />;
    default: {
      // Exhaustiveness check - if a new card type is added, TypeScript will error here
      const _exhaustive: never = cardType;
      // Runtime warning for unexpected card types from API
      if (process.env.NODE_ENV === "development") {
        console.warn(`Unexpected card type received: ${String(cardType)}`);
      }
      return null;
    }
  }
}

export interface LineupPlayer {
  /** Player ID (optional) */
  id?: number;
  /** Player name */
  name: string;
  /** Jersey number */
  number?: number;
  /** Minutes played in match */
  minutesPlayed?: number;
  /** Is team captain */
  isCaptain: boolean;
  /** Player status in match */
  status: "starter" | "substitute" | "substituted" | "subbed_in" | "unknown";
  /** Card received by player (if any) */
  card?: CardType;
}

export interface MatchLineupProps {
  /** Home team name */
  homeTeamName: string;
  /** Away team name */
  awayTeamName: string;
  /** Home team lineup */
  homeLineup: LineupPlayer[];
  /** Away team lineup */
  awayLineup: LineupPlayer[];
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Render the match lineups for the home and away teams, including loading and empty states.
 *
 * Renders two team lineup panels side-by-side on large screens (stacked on small screens). If
 * `isLoading` is true, two skeleton cards are rendered. If both `homeLineup` and `awayLineup`
 * are empty, a centered Dutch message indicating no lineups is shown.
 *
 * @param homeTeamName - Display name of the home team
 * @param awayTeamName - Display name of the away team
 * @param homeLineup - Array of `LineupPlayer` entries for the home team
 * @param awayLineup - Array of `LineupPlayer` entries for the away team
 * @param isLoading - If true, render loading skeletons instead of lineup data
 * @param className - Additional CSS class names to apply to the root container
 * @returns The rendered lineup UI (team panels, loading skeletons, or empty-state message)
 */
export function MatchLineup({
  homeTeamName,
  awayTeamName,
  homeLineup,
  awayLineup,
  isLoading = false,
  className,
}: MatchLineupProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <LineupSkeleton />
          <LineupSkeleton />
        </div>
      </div>
    );
  }

  // No lineups available
  if (homeLineup.length === 0 && awayLineup.length === 0) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <p className="text-gray-500">
          Geen opstellingen beschikbaar voor deze wedstrijd.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="font-title text-2xl font-bold text-gray-900">
        Opstellingen
      </h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Home Team */}
        <TeamLineup teamName={homeTeamName} players={homeLineup} side="home" />

        {/* Away Team */}
        <TeamLineup teamName={awayTeamName} players={awayLineup} side="away" />
      </div>
    </div>
  );
}

/**
 * Render a team's lineup card grouped into starters and substitutes with side-specific styling.
 *
 * @param teamName - The displayed name of the team
 * @param players - The list of players to display; players are grouped into starters (status "starter" or "substituted") and substitutes (status "substitute", "subbed_in", or "unknown")
 * @param side - Either `"home"` or `"away"`, which controls visual styling for the card and badges
 * @returns The JSX element containing the team's lineup sections and players
 */
function TeamLineup({
  teamName,
  players,
  side,
}: {
  teamName: string;
  players: LineupPlayer[];
  side: "home" | "away";
}) {
  // Group players by status
  // Starters section: players who started (including those who were subbed out)
  const starters = players.filter(
    (p) => p.status === "starter" || p.status === "substituted",
  );
  // Substitutes section: bench players (used, unused, and unknown status)
  const substitutes = players.filter(
    (p) =>
      p.status === "substitute" ||
      p.status === "subbed_in" ||
      p.status === "unknown",
  );

  const bgColor = side === "home" ? "bg-kcvv-green-bright/5" : "bg-gray-50";
  const borderColor =
    side === "home" ? "border-kcvv-green-bright/20" : "border-gray-200";

  return (
    <div className={cn("rounded-lg border p-4", bgColor, borderColor)}>
      {/* Team name header */}
      <h3 className="font-title mb-4 text-lg font-bold text-gray-900">
        {teamName}
      </h3>

      {players.length === 0 ? (
        <p className="text-sm text-gray-500">Geen opstelling beschikbaar</p>
      ) : (
        <div className="space-y-4">
          {/* Starters */}
          {starters.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Basiself ({starters.length})
              </h4>
              <div className="space-y-1">
                {starters.map((player, index) => (
                  <PlayerRow
                    key={player.id ?? `starter-${index}`}
                    player={player}
                    side={side}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Substitutes */}
          {substitutes.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Invallers ({substitutes.length})
              </h4>
              <div className="space-y-1">
                {substitutes.map((player, index) => (
                  <PlayerRow
                    key={player.id ?? `sub-${index}`}
                    player={player}
                    side={side}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Renders a single lineup player row with substitution icon, jersey number badge, player name (with captain indicator), and minutes played when applicable.
 *
 * @param player - Player data to display (name, number, captain flag, status, and optional minutesPlayed).
 * @param side - "home" or "away"; controls color styling for the jersey number badge and row accents.
 * @returns A JSX element representing the formatted player row for a lineup.
 */
function PlayerRow({
  player,
  side,
}: {
  player: LineupPlayer;
  side: "home" | "away";
}) {
  const numberBg =
    side === "home"
      ? "bg-kcvv-green-bright text-white"
      : "bg-gray-700 text-white";

  // Determine if player has a substitution status to show
  const wasSubbedOut = player.status === "substituted";
  const cameOn = player.status === "subbed_in";
  const hasSubStatus = wasSubbedOut || cameOn;

  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Substitution status icon */}
      <span className="flex w-4 items-center justify-center">
        {wasSubbedOut && (
          <ArrowDown
            className="text-red-500"
            size={14}
            aria-label="Gewisseld"
          />
        )}
        {cameOn && (
          <ArrowUp
            className="text-green-500"
            size={14}
            aria-label="Ingevallen"
          />
        )}
      </span>

      {/* Jersey number */}
      {player.number !== undefined && (
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded text-xs font-bold",
            numberBg,
          )}
        >
          {player.number}
        </span>
      )}

      {/* Player name */}
      <span className="flex flex-1 items-center gap-1.5 text-sm text-gray-900">
        <span>
          {player.name}
          {player.isCaptain && (
            <span className="text-kcvv-green-bright ml-1.5 text-xs font-semibold">
              (C)
            </span>
          )}
        </span>
        {/* Card icon */}
        {player.card && <CardIcon cardType={player.card} />}
      </span>

      {/* Minutes played for players with substitution status */}
      {hasSubStatus && player.minutesPlayed !== undefined && (
        <span className="text-xs text-gray-500">
          {player.minutesPlayed}&apos;
        </span>
      )}
    </div>
  );
}

/**
 * Loading skeleton for lineup
 */
function LineupSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-7 w-7 animate-pulse rounded bg-gray-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
