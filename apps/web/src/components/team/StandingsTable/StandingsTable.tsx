import { Crest, MonoLabel } from "@/components/design-system";
import { isNumberlessTable } from "@/lib/utils/competitive-block-state";
import { cn } from "@/lib/utils/cn";
import { ScrollOverlay } from "@/components/design-system/ScrollHint/ScrollOverlay";
import type { RankingEntry } from "@kcvv/api-contract";

export interface StandingsTableProps {
  entries: readonly RankingEntry[];
  /** PSD team_id of the KCVV team to highlight. */
  highlightTeamId?: number;
  /** Name of the competition this table ranks. Also names the region, so a
   * team playing two phases gets two distinct landmark names instead of two
   * identical "Klassement" ones (#2631). */
  caption?: string;
}

/** The KCVV row/item tint. Shared between the numbered table's row, its
 * numberless-list equivalent, and (#2582 review M1) the three pinned cells
 * of the numbered table, which need the tint on the cell itself — a pinned
 * `<td>` paints its own opaque background over whatever the `<tr>` behind
 * it carries. */
const KCVV_TINT =
  "bg-[color-mix(in_srgb,var(--color-jersey-deep)_12%,var(--color-cream))]";
/** The inset left rule that reads as "this is the row" — drawn once, at the
 * row's true left edge, so it never needs repeating on more than one cell. */
const KCVV_ACCENT_RULE = "shadow-[inset_3px_0_0_var(--color-jersey-deep)]";

/**
 * The anchor group (#2476 rule 3): `#` + `Ploeg` pinned left, `Ptn` pinned
 * right, the middle columns (M/W/G/V/+/-) scrolling underneath. Applied
 * directly on those three columns' `<th>`/`<td>` elements (#2582 review
 * M1) rather than by position (`:nth-child`, `:last-child`) — position and
 * column identity happen to coincide today, but a `:last-child` selector
 * pins whatever is written last, not `Ptn`; an inserted ninth column would
 * silently move the pin without a single test noticing.
 *
 * `sticky`/`w-*`/`bg-cream` are unconditional: `position: sticky` is inert
 * in a track that isn't scrolling, and `bg-cream` already matches the
 * track's own background, so there is nothing to gate. Only the divider
 * shadows below are genuinely conditional — they mark a cut edge that
 * exists only once the table actually overflows.
 */
const ANCHOR_DIVIDER_CLASSES = [
  "[&>table>thead>tr>th:nth-child(2)]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.12)]",
  "[&>table>tbody>tr>td:nth-child(2)]:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.12)]",
  "[&>table>thead>tr>th:last-child]:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.12)]",
  "[&>table>tbody>tr>td:last-child]:shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.12)]",
].join(" ");

/** Crest + truncating team name, italic unless it's the KCVV row. The one
 * piece both the numbered table and the numberless list render identically.
 * `min-w-0` (not a positive floor) is what a flex item needs for `truncate`
 * to engage at all — the numbered table's overflow floor lives on the
 * `Ploeg` column itself (#2582 review M4), not here, since the numberless
 * list renders this same identity outside any scroll container. */
function ClubIdentity({
  teamName,
  teamLogo,
  isKcvv,
}: {
  teamName: string;
  teamLogo: string | undefined;
  isKcvv: boolean;
}) {
  return (
    <>
      <Crest name={teamName} logo={teamLogo} size={16} />
      <span
        className={cn(
          "font-display text-ink min-w-0 truncate",
          isKcvv ? "font-semibold not-italic" : "italic",
        )}
        title={teamName}
      >
        {teamName}
      </span>
    </>
  );
}

