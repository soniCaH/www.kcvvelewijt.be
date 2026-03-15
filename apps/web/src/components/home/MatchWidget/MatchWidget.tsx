import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { SectionDivider } from "@/components/design-system";
import { formatMatchDate } from "@/lib/utils/dates";
import type { UpcomingMatch } from "@/components/match/types";

export interface MatchWidgetProps {
  /** The match to display — typically the first result from BffService.getNextMatches() */
  match: UpcomingMatch;
  /** Team label shown in the section overline (default: "A-Ploeg") */
  teamLabel?: string;
}

/**
 * Homepage match widget — hero-style dark-green section showing the
 * next (or most recent) match for the first team.
 *
 * Sits between FeaturedArticles (bg-kcvv-black) and LatestNews (bg-gray-100).
 * Diagonal cuts at top and bottom connect all three sections.
 *
 * Parent sections must set their own SectionDivider to complete the boundary:
 * - FeaturedArticles: `<SectionDivider color="kcvv-green-dark" position="bottom" />`
 * - LatestNews: `<SectionDivider color="kcvv-green-dark" position="top" />`
 *
 * @example
 * ```tsx
 * <MatchWidget match={upcomingMatches[0]} teamLabel="A-Ploeg" />
 * ```
 */
export function MatchWidget({
  match,
  teamLabel = "A-Ploeg",
}: MatchWidgetProps) {
  const isFinished =
    match.status === "finished" || match.status === "forfeited";
  const isPostponed =
    match.status === "postponed" || match.status === "stopped";
  const isForfeited = match.status === "forfeited";

  const hasScore =
    isFinished &&
    match.homeTeam.score !== undefined &&
    match.awayTeam.score !== undefined;

  return (
    <section
      aria-label={`Wedstrijd: ${match.homeTeam.name} vs ${match.awayTeam.name}`}
      className="relative overflow-hidden bg-kcvv-green-dark"
    >
      {/* Top diagonal — reveals kcvv-black from FeaturedArticles */}
      <SectionDivider color="kcvv-black" position="top" />

      {/* Bottom diagonal — reveals gray-100 from LatestNews */}
      <SectionDivider color="gray-100" position="bottom" />

      <div className="relative z-20 py-24 px-4 md:px-8 max-w-[1280px] mx-auto">
        {/* Overline label */}
        <p className="flex items-center justify-center gap-2 mb-6 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
          <span aria-hidden="true" className="block w-5 h-px bg-white/30" />
          VOLGENDE WEDSTRIJD · {teamLabel}
          <span aria-hidden="true" className="block w-5 h-px bg-white/30" />
        </p>

        {/* 3-column grid: home | center | away */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 lg:gap-8">
          {/* Home team */}
          <TeamColumn team={match.homeTeam} align="home" />

          {/* Center: VS / score / meta */}
          <div className="flex flex-col items-center gap-1 lg:gap-2 min-w-[72px] lg:min-w-[140px]">
            {isPostponed && (
              <StatusBadge>
                {match.status === "stopped" ? "GESTOPT" : "UITGESTELD"}
              </StatusBadge>
            )}

            {isForfeited && !isPostponed && <StatusBadge>FF</StatusBadge>}

            {!isPostponed && !isForfeited && hasScore && (
              <span className="text-4xl lg:text-5xl font-black text-white font-mono leading-none tracking-tight">
                {match.homeTeam.score} – {match.awayTeam.score}
              </span>
            )}

            {!isPostponed && !isFinished && (
              <span className="text-4xl lg:text-5xl font-black text-kcvv-green leading-none tracking-tight">
                VS
              </span>
            )}

            {/* Date / time / competition — always shown unless postponed */}
            {!isPostponed && (
              <div className="flex flex-col items-center gap-0.5 mt-1 lg:mt-2">
                <span className="text-[11px] sm:text-xs lg:text-sm font-semibold text-white/70">
                  {formatMatchDate(match.date)}
                </span>
                {match.time && (
                  <span className="text-[11px] sm:text-xs lg:text-sm font-semibold text-white/70">
                    {match.time}
                  </span>
                )}
                {match.competition && (
                  <span className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/40 px-2.5 py-0.5 rounded-sm">
                    {match.competition}
                    {match.venue ? ` · ${match.venue}` : ""}
                  </span>
                )}
              </div>
            )}

            {isPostponed && match.competition && (
              <span className="mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/40 px-2.5 py-0.5 rounded-sm">
                {match.competition}
              </span>
            )}
          </div>

          {/* Away team */}
          <TeamColumn team={match.awayTeam} align="away" />
        </div>
      </div>
    </section>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface TeamColumnProps {
  team: UpcomingMatch["homeTeam"];
  align: "home" | "away";
}

function TeamColumn({ team, align }: TeamColumnProps) {
  const isHome = align === "home";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 lg:gap-3",
        isHome ? "items-center lg:items-end" : "items-center lg:items-start",
      )}
    >
      <TeamLogo logo={team.logo} name={team.name} />
      <span
        className={cn(
          "text-[11px] sm:text-sm lg:text-2xl xl:text-3xl font-black uppercase tracking-tight text-white line-clamp-2 leading-tight",
          isHome ? "text-center lg:text-right" : "text-center lg:text-left",
        )}
      >
        {team.name}
      </span>
    </div>
  );
}

function TeamLogo({ logo, name }: { logo?: string; name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="relative w-12 h-12 lg:w-[72px] lg:h-[72px] flex items-center justify-center rounded bg-white/10 border-2 border-white/15 shrink-0 overflow-hidden">
      {logo ? (
        <Image
          src={logo}
          alt={`${name} logo`}
          fill
          className="object-contain p-1"
          sizes="(max-width: 1024px) 48px, 72px"
        />
      ) : (
        <span className="text-kcvv-green font-black text-lg lg:text-2xl">
          {initials}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 px-3 py-1 rounded-sm">
      {children}
    </span>
  );
}
