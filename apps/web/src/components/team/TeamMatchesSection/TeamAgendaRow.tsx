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
import Image from "next/image";
import Link from "next/link";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils/cn";
import { getResultColor } from "@/lib/utils/match-display";
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

function Crest({
  name,
  logo,
  size = 20,
}: {
  name: string;
  logo?: string;
  size?: number;
}) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = name.trim().charAt(0).toLocaleUpperCase("nl-BE") || "·";
  return (
    <span
      aria-hidden="true"
      className="text-ink-muted flex shrink-0 items-center justify-center rounded-full border border-current font-mono text-[10px] leading-none"
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}

const OUTCOME_SHADOW: Record<"win" | "draw" | "loss", string | undefined> = {
  win: "inset 0 -9px 0 color-mix(in srgb, var(--color-jersey-deep) 34%, var(--color-cream))",
  draw: undefined,
  loss: "inset 0 -9px 0 color-mix(in srgb, var(--color-alert) 38%, var(--color-cream))",
};

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
  className,
}: TeamAgendaRowProps) {
  // Prefer match.is_home (provided by BFF); fall back to comparing kcvvTeamId
  // against the home team's id when the BFF field is absent.
  const isHome: boolean | undefined =
    match.isHome ??
    (kcvvTeamId !== undefined ? kcvvTeamId === match.homeTeam.id : undefined);

  const outcome = computeOutcome(match, isHome);
  const isPlayed =
    match.status === "finished" ||
    match.status === "forfeited" ||
    match.status === "stopped";

  const scoreOrTime =
    isPlayed &&
    typeof match.homeScore === "number" &&
    typeof match.awayScore === "number"
      ? `${match.homeScore} – ${match.awayScore}`
      : formatKickoff(match);

  const outlineShadow = outcome ? OUTCOME_SHADOW[outcome] : undefined;

  const cardBase = cn(
    "flex items-stretch gap-0",
    "border-2 transition-all duration-300",
    "hover:-translate-y-0 hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
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

  // White on jersey-deep (4.56:1) passes WCAG AA; cream (#f5f1e6 → 4.04:1) does not.
  const monoClass = featured ? "text-white" : "text-ink-muted";

  const day = formatDay(match.date);
  const month = formatMonth(match.date);

  const matchLabel = `${match.homeTeam.name} – ${match.awayTeam.name}, ${day} ${month}`;

  return (
    <Link
      href={`/wedstrijd/${match.id}`}
      aria-label={matchLabel}
      className="focus-visible:outline-ink block no-underline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <article
        data-testid="team-agenda-row"
        data-featured={featured}
        className={cardBase}
      >
        {/* Date stub */}
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
                "font-display-big text-[18px] leading-none tabular-nums",
                featured ? "text-white" : "text-ink",
              )}
              style={
                outlineShadow
                  ? { boxShadow: outlineShadow, padding: "0 8px" }
                  : { padding: "0 8px" }
              }
            >
              {scoreOrTime}
            </span>
            {match.competition ? (
              <span
                className={cn(
                  "font-mono text-[9px] tracking-wider uppercase",
                  monoClass,
                )}
              >
                {match.competition}
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
                  {match.competition ? (
                    <span
                      className={cn(
                        "font-mono text-[9px] tracking-wider uppercase",
                        monoClass,
                      )}
                    >
                      {match.competition}
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
                    "font-display-big shrink-0 text-[16px] leading-none tabular-nums",
                    featured ? "text-white" : "text-ink",
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