function NumberlessClubList({
  entries,
  highlightTeamId,
  caption,
}: {
  entries: readonly RankingEntry[];
  highlightTeamId: number | undefined;
  caption: string | undefined;
}) {
  return (
    <div
      data-testid="standings-table"
      data-variant="numberless"
      className="w-full"
      role="region"
      aria-label={caption ?? "De reeks"}
    >
      {caption ? (
        <p className="pb-2 text-left">
          <MonoLabel tone="muted">{caption}</MonoLabel>
        </p>
      ) : null}
      <ul className="font-mono text-xs">
        {entries.map((entry) => {
          const isKcvv = entry.team_id === highlightTeamId;
          return (
            <li
              key={entry.team_id}
              data-testid={isKcvv ? "standings-kcvv-row" : undefined}
              className={cn(
                "flex items-center gap-1.5 border-b border-[color:var(--color-paper-edge)] py-2 pr-4 pl-4",
                isKcvv && cn(KCVV_TINT, KCVV_ACCENT_RULE),
              )}
            >
              <ClubIdentity
                teamName={entry.team_name}
                teamLogo={entry.team_logo}
                isKcvv={isKcvv}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function StandingsTable({
  entries,
  highlightTeamId,
  caption,
}: StandingsTableProps) {
  if (entries.length === 0) return null;

  // Derived from the entries themselves rather than taken as a prop: a
  // `numberless` boolean a caller sets could disagree with the data it
  // passes alongside it, silently dropping every number from a table that
  // actually has them. This way that state cannot be expressed (#2636
  // finding 9).
  if (isNumberlessTable(entries)) {
    return (
      <NumberlessClubList
        entries={entries}
        highlightTeamId={highlightTeamId}
        caption={caption}
      />
    );
  }

  return (
    <div data-testid="standings-table" className="w-full">
      <ScrollOverlay
        role="region"
        ariaLabel={caption ?? "Klassement"}
        direction="right"
        overflowsClassName={ANCHOR_DIVIDER_CLASSES}
        // Insets the arrow + fade past the pinned `Ptn` column (fixed at
        // `w-14` below) so they no longer overlay it (#2582 review finding 3).
        chromeClassName="right-14"
      >
        <table className="w-full border-collapse font-mono text-xs">
          {caption ? (
            <caption className="pb-2 text-left">
              <MonoLabel tone="muted">{caption}</MonoLabel>
            </caption>
          ) : null}
          <thead>
            <tr className="border-ink border-b-2">
              <th
                scope="col"
                className="text-ink-muted bg-cream sticky left-0 z-10 w-12 py-2 pr-2 pl-4 text-left font-normal tracking-wider uppercase"
              >
                #
              </th>
              <th
                scope="col"
                className="text-ink-muted bg-cream sticky left-12 z-10 min-w-44 py-2 pr-3 text-left font-normal tracking-wider uppercase"
              >
                Ploeg
              </th>
              <th
                scope="col"
                className="text-ink-muted py-2 pr-2 text-right font-normal tracking-wider uppercase"
              >
                M
              </th>
              <th
                scope="col"
                className="text-ink-muted py-2 pr-2 text-right font-normal tracking-wider uppercase"
              >
                W
              </th>
              <th
                scope="col"
                className="text-ink-muted py-2 pr-2 text-right font-normal tracking-wider uppercase"
              >
                G
              </th>
              <th
                scope="col"
                className="text-ink-muted py-2 pr-2 text-right font-normal tracking-wider uppercase"
              >
                V
              </th>
              <th
                scope="col"
                className="text-ink-muted py-2 pr-2 text-right font-normal tracking-wider uppercase"
              >
                +/-
              </th>
              <th
                scope="col"
                className="text-ink-muted bg-cream sticky right-0 z-10 w-14 py-2 pr-4 text-right font-normal tracking-wider uppercase"
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
                    isKcvv && cn(KCVV_TINT, KCVV_ACCENT_RULE),
                  )}
                >
                  {/* Position — pinned left (anchor group) */}
                  <td
                    className={cn(
                      "text-ink-muted bg-cream sticky left-0 z-10 w-12 py-2 pr-2 pl-4",
                      isKcvv && cn(KCVV_TINT, KCVV_ACCENT_RULE),
                    )}
                  >
                    {entry.position}
                  </td>

                  {/* Team name + crest — pinned left (anchor group) */}
                  <td
                    className={cn(
                      "bg-cream sticky left-12 z-10 min-w-44 py-2 pr-3",
                      isKcvv && KCVV_TINT,
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <ClubIdentity
                        teamName={entry.team_name}
                        teamLogo={entry.team_logo}
                        isKcvv={isKcvv}
                      />
                    </span>
                  </td>

                  {/* M */}
                  <td className="text-ink py-2 pr-2 text-right">
                    {entry.played}
                  </td>

                  <td className="text-ink py-2 pr-2 text-right">{entry.won}</td>
                  <td className="text-ink py-2 pr-2 text-right">
                    {entry.drawn}
                  </td>
                  <td className="text-ink py-2 pr-2 text-right">
                    {entry.lost}
                  </td>

                  {/* Goal difference */}
                  <td className="text-ink py-2 pr-2 text-right">
                    {entry.goal_difference > 0
                      ? `+${entry.goal_difference}`
                      : entry.goal_difference}
                  </td>

                  {/* Points — mono bold (inherited mono from the table),
                      pinned right (anchor group). A standings column is the
                      textbook case for rule 3 (#2516): alignment comes from
                      the mono face, by construction, never from a
                      figure-style class — `tabular-nums` did nothing here,
                      and #2579 removes it from every cell in this table.
                      font-bold, not font-black (#2579 review): IBM Plex
                      Mono loads only up to 700, so 900 was already
                      clamping to 700. */}
                  <td
                    className={cn(
                      "text-ink bg-cream sticky right-0 z-10 w-14 py-2 pr-4 text-right font-bold",
                      isKcvv && KCVV_TINT,
                    )}
                  >
                    {entry.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollOverlay>
    </div>
  );
}
