/**
 * TeamStandings Component
 *
 * League standings table with team highlighting and form display.
 *
 * Features:
 * - Full standings with all columns (P, W, D, L, G+, G-, +/-, Pts)
 * - Team highlighting for KCVV teams
 * - Form display (recent results as WWLDW)
 * - Compact variant showing top N teams
 * - Responsive design for mobile
 */

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface StandingsEntry {
  /** Position in the league table */
  position: number;
  /** Team ID for highlighting */
  teamId: number;
  /** Team name */
  teamName: string;
  /** Team logo URL */
  teamLogo?: string;
  /** Matches played */
  played: number;
  /** Matches won */
  won: number;
  /** Matches drawn */
  drawn: number;
  /** Matches lost */
  lost: number;
  /** Goals scored */
  goalsFor: number;
  /** Goals conceded */
  goalsAgainst: number;
  /** Goal difference */
  goalDifference: number;
  /** Total points */
  points: number;
  /** Recent form string (e.g., "WWDLW") */
  form?: string;
}

export interface TeamStandingsProps {
  /** Array of standings entries */
  standings: StandingsEntry[];
  /** Team ID to highlight (e.g., KCVV) */
  highlightTeamId?: number;
  /** Show recent form column */
  showForm?: boolean;
  /** Limit number of rows shown */
  limit?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Render a form result badge (W/D/L)
 */
function FormBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: "bg-green-500 text-white",
    D: "bg-yellow-500 text-gray-900",
    L: "bg-red-500 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded",
        colors[result] || "bg-gray-300 text-gray-700",
      )}
    >
      {result}
    </span>
  );
}

/**
 * Render the standings table for a league, optionally highlighting a specific team.
 *
 * Displays position, team name (with optional logo), matches played, wins, draws, losses,
 * goals for/against, goal difference, and points. Optionally shows recent form if enabled.
 * Supports compact view via `limit` and loading/empty states.
 *
 * @param standings - Array of standings entries to display
 * @param highlightTeamId - Optional team ID to highlight (e.g., KCVV)
 * @param showForm - If true, displays recent form column
 * @param limit - Limits the number of rows displayed
 * @param isLoading - If true, renders a skeleton loader instead of data
 * @param className - Optional additional CSS classes applied to the root element
 * @returns The rendered standings table element
 */
export function TeamStandings({
  standings,
  highlightTeamId,
  showForm = false,
  limit,
  isLoading = false,
  className,
}: TeamStandingsProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("overflow-x-auto", className)}>
        <table className="w-full text-sm">
          <thead className="bg-kcvv-green-dark text-white">
            <tr>
              <th className="px-2 py-3 text-left w-10">#</th>
              <th className="px-2 py-3 text-left">Team</th>
              <th className="px-2 py-3 text-center w-10">P</th>
              <th className="px-2 py-3 text-center w-10 hidden md:table-cell">
                W
              </th>
              <th className="px-2 py-3 text-center w-10 hidden md:table-cell">
                D
              </th>
              <th className="px-2 py-3 text-center w-10 hidden md:table-cell">
                L
              </th>
              <th className="px-2 py-3 text-center w-12 hidden lg:table-cell">
                G+
              </th>
              <th className="px-2 py-3 text-center w-12 hidden lg:table-cell">
                G-
              </th>
              <th className="px-2 py-3 text-center w-12">+/-</th>
              <th className="px-2 py-3 text-center w-12 font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="px-2 py-3">
                  <div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="h-4 w-6 mx-auto bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-2 py-3 text-center hidden md:table-cell">
                  <div className="h-4 w-6 mx-auto bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-2 py-3 text-center hidden md:table-cell">
                  <div className="h-4 w-6 mx-auto bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-2 py-3 text-center hidden md:table-cell">
                  <div className="h-4 w-6 mx-auto bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-2 py-3 text-center hidden lg:table-cell">
                  <div className="h-4 w-6 mx-auto bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-2 py-3 text-center hidden lg:table-cell">
                  <div className="h-4 w-6 mx-auto bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="h-4 w-8 mx-auto bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="h-4 w-8 mx-auto bg-gray-200 rounded animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (standings.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-8 text-gray-500 bg-gray-50 rounded-lg",
          className,
        )}
      >
        <p>Geen klassement beschikbaar.</p>
      </div>
    );
  }

  // Apply limit if specified
  const displayedStandings = limit ? standings.slice(0, limit) : standings;

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead className="bg-kcvv-green-dark text-white">
          <tr>
            <th className="px-2 py-3 text-left w-10">#</th>
            <th className="px-2 py-3 text-left">Team</th>
            <th className="px-2 py-3 text-center w-10">P</th>
            <th className="px-2 py-3 text-center w-10 hidden md:table-cell">
              W
            </th>
            <th className="px-2 py-3 text-center w-10 hidden md:table-cell">
              D
            </th>
            <th className="px-2 py-3 text-center w-10 hidden md:table-cell">
              L
            </th>
            <th className="px-2 py-3 text-center w-12 hidden lg:table-cell">
              G+
            </th>
            <th className="px-2 py-3 text-center w-12 hidden lg:table-cell">
              G-
            </th>
            <th className="px-2 py-3 text-center w-12">+/-</th>
            <th className="px-2 py-3 text-center w-12 font-bold">Pts</th>
            {showForm && (
              <th className="px-2 py-3 text-center w-28 hidden sm:table-cell">
                Vorm
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {displayedStandings.map((entry) => {
            const isHighlighted = entry.teamId === highlightTeamId;
            return (
              <tr
                key={entry.teamId}
                className={cn(
                  "border-b border-gray-200 transition-colors",
                  isHighlighted
                    ? "bg-kcvv-green-bright text-white font-semibold"
                    : "hover:bg-gray-50",
                )}
              >
                <td className="px-2 py-3 text-center font-medium">
                  {entry.position}
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    {entry.teamLogo ? (
                      <Image
                        src={entry.teamLogo}
                        alt={`${entry.teamName} logo`}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          isHighlighted ? "bg-white/20" : "bg-gray-200",
                        )}
                      >
                        <span className="text-xs">
                          {entry.teamName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {entry.teamName}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center">{entry.played}</td>
                <td className="px-2 py-3 text-center hidden md:table-cell">
                  {entry.won}
                </td>
                <td className="px-2 py-3 text-center hidden md:table-cell">
                  {entry.drawn}
                </td>
                <td className="px-2 py-3 text-center hidden md:table-cell">
                  {entry.lost}
                </td>
                <td className="px-2 py-3 text-center hidden lg:table-cell">
                  {entry.goalsFor}
                </td>
                <td className="px-2 py-3 text-center hidden lg:table-cell">
                  {entry.goalsAgainst}
                </td>
                <td className="px-2 py-3 text-center">
                  {entry.goalDifference > 0
                    ? `+${entry.goalDifference}`
                    : entry.goalDifference}
                </td>
                <td className="px-2 py-3 text-center font-bold">
                  {entry.points}
                </td>
                {showForm && (
                  <td className="px-2 py-3 hidden sm:table-cell">
                    {isHighlighted && entry.form ? (
                      <div className="flex items-center justify-center gap-1">
                        {entry.form.split("").map((result, i) => (
                          <FormBadge key={i} result={result} />
                        ))}
                      </div>
                    ) : (
                      // Form data is only computed for KCVV teams (PSD only
                      // exposes recent results for our own teams), so
                      // opponent rows show a placeholder em-dash instead.
                      <div
                        className="text-center text-xs text-kcvv-gray/50"
                        aria-label="Geen vormgegevens beschikbaar"
                      >
                        —
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
