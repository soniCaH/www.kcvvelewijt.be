import { Crest } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import type { RankingEntry } from "@kcvv/api-contract";

export interface StandingsTableProps {
  entries: readonly RankingEntry[];
  /** PSD team_id of the KCVV team to highlight. */
  highlightTeamId?: number;
}

export function StandingsTable({
  entries,
  highlightTeamId,
}: StandingsTableProps) {
  if (entries.length === 0) return null;

  return (
    <div
      data-testid="standings-table"
      className="w-full overflow-x-auto"
      role="region"
      aria-label="Klassement"
    >
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-ink border-b-2">
            <th
              scope="col"
              className="text-ink-muted py-2 pr-2 pl-4 text-left tracking-wider uppercase"
            >
              #
            </th>
            <th
              scope="col"
              className="text-ink-muted py-2 pr-3 text-left tracking-wider uppercase"
            >
              Ploeg
            </th>
            <th
              scope="col"
              className="text-ink-muted py-2 pr-2 text-right tracking-wider uppercase"
            >
              M
            </th>
            {/* W/G/V hidden on mobile */}
            <th
              scope="col"
              className="text-ink-muted hidden py-2 pr-2 text-right tracking-wider uppercase sm:table-cell"
            >
              W
            </th>
            <th
              scope="col"
              className="text-ink-muted hidden py-2 pr-2 text-right tracking-wider uppercase sm:table-cell"
            >
              G
            </th>
            <th
              scope="col"
              className="text-ink-muted hidden py-2 pr-2 text-right tracking-wider uppercase sm:table-cell"
            >
              V
            </th>
            <th
              scope="col"
              className="text-ink-muted py-2 pr-2 text-right tracking-wider uppercase"
            >
              +/-
            </th>
            <th
              scope="col"
              className="text-ink-muted py-2 pr-4 text-right tracking-wider uppercase"
            >
              Ptn
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isKcvv = entry.team_id === highlightTeamId;
            return (
              <tr
                key={entry.team_id}
                data-testid={isKcvv ? "standings-kcvv-row" : undefined}
                className={cn(
                  "border-b border-[color:var(--color-paper-edge)]",
                  isKcvv &&
                    "bg-[color-mix(in_srgb,var(--color-jersey-deep)_12%,var(--color-cream))] shadow-[inset_3px_0_0_var(--color-jersey-deep)]",
                )}
              >
                {/* Position */}
                <td className="text-ink-muted py-2 pr-2 pl-4 tabular-nums">
                  {entry.position}
                </td>

                {/* Team name + crest */}
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-1.5">
                    <Crest
                      name={entry.team_name}
                      logo={entry.team_logo}
                      size={16}
                    />
                    <span
                      className={cn(
                        "font-display text-ink min-w-0 truncate",
                        isKcvv ? "font-semibold not-italic" : "italic",
                      )}
                      title={entry.team_name}
                    >
                      {entry.team_name}
                    </span>
                  </span>
                </td>

                {/* M */}
                <td className="text-ink py-2 pr-2 text-right tabular-nums">
                  {entry.played}
                </td>

                {/* W/G/V — hidden on mobile */}
                <td className="text-ink hidden py-2 pr-2 text-right tabular-nums sm:table-cell">
                  {entry.won}
                </td>
                <td className="text-ink hidden py-2 pr-2 text-right tabular-nums sm:table-cell">
                  {entry.drawn}
                </td>
                <td className="text-ink hidden py-2 pr-2 text-right tabular-nums sm:table-cell">
                  {entry.lost}
                </td>

                {/* Goal difference */}
                <td className="text-ink py-2 pr-2 text-right tabular-nums">
                  {entry.goal_difference > 0
                    ? `+${entry.goal_difference}`
                    : entry.goal_difference}
                </td>

                {/* Points — display-big black */}
                <td className="font-display-big text-ink py-2 pr-4 text-right font-black tabular-nums">
                  {entry.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
