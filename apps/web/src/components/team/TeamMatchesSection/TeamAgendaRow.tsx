"use client";

/**
 * <TeamAgendaRow> — one match row in the team matches agenda.
 *
 * Responsive (one component, one sm breakpoint ~640px):
 *   A · desktop = symmetric scoreboard: [stub][home crest+name][score/time][away name+crest]
 *   B · mobile  = KCVV-centric column:  [stub][opponent crest+name+comp][home/away icon][score/time]
 *
 * Design lock: docs/design/mockups/phase-6-team/detail-ia-locked.md §3
 */
import Link from "next/link";
import { DateTime } from "luxon";
import { Crest, PRESS_DOWN_CLASSES } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";
import {
  getResultColor,
  isPlayedMatch,
  OUTCOME_UNDERLINE,
} from "@/lib/utils/match-display";
import { House, Bus } from "@/lib/icons.redesign";
import type { ScheduleMatch } from "@/components/match/types";

export interface TeamAgendaRowProps {
  match: ScheduleMatch;
  /**
   * PSD team ID of the KCVV team being rendered (used to determine home/away
   * when is_home is absent). Passed down from the page.
   */
  kcvvTeamId?: number;
  /** When true, renders as the featured "Eerstvolgende" card (jersey-deep bg). */
  featured?: boolean;
  /**
   * When false, omits the leading date stub. Used where the row is already
   * grouped under a known day (the `/kalender` grid's selected-day detail) so
   * the day/month stub is redundant. Defaults to `true` — the team-detail
   * agenda (6.C) spans many dates and always shows it.
   */
  showDateStub?: boolean;
  /**
   * Fired when the row is clicked through to the match detail. Lets a host
   * surface attach navigation-time side-effects (e.g. `/kalender`'s
   * `kalender_item_click` analytics) without re-implementing the row.
   */
  onNavigate?: () => void;
  /**
   * Optional jersey-deep label prepended to the competition caption (P2), e.g.
   * the KCVV squad that played ("A-Ploeg" · 3e Prov.). Used by the
   * opponent-history (`/tegenstander`) page, where one opponent can mix
   * A-Ploeg / B-Ploeg / youth and the team must be named on the row. Distinct
   * from `team.teamLabel` (the opponent's designation chip beside its name).
   */
  captionLabel?: string;
  /**
   * Label shown in the score slot for not-yet-played matches instead of the
   * kickoff time (e.g. "Gepland" on the opponent-history page, where a precise
   * future kickoff is irrelevant). Rendered in the mono caption register. When
   * omitted, the kickoff time is shown — the team-detail default, where the
   * next fixture's start time matters.
   */
  upcomingLabel?: string;
  className?: string;
}

type Outcome = "win" | "draw" | "loss" | null;

function computeOutcome(
  match: ScheduleMatch,
  isHome: boolean | undefined,
): Outcome {
  if (match.status !== "finished") return null;
  if (
    typeof match.homeScore !== "number" ||
    typeof match.awayScore !== "number" ||
    isHome === undefined
  ) {
    return null;
  }
  return getResultColor(match.homeScore, match.awayScore, isHome);
}

function formatDay(date: Date): string {
  return DateTime.fromJSDate(date).setLocale("nl").toFormat("d");
}

function formatMonth(date: Date): string {
  return DateTime.fromJSDate(date)
    .setLocale("nl")
    .toFormat("MMM")
    .replace(/\.$/, "")
    .toLowerCase();
}

function formatKickoff(match: ScheduleMatch): string {
  if (match.time) return match.time;
  return DateTime.fromJSDate(match.date).setLocale("nl").toFormat("HH:mm");
}

/**
 * Team name with an optional designation suffix ("A" / "B" / "U23"). The club
 * name truncates within the available space; the suffix stays pinned beside it
 * so the opponent's specific team (e.g. "… U23") is always legible.
 */
