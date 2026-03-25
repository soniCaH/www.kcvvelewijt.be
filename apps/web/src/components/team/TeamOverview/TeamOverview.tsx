"use client";

/**
 * TeamOverview Component
 *
 * Grid/list of teams for overview pages like /jeugd.
 * Displays multiple TeamCard components in a responsive grid.
 *
 * Features:
 * - Responsive grid layout (1-4 columns depending on viewport)
 * - Filter by team type (senior, youth, club)
 * - Group by age for youth teams
 * - Loading skeleton grid
 * - Empty state handling
 */

import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { TeamCard, type TeamCardProps } from "../TeamCard";

export interface TeamData extends Omit<TeamCardProps, "variant" | "isLoading"> {
  /** Unique identifier */
  id?: string;
}

export interface TeamOverviewProps {
  /** Array of team data */
  teams: TeamData[];
  /** Filter by team type */
  teamType?: "all" | "senior" | "youth" | "club";
  /** Group youth teams by age category */
  groupByAge?: boolean;
  /** Layout variant */
  variant?: "grid" | "compact";
  /** Loading state */
  isLoading?: boolean;
  /** Message when no teams found */
  emptyMessage?: string;
  /** Show filter buttons */
  showFilters?: boolean;
  /** Color scheme for rendering on dark backgrounds */
  colorScheme?: "light" | "dark";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Convert an age-group label (e.g., "U15") to its numeric age.
 *
 * @param ageGroup - A string like `"U15"` or a number-only string; may be undefined
 * @returns The parsed age as a number, or `999` if `ageGroup` is undefined or cannot be parsed
 */
function parseAgeGroup(ageGroup: string | undefined): number {
  if (!ageGroup) return 999;
  const match = ageGroup.match(/U?(\d+)/i);
  return match ? parseInt(match[1], 10) : 999;
}

/**
 * Map an age-group identifier to its 3-tier category label.
 *
 * @param ageGroup - Age group string such as `"U15"`, or `undefined` when not available.
 * @returns One of: `"Onderbouw (U6–U9)"`, `"Middenbouw (U10–U13)"`,
 * `"Bovenbouw (U14–U21)"`, or `"Overig"` depending on the parsed age.
 */
function getAgeCategory(ageGroup: string | undefined): string {
  const age = parseAgeGroup(ageGroup);
  if (age <= 9) return "Onderbouw (U6–U9)";
  if (age <= 13) return "Middenbouw (U10–U13)";
  if (age <= 21) return "Bovenbouw (U14–U21)";
  return "Overig";
}

/**
 * Render a responsive overview of teams with optional filtering, optional grouping of youth teams by age category, and built-in loading and empty states.
 *
 * @param teams - Array of team objects to display.
 * @param teamType - Initial active filter: "all", "senior", "youth", or "club".
 * @param groupByAge - When true, group youth teams into age-category sections.
 * @param variant - Layout variant: "grid" for full cards or "compact" for a denser grid.
 * @param isLoading - When true, show a skeleton grid instead of team data.
 * @param emptyMessage - Message displayed when no teams match the current filter.
 * @param showFilters - When true, render filter buttons to switch between team types.
 * @param className - Optional className applied to the outer container.
 * @returns A JSX element representing the team overview layout.
 */
export function TeamOverview({
  teams,
  teamType = "all",
  groupByAge = false,
  variant = "grid",
  isLoading = false,
  emptyMessage = "Geen teams gevonden",
  showFilters = false,
  colorScheme = "light",
  className,
}: TeamOverviewProps) {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "senior" | "youth" | "club"
  >(teamType);

  // Sync activeFilter when teamType prop changes
  useEffect(() => {
    setActiveFilter(teamType);
  }, [teamType]);

  // Filter teams by type
  const filteredTeams = useMemo(() => {
    if (activeFilter === "all") return teams;
    return teams.filter((t) => t.teamType === activeFilter);
  }, [teams, activeFilter]);

  // Sort teams: youth first (by age), then senior (alphabetically), then club (alphabetically)
  const sortedTeams = useMemo(() => {
    const typeOrder: Record<string, number> = { youth: 0, senior: 1, club: 2 };

    return [...filteredTeams].sort((a, b) => {
      const aType = a.teamType || "senior";
      const bType = b.teamType || "senior";

      // First sort by team type (youth < senior < club)
      if (aType !== bType) {
        return (typeOrder[aType] ?? 3) - (typeOrder[bType] ?? 3);
      }

      // Within youth teams, sort by age (youngest first)
      if (aType === "youth") {
        return parseAgeGroup(a.ageGroup) - parseAgeGroup(b.ageGroup);
      }

      // Within other team types, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [filteredTeams]);

  // Group teams by age category if enabled, ordered Bovenbouw → Middenbouw → Onderbouw
  const groupedTeams = useMemo(() => {
    if (!groupByAge) return null;

    const tierOrder = [
      "Bovenbouw (U14–U21)",
      "Middenbouw (U10–U13)",
      "Onderbouw (U6–U9)",
      "Overig",
    ];

    const groups: Record<string, TeamData[]> = {};
    sortedTeams.forEach((team) => {
      const category =
        team.teamType === "youth" ? getAgeCategory(team.ageGroup) : "Overig";
      if (!groups[category]) groups[category] = [];
      groups[category].push(team);
    });

    // Return ordered map
    const ordered: Record<string, TeamData[]> = {};
    for (const tier of tierOrder) {
      if (groups[tier]) ordered[tier] = groups[tier];
    }
    // Add any unexpected categories
    for (const key of Object.keys(groups)) {
      if (!ordered[key]) ordered[key] = groups[key];
    }
    return ordered;
  }, [sortedTeams, groupByAge]);

  const isCompact = variant === "compact";
  const isDark = colorScheme === "dark";

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-4 auto-rows-fr",
          isCompact
            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          className,
        )}
        aria-label="Teams laden..."
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <TeamCard
            key={i}
            name=""
            href=""
            isLoading
            variant={isCompact ? "compact" : "default"}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (sortedTeams.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-12",
          isDark ? "text-white/60 text-center" : "text-gray-500 text-center",
          className,
        )}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const filterButtons = showFilters && (
    <div className="flex flex-wrap gap-2 mb-6">
      {(["all", "senior", "youth", "club"] as const).map((filter) => (
        <button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          aria-pressed={activeFilter === filter}
          className={cn(
            "px-4 py-2 rounded-sm text-sm font-medium transition-colors",
            activeFilter === filter
              ? "bg-kcvv-green-bright text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          )}
        >
          {filter === "all" && "Alle teams"}
          {filter === "senior" && "Senioren"}
          {filter === "youth" && "Jeugd"}
          {filter === "club" && "Club"}
        </button>
      ))}
    </div>
  );

  // Grouped display for youth teams
  if (groupedTeams && Object.keys(groupedTeams).length > 0) {
    return (
      <div className={className}>
        {filterButtons}
        <div className="space-y-8">
          {Object.entries(groupedTeams).map(([category, categoryTeams]) => (
            <section key={category}>
              <h3
                className={cn(
                  "text-lg font-bold mb-4 font-title",
                  isDark ? "text-white" : "text-gray-900",
                )}
              >
                {category}
              </h3>
              <div
                className={cn(
                  "grid gap-4 auto-rows-fr",
                  isCompact
                    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {categoryTeams.map((team) => (
                  <TeamCard
                    key={team.id || team.href}
                    {...team}
                    variant={isCompact ? "compact" : "default"}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  // Standard grid display
  return (
    <div className={className}>
      {filterButtons}
      <div
        className={cn(
          "grid gap-4 auto-rows-fr",
          isCompact
            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {sortedTeams.map((team) => (
          <TeamCard
            key={team.id || team.href}
            {...team}
            variant={isCompact ? "compact" : "default"}
          />
        ))}
      </div>
    </div>
  );
}
