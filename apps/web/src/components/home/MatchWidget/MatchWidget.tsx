import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { SectionDivider } from "@/components/design-system";
import { formatWidgetDate } from "@/lib/utils/dates";
import type { UpcomingMatch } from "@/components/match/types";

export interface MatchWidgetProps {
  /** The match to display — typically the first result from BffService.getNextMatches() */
  match: UpcomingMatch;
  /** Team label shown in the section overline (default: "A-Ploeg") */
  teamLabel?: string;
}

/**
 * Render a hero-style match card that displays the given match for the primary team.
 *
 * Shows team logos or initials, team names, match status (e.g., postponed, forfeited, finished),
 * the score or "VS"/"FT" indicator as appropriate, and date/competition metadata.
 *
 * @param match - The match data to display
 * @param teamLabel - Label used in the section overline (default: "A-Ploeg")
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

  const dateTime = [formatWidgetDate(match.date), match.time]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      aria-label={`Wedstrijd: ${match.homeTeam.name} vs ${match.awayTeam.name}`}
      className="relative overflow-hidden bg-kcvv-green-dark"
    >
      {/* Top diagonal — white cut in upper-left, pairs with FeaturedArticles' white bottom cut */}
      <SectionDivider color="white" position="top" />

      {/* Bottom diagonal — reveals gray-100 from LatestNews */}
      <SectionDivider color="gray-100" position="bottom" />

      <div className="relative z-20 py-24 px-4 md:px-8 max-w-[1280px] mx-auto">
        {/* Overline — left-aligned, single leading rule */}
        <p className="flex items-center gap-2 mb-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
          <span aria-hidden="true" className="block w-5 h-0.5 bg-white/30" />
          VOLGENDE WEDSTRIJD · {teamLabel}
        </p>

        {/* 3-column grid: home | center | away — items-center matches mockup */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 sm:gap-x-4 lg:gap-x-8">
          {/* Home team — logo + name stacked, right-aligned */}
          <TeamColumn team={match.homeTeam} align="home" />

          {/* Center — VS / score / badge + meta */}
          <div
            className={cn(
              "flex flex-col items-center gap-2 px-1 sm:px-2 lg:px-6",
              // Keep center column tall enough for postponed/forfeited so
              // team columns don't dwarf a lone badge
              (isPostponed || isForfeited) && "min-h-[80px] justify-center",
            )}
          >
            {isPostponed && (
              <StatusBadge>
                {match.status === "stopped" ? "GESTOPT" : "UITGESTELD"}
              </StatusBadge>
            )}

            {isForfeited && !isPostponed && <StatusBadge>FORFAIT</StatusBadge>}

            {!isPostponed && !isForfeited && hasScore && (
              <span
                className="font-title font-black text-white font-mono leading-none tracking-[-0.04em]"
                style={{ fontSize: "clamp(1.75rem, 8vw, 4rem)" }}
              >
                {match.homeTeam.score} – {match.awayTeam.score}
              </span>
            )}

            {!isPostponed && !isFinished && (
              <span
                className="font-title font-black text-kcvv-green-bright leading-none tracking-[-0.04em]"
                style={{ fontSize: "clamp(1.75rem, 8vw, 4rem)" }}
              >
                VS
              </span>
            )}

            {!isPostponed && isFinished && !isForfeited && !hasScore && (
              <span
                className="font-title font-black text-white font-mono leading-none tracking-[-0.04em]"
                style={{ fontSize: "clamp(1.75rem, 8vw, 4rem)" }}
              >
                FT
              </span>
            )}

            {/* Date · time + competition badge */}
            {!isPostponed && (
              <div className="flex flex-col items-center gap-1 mt-1 w-[36vw] sm:w-auto">
                <span className="text-[11px] sm:text-[13px] font-semibold text-white/70 text-center">
                  {dateTime}
                </span>
                {match.competition && (
                  <span className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] bg-white/10 text-white/40 px-2 sm:px-2.5 py-0.5 rounded-sm text-center leading-snug">
                    {match.competition}
                    {match.venue ? ` · ${match.venue}` : ""}
                  </span>
                )}
              </div>
            )}

            {isPostponed && match.competition && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] bg-white/10 text-white/40 px-2.5 py-0.5 rounded-sm">
                {match.competition}
              </span>
            )}
          </div>

          {/* Away team — logo + name stacked, left-aligned */}
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

/**
 * Renders a vertically stacked team column showing the team's logo and name, aligned for home or away placement.
 *
 * @param team - The team object containing at least `name` and optionally `logo`.
 * @param align - Layout alignment for the column; `"home"` right-aligns content, `"away"` left-aligns.
 * @returns The JSX element for the team column (logo above team name) with responsive sizing and alignment.
 */
function TeamColumn({ team, align }: TeamColumnProps) {
  const isHome = align === "home";

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        isHome ? "items-end" : "items-start",
      )}
    >
      <TeamLogo logo={team.logo} name={team.name} />
      <span
        className={cn(
          "font-title font-extrabold uppercase text-white line-clamp-2 leading-tight tracking-[-0.02em]",
          isHome ? "text-right" : "text-left",
        )}
        style={{ fontSize: "clamp(0.875rem, 4vw, 1.6rem)" }}
      >
        {team.name}
      </span>
    </div>
  );
}

/**
 * Renders a circular team logo box showing the provided image or, when absent, the team's initials (first letters of up to two words).
 *
 * @param logo - Optional URL of the team's logo; when present an image is rendered.
 * @param name - Team name used for the image alt text and to derive initials when no logo is provided.
 * @returns The logo element (image or initial placeholder) wrapped in a styled circular container.
 */
function TeamLogo({ logo, name }: { logo?: string; name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="relative w-12 h-12 sm:w-[72px] sm:h-[72px] flex items-center justify-center rounded bg-white/10 border-2 border-white/15 shrink-0 overflow-hidden">
      {logo ? (
        <Image
          src={logo}
          alt={`${name} logo`}
          fill
          className="object-contain p-1"
          sizes="(max-width: 640px) 64px, 72px"
        />
      ) : (
        <span className="text-kcvv-green-bright font-black text-2xl">
          {initials}
        </span>
      )}
    </div>
  );
}

/**
 * Renders a compact, uppercase status badge with orange styling.
 *
 * @param children - Content to display inside the badge
 * @returns A span element containing `children` styled as a small orange status badge
 */
function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 px-3 py-1 rounded-sm">
      {children}
    </span>
  );
}
