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
      ? "bg-jersey-deep border-jersey-deep text-white shadow-[2px_2px_0_0_var(--color-cream)]"
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
    <article
      data-testid="team-agenda-row"
      data-featured={featured}
      aria-label={matchLabel}
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
          <span
            className={cn(
              "min-w-0 truncate text-sm",
              featured ? "text-white" : "text-ink",
              isHome === true && "font-semibold",
            )}
          >
            {match.homeTeam.name}
          </span>
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
          <span
            className={cn(
              "min-w-0 truncate text-right text-sm",
              featured ? "text-white" : "text-ink",
              isHome === false && "font-semibold",
            )}
          >
            {match.awayTeam.name}
          </span>
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
                <span
                  className={cn(
                    "block truncate text-sm font-semibold",
                    featured ? "text-white" : "text-ink",
                  )}
                >
                  {opponent.name}
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
  );
}