function TeamName({
  team,
  featured,
  bold = false,
  align = "left",
}: {
  team: ScheduleMatch["homeTeam"];
  featured: boolean;
  bold?: boolean;
  align?: "left" | "right";
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 items-baseline gap-1.5",
        align === "right" && "justify-end",
      )}
    >
      <span
        className={cn(
          "min-w-0 truncate text-sm",
          align === "right" && "text-right",
          featured ? "text-white" : "text-ink",
          bold && "font-semibold",
        )}
      >
        {team.name}
      </span>
      {team.teamLabel ? (
        <span
          className={cn(
            "shrink-0 font-mono text-[10px] font-semibold tracking-wide",
            // White on jersey-deep / ink-muted on cream — matches the
            // competition caption's contrast-safe tones.
            featured ? "text-white" : "text-ink-muted",
          )}
        >
          {team.teamLabel}
        </span>
      ) : null}
    </span>
  );
}

export function TeamAgendaRow({
  match,
  kcvvTeamId,
  featured = false,
  showDateStub = true,
  onNavigate,
  captionLabel,
  upcomingLabel,
  className,
}: TeamAgendaRowProps) {
  // Prefer match.is_home (provided by BFF); fall back to comparing kcvvTeamId
  // against the home team's id when the BFF field is absent.
  const isHome: boolean | undefined =
    match.isHome ??
    (kcvvTeamId !== undefined ? kcvvTeamId === match.homeTeam.id : undefined);

  const outcome = computeOutcome(match, isHome);
  const isPlayed = isPlayedMatch(match.status);

  // White on jersey-deep (4.56:1) passes WCAG AA; cream (#f5f1e6 → 4.04:1) does not.
  const monoClass = featured ? "text-white" : "text-ink-muted";

  const hasScoreline =
    isPlayed &&
    typeof match.homeScore === "number" &&
    typeof match.awayScore === "number";
  // Show the upcoming label ("Gepland") only for not-yet-played matches when one
  // was supplied. Gating on status (not merely the absence of a scoreline) keeps
  // a finished match with missing scores on the kickoff time rather than wrongly
  // reading "Gepland".
  const showUpcomingLabel = !isPlayed && upcomingLabel != null;
  const scoreOrTime = hasScoreline
    ? `${match.homeScore} – ${match.awayScore}`
    : showUpcomingLabel
      ? upcomingLabel
      : formatKickoff(match);

  // Scorelines and kickoff times use the big display face; the "Gepland" label
  // drops to the mono caption register (cf. the mockup `.score.sched`).
  const scoreToneClass = showUpcomingLabel
    ? monoClass
    : featured
      ? "text-white"
      : "text-ink";

  const outlineShadow = outcome ? OUTCOME_UNDERLINE[outcome] : undefined;

  const cardBase = cn(
    "flex items-stretch gap-0",
    "border-2",
    PRESS_DOWN_CLASSES,
    featured
      ? // Soft ink-muted offset (the design-system dark-card shadow, cf.
        // `--shadow-paper-sm-soft`) — a cream shadow vanished against the cream
        // page, and a dark-green one would blend into the jersey-deep body.
        "bg-jersey-deep border-jersey-deep text-white shadow-[2px_2px_0_0_var(--color-ink-muted)]"
      : "bg-cream border-ink text-ink shadow-[2px_2px_0_0_var(--color-ink)]",
    className,
  );

  const stubBorder = featured
    ? "border-r-2 border-dashed border-cream/40"
    : "border-r-2 border-dashed border-ink/30";

  const day = formatDay(match.date);
  const month = formatMonth(match.date);

  const matchLabel = `${match.homeTeam.name} – ${match.awayTeam.name}, ${day} ${month}`;

  // Caption (P2) shared by both layouts: an optional jersey-deep squad label
  // (e.g. "A-Ploeg") followed by the competition. Rendered once, reused below.
  const captionContent =
    captionLabel || match.competition ? (
      <>
        {captionLabel ? (
          <span
            className={cn(
              "font-semibold",
              featured ? "text-warm" : "text-jersey-deep",
            )}
          >
            {captionLabel}
          </span>
        ) : null}
        {captionLabel && match.competition ? " · " : null}
        {match.competition}
      </>
    ) : null;

  return (
    <Link
      href={`/wedstrijd/${match.id}`}
      aria-label={matchLabel}
      onClick={onNavigate}
      className="focus-visible:outline-ink block no-underline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <article
        data-testid="team-agenda-row"
        data-featured={featured}
        className={cardBase}
      >
        {/* Date stub */}
        {showDateStub ? (
          <div
            className={cn(
              "flex shrink-0 flex-col items-center justify-center gap-0 px-3 py-3",
              stubBorder,
              featured ? "bg-jersey-deep" : "bg-cream-soft/30",
            )}
            aria-label={`${day} ${month}`}
          >
            <span
              className={cn(
                "font-display-big text-[18px] leading-none",
                featured ? "text-white" : "text-ink",
              )}
            >
              {day}
            </span>
            <span
              className={cn(
                "font-mono text-[8px] tracking-widest uppercase",
                monoClass,
              )}
            >
              {month}
            </span>
          </div>
        ) : null}

        {/* Desktop layout (sm+): symmetric scoreboard */}
        <div className="hidden w-full items-center gap-2 px-3 py-2 sm:flex">
          {/* Home side */}
          <div
            className="flex min-w-0 flex-1 items-center gap-2"
            title={match.homeTeam.name}
          >
            <Crest name={match.homeTeam.name} logo={match.homeTeam.logo} />
            <TeamName
              team={match.homeTeam}
              featured={featured}
              bold={isHome === true}
            />
          </div>

          {/* Score / time + competition caption */}
          <div className="flex shrink-0 flex-col items-center gap-0.5 px-3">
            <span
              className={cn(
                "leading-none",
                showUpcomingLabel
                  ? "font-mono text-[11px] font-semibold tracking-wider uppercase"
                  : "font-display-big text-[18px] tabular-nums",
                scoreToneClass,
              )}
              style={
                outlineShadow
                  ? { boxShadow: outlineShadow, padding: "0 8px" }
                  : { padding: "0 8px" }
              }
            >
              {scoreOrTime}
            </span>
            {captionContent ? (
              <span
                className={cn(
                  "font-mono text-[9px] tracking-wider uppercase",
                  monoClass,
                )}
              >
                {captionContent}
              </span>
            ) : null}
          </div>

          {/* Away side */}
          <div
            className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2"
            title={match.awayTeam.name}
          >
            <Crest name={match.awayTeam.name} logo={match.awayTeam.logo} />
            <TeamName
              team={match.awayTeam}
              featured={featured}
              bold={isHome === false}
              align="right"
            />
          </div>
        </div>

        {/* Mobile layout: KCVV-centric column */}
        <div className="flex w-full items-center gap-2 px-3 py-2 sm:hidden">
          {/* Opponent crest + name + competition */}
          {(() => {
            const opponent = isHome ? match.awayTeam : match.homeTeam;
            const VenueIcon = isHome ? House : Bus;
            return (
              <>
                <Crest name={opponent.name} logo={opponent.logo} />
                <div className="min-w-0 flex-1" title={opponent.name}>
                  <TeamName team={opponent} featured={featured} bold />
                  {captionContent ? (
                    <span
                      className={cn(
                        "font-mono text-[9px] tracking-wider uppercase",
                        monoClass,
                      )}
                    >
                      {captionContent}
                    </span>
                  ) : null}
                </div>
                <VenueIcon
                  size={14}
                  aria-label={isHome ? "Thuiswedstrijd" : "Uitwedstrijd"}
                  className={cn(
                    "shrink-0",
                    featured ? "text-white" : "text-ink-muted",
                  )}
                />
                <span
                  className={cn(
                    "shrink-0 leading-none",
                    showUpcomingLabel
                      ? "font-mono text-[11px] font-semibold tracking-wider uppercase"
                      : "font-display-big text-[16px] tabular-nums",
                    scoreToneClass,
                  )}
                  style={
                    outlineShadow
                      ? { boxShadow: outlineShadow, padding: "0 6px" }
                      : { padding: "0 6px" }
                  }
                >
                  {scoreOrTime}
                </span>
              </>
            );
          })()}
        </div>
      </article>
    </Link>
  );
}
