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
import { CardGlyph } from "../CardGlyph";

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
  /**
   * Is this player a goalkeeper? Sourced from Sanity `player.keeper` for KCVV
   * players (always reliable, PSD-synced); opponent-side falls back to jersey
   * number = 1 by convention. Drives the warm-bg keeper number badge.
   */
  isKeeper?: boolean;
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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
        <p className="text-ink-muted font-mono text-sm tracking-[0.14em] uppercase">
          Geen opstellingen beschikbaar voor deze wedstrijd.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2",
        className,
      )}
    >
      <TeamLineup teamName={homeTeamName} players={homeLineup} />
      <TeamLineup teamName={awayTeamName} players={awayLineup} />
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
}: {
  teamName: string;
  players: LineupPlayer[];
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

  return (
    <div>
      {/* Team-column header: mono caps, ink top border. Stylistic seam between
          the section heading above and the player rows below. */}
      <h3 className="border-ink text-ink/70 border-t pt-2 pb-3 font-mono text-[10px] tracking-[0.16em] uppercase">
        {teamName}
      </h3>

      {players.length === 0 ? (
        <p className="text-ink-muted text-sm">Geen opstelling beschikbaar</p>
      ) : (
        <div>
          {starters.length > 0 && (
            <ol className="list-none space-y-1">
              {starters.map((player, index) => (
                <li key={player.id ?? `starter-${index}`}>
                  <PlayerRow player={player} />
                </li>
              ))}
            </ol>
          )}

          {substitutes.length > 0 && (
            <div className="mt-6">
              {/* BANK divider — separates starters from bench. */}
              <h4 className="border-ink text-ink/70 border-t pt-2 pb-3 font-mono text-[10px] tracking-[0.16em] uppercase">
                Bank
              </h4>
              <ol className="list-none space-y-1">
                {substitutes.map((player, index) => (
                  <li key={player.id ?? `sub-${index}`}>
                    <PlayerRow player={player} />
                  </li>
                ))}
              </ol>
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
function PlayerRow({ player }: { player: LineupPlayer }) {
  // Keeper distinction: warm yellow number badge instead of the ink default.
  // `isKeeper` is set caller-side (Sanity `player.keeper` for KCVV; jersey
  // number = 1 heuristic for opponents).
  const numberBg = player.isKeeper ? "bg-warm text-ink" : "bg-ink text-cream";

  // Determine if player has a substitution status to show
  const wasSubbedOut = player.status === "substituted";
  const cameOn = player.status === "subbed_in";
  const hasSubStatus = wasSubbedOut || cameOn;

  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Substitution status icon */}
      <span className="flex w-4 items-center justify-center">
        {wasSubbedOut && (
          <ArrowDown className="text-alert" size={14} aria-label="Gewisseld" />
        )}
        {cameOn && (
          <ArrowUp
            className="text-jersey-deep"
            size={14}
            aria-label="Ingevallen"
          />
        )}
      </span>

      {/* Jersey number — bg-warm for keepers, bg-ink for outfielders. The
          visible number stays the accessible name; the keeper hint ships as
          an `sr-only` sibling so screen readers announce "11 Keeper" rather
          than overriding the number entirely. */}
      {player.number !== undefined && (
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center",
            "font-mono text-[12px] font-bold tracking-tight tabular-nums",
            numberBg,
          )}
        >
          {player.number}
          {player.isKeeper && <span className="sr-only"> Keeper</span>}
        </span>
      )}

      {/* Player name */}
      <span className="text-ink flex min-w-0 flex-1 items-center gap-1.5">
        <span className="font-display min-w-0 truncate text-[15px] italic">
          {player.name}
          {player.isCaptain && (
            <span className="text-ink-muted ml-1.5 font-mono text-[10px] tracking-[0.16em] not-italic">
              [C]
            </span>
          )}
        </span>
        {/* Card icon */}
        {player.card && <CardGlyph type={player.card} size={14} />}
      </span>

      {/* Minutes played for players with substitution status */}
      {hasSubStatus && player.minutesPlayed !== undefined && (
        <span className="text-ink-muted font-mono text-[11px] tracking-[0.06em]">
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
    <div>
      <div className="border-ink bg-cream-soft mb-3 h-6 w-32 animate-pulse border-t" />
      <div className="space-y-2">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="bg-cream-soft h-7 w-7 animate-pulse" />
            <div className="bg-cream-soft h-4 flex-1 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
