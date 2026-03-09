/**
 * TeamRoster Component
 *
 * Player grid showing full team roster grouped by position.
 * Displays PlayerCard components organized by position (GK, DEF, MID, FWD).
 *
 * Features:
 * - Players grouped by position (Keeper, Verdediger, Middenvelder, Aanvaller)
 * - Position section headers with player count
 * - Optional staff display (coaches, trainers) with unified card design
 * - Compact list view variant
 * - Loading skeleton grid
 * - Empty state handling
 */

import { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { PlayerCard, type PlayerCardProps } from "../../player/PlayerCard";
import { NumberBadge } from "@/components/shared/NumberBadge";
import { CARD_COLORS } from "@/lib/utils/card-tokens";

export interface RosterPlayer extends Omit<
  PlayerCardProps,
  "variant" | "isLoading"
> {
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
  /** Role (e.g., Hoofdtrainer, Assistent-trainer) */
  role: string;
  /** Short role code displayed like jersey number (e.g., T1, T2, TK, TVJO, PDG) */
  roleCode?: string;
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
  /** Layout variant */
  variant?: "grid" | "compact";
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

/**
 * Return the numeric sort order associated with a position key.
 *
 * @param position - Internal position key (e.g., a value from POSITION_CONFIG)
 * @returns The numeric order for `position`, or `99` when the position is not configured
 */
function getPositionOrder(position: string): number {
  return POSITION_CONFIG[position]?.order ?? 99;
}

/**
 * Get the display label for a roster position, choosing singular or plural form.
 *
 * @param position - The position key used to look up configured labels
 * @param count - The number of players in that position; determines singular vs plural form
 * @returns The singular label when `count` is 1, the plural label otherwise, or the original `position` if no configuration exists
 */
function getPositionLabel(position: string, count: number): string {
  const config = POSITION_CONFIG[position];
  if (!config) return position;
  return count === 1 ? config.label : config.labelPlural;
}

/**
 * Render a team's roster with optional grouping by position, loading skeletons, an empty state, and an optional staff section.
 *
 * @param groupByPosition - When true, players are grouped and rendered by position order; when false, players render in a single grid.
 * @param showStaff - When true and `staff` is non-empty, render a "Technische Staf" section below the roster.
 * @param variant - Layout variant: `"compact"` uses smaller, denser cards; other values use the default card size.
 * @param isLoading - When true, render skeleton placeholders instead of player and staff content.
 * @param emptyMessage - Message shown when there are no players to display (and staff is not shown).
 * @param className - Additional CSS classes applied to the outer container.
 * @returns A React element containing the roster layout.
 */
export function TeamRoster({
  players,
  staff = [],
  teamName = "Team",
  groupByPosition = true,
  showStaff = false,
  variant = "grid",
  isLoading = false,
  emptyMessage = "Geen spelers gevonden",
  staffSectionLabel = "Technische Staf",
  className,
}: TeamRosterProps) {
  const isCompact = variant === "compact";

  // Sort players by position order, then by number
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const posA = getPositionOrder(a.position);
      const posB = getPositionOrder(b.position);
      if (posA !== posB) return posA - posB;
      // Within same position, sort by number
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

    // Sort groups by position order
    return Object.entries(groups).sort(
      ([posA], [posB]) => getPositionOrder(posA) - getPositionOrder(posB),
    );
  }, [sortedPlayers, groupByPosition]);

  // Loading skeleton
  if (isLoading) {
    // Flat grid skeleton when not grouping by position
    if (!groupByPosition) {
      return (
        <div
          className={cn("space-y-8", className)}
          aria-label={`${teamName} selectie laden...`}
          role="status"
        >
          <div
            className={cn(
              "grid gap-6",
              isCompact
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            )}
          >
            {Array.from({ length: 8 }).map((_, j) => (
              <PlayerCard
                key={j}
                firstName=""
                lastName=""
                position=""
                href=""
                isLoading
                variant={isCompact ? "compact" : "default"}
              />
            ))}
          </div>
        </div>
      );
    }

    // Grouped skeleton when grouping by position
    return (
      <div
        className={cn("space-y-8", className)}
        aria-label={`${teamName} selectie laden...`}
        role="status"
      >
        {/* Position section skeletons */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            {/* Header skeleton */}
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
            {/* Player cards skeleton */}
            <div
              className={cn(
                "grid gap-6",
                isCompact
                  ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              )}
            >
              {Array.from({ length: i === 1 ? 2 : i === 4 ? 3 : 4 }).map(
                (_, j) => (
                  <PlayerCard
                    key={j}
                    firstName=""
                    lastName=""
                    position=""
                    href=""
                    isLoading
                    variant={isCompact ? "compact" : "default"}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state (no players and no staff to show)
  if (sortedPlayers.length === 0 && (!showStaff || staff.length === 0)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-12",
          "text-gray-500 text-center",
          className,
        )}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const gridClasses = cn(
    "grid gap-6",
    isCompact
      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  );

  // Staff section content - unified card design matching PlayerCard
  const staffSection =
    showStaff && staff.length > 0 ? (
      <section className="mt-12">
        {staffSectionLabel != null && (
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 font-title">
            {staffSectionLabel}
            <span className="text-sm font-normal text-gray-500">
              ({staff.length})
            </span>
          </h3>
        )}
        <div className={gridClasses}>
          {staff.map((member, idx) => (
            <article
              key={member.id ?? `${member.firstName}-${member.lastName}-${idx}`}
              className="staff-card group h-full"
            >
              <div
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-sm h-full",
                  "bg-white",
                  "border border-[#edeff4]",
                  "shadow-sm",
                  "transition-shadow duration-200 ease-out",
                  "hover:shadow-lg",
                )}
              >
                {/* Image Section - fixed height with contained image */}
                <div
                  className={cn(
                    "relative overflow-hidden flex-shrink-0",
                    "bg-[#edeff4]",
                    isCompact ? "h-[200px]" : "h-[200px] lg:h-[320px]",
                  )}
                >
                  {/* 3D Role code badge using NumberBadge */}
                  {member.roleCode && (
                    <NumberBadge
                      value={member.roleCode}
                      color="navy"
                      size={isCompact ? "sm" : "md"}
                    />
                  )}

                  {/* Staff image container - z-6 to be above badge (z-5), slides left on hover */}
                  <div
                    className={cn(
                      "absolute inset-0 z-[6]",
                      "transition-transform duration-300 ease-in-out",
                      "group-hover:-translate-x-[30px]",
                    )}
                  >
                    {member.imageUrl ? (
                      <Image
                        src={member.imageUrl}
                        alt={`${member.firstName} ${member.lastName}`}
                        fill
                        className="object-contain object-bottom"
                        sizes={
                          isCompact
                            ? "180px"
                            : "(max-width: 960px) 232px, 299px"
                        }
                      />
                    ) : (
                      /* Staff placeholder silhouette - sized to match real photos */
                      <div className="absolute inset-0 flex items-end justify-center">
                        <svg
                          className={cn(
                            "text-[#cacaca]",
                            isCompact
                              ? "w-[120px] h-[155px]"
                              : "w-[160px] h-[160px] lg:w-[210px] lg:h-[240px]",
                          )}
                          fill="currentColor"
                          viewBox="0 0 24 32"
                          aria-hidden="true"
                        >
                          {/* Staff silhouette with tie detail */}
                          <path d="M12 0C8.7 0 6 2.7 6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 14c-6.6 0-12 3.4-12 8v10h24V22c0-4.6-5.4-8-12-8z" />
                          <path
                            d="M12 14l-1.5 4 1.5 8 1.5-8-1.5-4z"
                            fill="#b0b0b0"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Subtle gradient overlay at bottom of image */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[40%] z-[3] pointer-events-none"
                    style={{
                      background: `linear-gradient(0deg, ${CARD_COLORS.gradient.navy}40 0%, transparent 100%)`,
                    }}
                    aria-hidden="true"
                  />
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* First name - semibold */}
                  <div
                    className={cn(
                      "text-gray-900 uppercase font-semibold truncate",
                      isCompact ? "text-lg" : "text-xl lg:text-2xl",
                    )}
                    style={{
                      fontFamily:
                        "quasimoda, acumin-pro, Montserrat, sans-serif",
                      lineHeight: 1.2,
                    }}
                  >
                    {member.firstName}
                  </div>

                  {/* Last name - thin */}
                  <div
                    className={cn(
                      "text-gray-900 uppercase font-thin truncate",
                      isCompact ? "text-lg" : "text-xl lg:text-2xl",
                    )}
                    style={{
                      fontFamily:
                        "quasimoda, acumin-pro, Montserrat, sans-serif",
                      lineHeight: 1.2,
                    }}
                  >
                    {member.lastName}
                  </div>

                  {/* Role */}
                  <div
                    className={cn(
                      "text-gray-500 mt-1",
                      isCompact ? "text-xs" : "text-sm",
                    )}
                  >
                    {member.role}
                  </div>
                </div>
              </div>
            </article>
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 font-title">
                {getPositionLabel(position, positionPlayers.length)}
                <span className="text-sm font-normal text-gray-500">
                  ({positionPlayers.length})
                </span>
              </h3>
              <div className={gridClasses}>
                {positionPlayers.map((player, idx) => (
                  <PlayerCard
                    key={
                      player.id ??
                      player.href ??
                      `${player.firstName}-${player.lastName}-${idx}`
                    }
                    {...player}
                    variant={isCompact ? "compact" : "default"}
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
      <div className={gridClasses}>
        {sortedPlayers.map((player, idx) => (
          <PlayerCard
            key={
              player.id ??
              player.href ??
              `${player.firstName}-${player.lastName}-${idx}`
            }
            {...player}
            variant={isCompact ? "compact" : "default"}
          />
        ))}
      </div>
      {staffSection}
    </div>
  );
}
