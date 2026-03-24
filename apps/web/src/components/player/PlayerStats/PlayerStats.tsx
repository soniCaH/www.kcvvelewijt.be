/**
 * PlayerStats Component
 *
 * Statistics display table/grid for player performance data.
 * Data sourced from Footbalisto API.
 *
 * Features:
 * - Season statistics table
 * - Position-specific stats (outfield vs goalkeeper)
 * - Multi-season historical view
 * - Loading skeleton state
 * - Empty state handling
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** Base statistics shared by all players */
interface BaseStats {
  /** Season identifier (e.g., "2024-2025") */
  season: string;
  /** Number of matches played */
  matches: number;
  /** Yellow cards received */
  yellowCards: number;
  /** Red cards received */
  redCards: number;
  /** Total minutes played */
  minutesPlayed: number;
}

/** Statistics for outfield players */
export interface OutfieldStats extends BaseStats {
  /** Goals scored */
  goals: number;
  /** Assists provided */
  assists: number;
}

/** Statistics for goalkeepers */
export interface GoalkeeperStats extends BaseStats {
  /** Clean sheets kept */
  cleanSheets: number;
  /** Goals conceded */
  goalsConceded: number;
  /** Saves made */
  saves: number;
}

export type PlayerStatsData = OutfieldStats | GoalkeeperStats;

export interface PlayerStatsProps extends HTMLAttributes<HTMLDivElement> {
  /** Player position type for determining which stats to display */
  position: "outfield" | "goalkeeper";
  /** Array of season statistics */
  stats: PlayerStatsData[];
  /** Loading state */
  isLoading?: boolean;
}

/**
 * Check if stats are goalkeeper stats
 */
function isGoalkeeperStats(stats: PlayerStatsData): stats is GoalkeeperStats {
  return "cleanSheets" in stats;
}

/**
 * Format minutes to hours and minutes
 */
function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}u` : `${hours}u ${mins}m`;
}

export const PlayerStats = forwardRef<HTMLDivElement, PlayerStatsProps>(
  ({ position, stats, isLoading = false, className, ...props }, ref) => {
    // Loading skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn("animate-pulse", className)}
          aria-label="Statistieken laden..."
          {...props}
        >
          <h3 className="text-lg font-semibold text-kcvv-gray-dark mb-4">
            Statistieken
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Header skeleton */}
              <div
                className="flex gap-4 py-2 border-b border-gray-200"
                data-testid="stats-skeleton-header"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-4 w-16 bg-gray-300 rounded" />
                ))}
              </div>
              {/* Row skeletons */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 py-3 border-b border-gray-100"
                  data-testid="stats-skeleton-row"
                >
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="h-4 w-16 bg-gray-200 rounded" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Empty state
    if (stats.length === 0) {
      return (
        <div ref={ref} className={cn(className)} {...props}>
          <h3 className="text-lg font-semibold text-kcvv-gray-dark mb-4">
            Statistieken
          </h3>
          <p className="text-kcvv-gray text-sm">
            Geen statistieken beschikbaar.
          </p>
        </div>
      );
    }

    // Outfield player table
    if (position === "outfield") {
      return (
        <div ref={ref} className={cn(className)} {...props}>
          <h3 className="text-lg font-semibold text-kcvv-gray-dark mb-4">
            Statistieken
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 pr-4 font-medium text-kcvv-gray-dark">
                    Seizoen
                  </th>
                  <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                    Wed
                  </th>
                  <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                    Goals
                  </th>
                  <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                    Assists
                  </th>
                  <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                    <span
                      className="inline-block w-3 h-3 bg-yellow-400 rounded-sm"
                      aria-label="Gele kaarten"
                    />
                  </th>
                  <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                    <span
                      className="inline-block w-3 h-3 bg-red-500 rounded-sm"
                      aria-label="Rode kaarten"
                    />
                  </th>
                  <th className="py-2 pl-2 font-medium text-kcvv-gray-dark text-right">
                    Speeltijd
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat) => {
                  if (isGoalkeeperStats(stat)) return null;
                  const outfieldStat = stat as OutfieldStats;
                  return (
                    <tr
                      key={stat.season}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 pr-4 font-medium text-kcvv-gray-dark">
                        {stat.season}
                      </td>
                      <td className="py-3 px-2 text-center text-kcvv-gray">
                        {stat.matches}
                      </td>
                      <td className="py-3 px-2 text-center text-kcvv-gray">
                        {outfieldStat.goals}
                      </td>
                      <td className="py-3 px-2 text-center text-kcvv-gray">
                        {outfieldStat.assists}
                      </td>
                      <td className="py-3 px-2 text-center text-kcvv-gray">
                        {stat.yellowCards}
                      </td>
                      <td className="py-3 px-2 text-center text-kcvv-gray">
                        {stat.redCards}
                      </td>
                      <td className="py-3 pl-2 text-right text-kcvv-gray">
                        {formatMinutes(stat.minutesPlayed)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // Goalkeeper table
    return (
      <div ref={ref} className={cn(className)} {...props}>
        <h3 className="text-lg font-semibold text-kcvv-gray-dark mb-4">
          Statistieken
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-4 font-medium text-kcvv-gray-dark">
                  Seizoen
                </th>
                <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                  Wed
                </th>
                <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                  Clean sheets
                </th>
                <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                  Tegendoelpunten
                </th>
                <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                  Reddingen
                </th>
                <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                  <span
                    className="inline-block w-3 h-3 bg-yellow-400 rounded-sm"
                    aria-label="Gele kaarten"
                  />
                </th>
                <th className="py-2 px-2 font-medium text-kcvv-gray-dark text-center">
                  <span
                    className="inline-block w-3 h-3 bg-red-500 rounded-sm"
                    aria-label="Rode kaarten"
                  />
                </th>
                <th className="py-2 pl-2 font-medium text-kcvv-gray-dark text-right">
                  Speeltijd
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => {
                if (!isGoalkeeperStats(stat)) return null;
                return (
                  <tr
                    key={stat.season}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 pr-4 font-medium text-kcvv-gray-dark">
                      {stat.season}
                    </td>
                    <td className="py-3 px-2 text-center text-kcvv-gray">
                      {stat.matches}
                    </td>
                    <td className="py-3 px-2 text-center text-kcvv-gray">
                      {stat.cleanSheets}
                    </td>
                    <td className="py-3 px-2 text-center text-kcvv-gray">
                      {stat.goalsConceded}
                    </td>
                    <td className="py-3 px-2 text-center text-kcvv-gray">
                      {stat.saves}
                    </td>
                    <td className="py-3 px-2 text-center text-kcvv-gray">
                      {stat.yellowCards}
                    </td>
                    <td className="py-3 px-2 text-center text-kcvv-gray">
                      {stat.redCards}
                    </td>
                    <td className="py-3 pl-2 text-right text-kcvv-gray">
                      {formatMinutes(stat.minutesPlayed)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

PlayerStats.displayName = "PlayerStats";
