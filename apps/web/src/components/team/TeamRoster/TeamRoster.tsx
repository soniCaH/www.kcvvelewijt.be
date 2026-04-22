/**
 * TeamRoster Component
 *
 * Player grid showing the full team roster grouped by position, with an
 * optional staff section. Renders the diagonal-cut `PlayerCard` and
 * `StaffCard` components on a single responsive grid.
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { PlayerCard, type PlayerCardProps } from "../../player/PlayerCard";
import { StaffCard } from "../StaffCard";

export interface RosterPlayer extends Omit<PlayerCardProps, "isLoading"> {
  /** Unique identifier */
  id?: string;
}

export interface StaffMember {
  /** Unique identifier */
  id?: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Role (e.g., trainer, afgevaardigde) — editorial, assigned per team */
  role: string;
  /** PSD function title displayed like jersey number (e.g., T1, T2) */
  functionTitle?: string;
  /** Photo URL */
  imageUrl?: string;
}

export interface TeamRosterProps {
  /** Array of player data */
  players: RosterPlayer[];
  /** Array of staff data (coaches, trainers) */
  staff?: StaffMember[];
  /** Team name for accessibility */
  teamName?: string;
  /** Group players by position with headers */
  groupByPosition?: boolean;
  /** Display staff section */
  showStaff?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Message when no players found */
  emptyMessage?: string;
  /** Label for the staff section heading. Pass null to suppress the heading. Defaults to "Technische Staf". */
  staffSectionLabel?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Position display names and order
 */
const POSITION_CONFIG: Record<
  string,
  { label: string; labelPlural: string; order: number }
> = {
  Keeper: { label: "Keeper", labelPlural: "Keepers", order: 1 },
  Verdediger: { label: "Verdediger", labelPlural: "Verdedigers", order: 2 },
  Middenvelder: {
    label: "Middenvelder",
    labelPlural: "Middenvelders",
    order: 3,
  },
  Aanvaller: { label: "Aanvaller", labelPlural: "Aanvallers", order: 4 },
};

function getPositionOrder(position: string): number {
  return POSITION_CONFIG[position]?.order ?? 99;
}

function getPositionLabel(position: string, count: number): string {
  const config = POSITION_CONFIG[position];
  if (!config) return position;
  return count === 1 ? config.label : config.labelPlural;
}

const GRID_CLASSES =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

/**
 * Render a team's roster with optional grouping by position, loading
 * skeletons, an empty state, and an optional staff section.
 */
export function TeamRoster({
  players,
  staff = [],
  teamName = "Team",
  groupByPosition = true,
  showStaff = false,
  isLoading = false,
  emptyMessage = "Geen spelers gevonden",
  staffSectionLabel = "Technische Staf",
  className,
}: TeamRosterProps) {
  // Sort players by position order, then by number
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const posA = getPositionOrder(a.position);
      const posB = getPositionOrder(b.position);
      if (posA !== posB) return posA - posB;
      return (a.number ?? 99) - (b.number ?? 99);
    });
  }, [players]);

  // Group players by position
  const groupedPlayers = useMemo(() => {
    if (!groupByPosition) return null;

    const groups: Record<string, RosterPlayer[]> = {};
    sortedPlayers.forEach((player) => {
      const pos = player.position;
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(player);
    });

    return Object.entries(groups).sort(
      ([posA], [posB]) => getPositionOrder(posA) - getPositionOrder(posB),
    );
  }, [sortedPlayers, groupByPosition]);

  // Loading skeleton
  if (isLoading) {
    if (!groupByPosition) {
      return (
        <div
          className={cn("space-y-8", className)}
          aria-label={`${teamName} selectie laden...`}
          role="status"
        >
          <div className={GRID_CLASSES}>
            {Array.from({ length: 8 }).map((_, j) => (
              <PlayerCard
                key={j}
                firstName=""
                lastName=""
                position=""
                href=""
                isLoading
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn("space-y-8", className)}
        aria-label={`${teamName} selectie laden...`}
        role="status"
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className={GRID_CLASSES}>
              {Array.from({ length: i === 1 ? 2 : i === 4 ? 3 : 4 }).map(
                (_, j) => (
                  <PlayerCard
                    key={j}
                    firstName=""
                    lastName=""
                    position=""
                    href=""
                    isLoading
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (sortedPlayers.length === 0 && (!showStaff || staff.length === 0)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-12 text-center text-gray-500",
          className,
        )}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Staff section content
  const staffSection =
    showStaff && staff.length > 0 ? (
      <section className="mt-12">
        {staffSectionLabel != null && (
          <h3 className="font-title mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
            {staffSectionLabel}
            <span className="text-sm font-normal text-gray-500">
              ({staff.length})
            </span>
          </h3>
        )}
        <div className={GRID_CLASSES}>
          {staff.map((member, idx) => (
            <StaffCard
              key={member.id ?? `${member.firstName}-${member.lastName}-${idx}`}
              firstName={member.firstName}
              lastName={member.lastName}
              role={member.role}
              functionTitle={member.functionTitle}
              imageUrl={member.imageUrl}
            />
          ))}
        </div>
      </section>
    ) : null;

  // Grouped display by position
  if (groupedPlayers && groupedPlayers.length > 0) {
    return (
      <div
        className={className}
        role="region"
        aria-label={`${teamName} selectie`}
      >
        <div className="space-y-10">
          {groupedPlayers.map(([position, positionPlayers]) => (
            <section key={position}>
              <h3 className="font-title mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                {getPositionLabel(position, positionPlayers.length)}
                <span className="text-sm font-normal text-gray-500">
                  ({positionPlayers.length})
                </span>
              </h3>
              <div className={GRID_CLASSES}>
                {positionPlayers.map((player, idx) => (
                  <PlayerCard
                    key={
                      player.id ??
                      player.href ??
                      `${player.firstName}-${player.lastName}-${idx}`
                    }
                    {...player}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
        {staffSection}
      </div>
    );
  }

  // Flat list display (no grouping)
  return (
    <div
      className={className}
      role="region"
      aria-label={`${teamName} selectie`}
    >
      <div className={GRID_CLASSES}>
        {sortedPlayers.map((player, idx) => (
          <PlayerCard
            key={
              player.id ??
              player.href ??
              `${player.firstName}-${player.lastName}-${idx}`
            }
            {...player}
          />
        ))}
      </div>
      {staffSection}
    </div>
  );
}
