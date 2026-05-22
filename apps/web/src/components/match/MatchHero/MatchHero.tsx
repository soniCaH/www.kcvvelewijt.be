import Image from "next/image";
import { DateTime } from "luxon";
import { TapedCard } from "@/components/design-system/TapedCard";
import { cn } from "@/lib/utils/cn";
import type { MatchStatus } from "../types";
import { MatchStatusBadge } from "../MatchStatusBadge";

function assertNever(value: never): never {
  throw new Error(`Unhandled MatchStatus variant: ${String(value)}`);
}

type MatchHeroKicker = "VOORBESCHOUWING" | "MATCHVERSLAG";

function getKicker(status: MatchStatus): MatchHeroKicker {
  switch (status) {
    case "scheduled":
      return "VOORBESCHOUWING";
    case "finished":
    case "forfeited":
    case "postponed":
    case "cancelled":
    case "stopped":
      return "MATCHVERSLAG";
    default:
      return assertNever(status);
  }
}

export interface MatchHeroTeam {
  name: string;
  logo?: string;
  score?: number;
}

export interface MatchHeroProps {
  homeTeam: MatchHeroTeam;
  awayTeam: MatchHeroTeam;
  date: Date;
  time?: string;
  venue?: string;
  status: MatchStatus;
  competition?: string;
  kcvvTeamLabel?: string;
  className?: string;
}

interface StubDateParts {
  weekday: string;
  day: string;
  month: string;
}

function formatStubDate(date: Date): StubDateParts {
  const dt = DateTime.fromJSDate(date).setLocale("nl");
  return {
    weekday: dt.toFormat("ccc").replace(/\.$/, "").toUpperCase(),
    day: dt.toFormat("d"),
    month: dt.toFormat("MMM").replace(/\.$/, "").toUpperCase(),
  };
}

function formatSeasonLabel(date: Date): string {
  const dt = DateTime.fromJSDate(date);
  const startYear = dt.month >= 7 ? dt.year : dt.year - 1;
  const endYear = startYear + 1;
  const tail = (y: number) => y.toString().slice(-2).padStart(2, "0");
  return `’${tail(startYear)}/’${tail(endYear)}`;
}

function buildCompetitionMeta(
  competition: string | undefined,
  kcvvTeamLabel: string | undefined,
  date: Date,
): string[] {
  const parts: string[] = [];
  if (competition) parts.push(competition);
  if (kcvvTeamLabel) parts.push(kcvvTeamLabel);
  parts.push(formatSeasonLabel(date));
  return parts;
}

function ScoreRegion({
  status,
  homeScore,
  awayScore,
}: {
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
}) {
  switch (status) {
    case "scheduled":
      return (
        <span
          data-score-state="vs"
          className="font-display text-ink-muted text-[22px] leading-none lowercase italic"
        >
          vs
        </span>
      );
    case "finished":
    case "forfeited":
    case "postponed":
    case "cancelled":
    case "stopped": {
      const homeLabel = typeof homeScore === "number" ? homeScore : "—";
      const awayLabel = typeof awayScore === "number" ? awayScore : "—";
      return (
        <div
          data-score-state="numeric"
          className="font-display-big text-ink flex items-baseline gap-2 text-[34px] leading-none font-black tabular-nums"
        >
          <span>{homeLabel}</span>
          <span className="text-ink-muted">{"—"}</span>
          <span>{awayLabel}</span>
        </div>
      );
    }
    default:
      return assertNever(status);
  }
}

function TeamShieldFallback({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toLocaleUpperCase("nl-BE") || "·";
  return (
    <span
      aria-hidden="true"
      className="border-ink bg-cream-soft text-ink font-display-big inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-[18px] leading-none font-black"
    >
      {initial}
    </span>
  );
}

function TeamSlot({
  team,
  align,
}: {
  team: MatchHeroTeam;
  align: "start" | "end";
}) {
  const isEnd = align === "end";
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        isEnd && "flex-row-reverse text-right",
      )}
    >
      {team.logo ? (
        <Image
          src={team.logo}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 shrink-0 object-contain"
        />
      ) : (
        <TeamShieldFallback name={team.name} />
      )}
      <span
        title={team.name.trim() || undefined}
        className="font-display text-ink min-w-0 flex-1 truncate text-[18px] leading-tight italic md:text-[22px]"
      >
        {team.name}
      </span>
    </div>
  );
}

export function MatchHero({
  homeTeam,
  awayTeam,
  date,
  time,
  venue,
  status,
  competition,
  kcvvTeamLabel,
  className,
}: MatchHeroProps) {
  const stubDate = formatStubDate(date);
  const kicker = getKicker(status);
  const metaParts = buildCompetitionMeta(competition, kcvvTeamLabel, date);

  return (
    <TapedCard
      as="section"
      bg="cream"
      shadow="md"
      padding="none"
      rotation="none"
      className={cn("relative overflow-visible", className)}
    >
      <div className="grid grid-cols-1 md:grid-cols-[110px_1fr]">
        {/* ── Stub (left zone) ─────────────────────────────────────── */}
        <div className="bg-cream-soft text-ink flex flex-col gap-3 border-b-2 border-dashed border-[var(--color-ink)] p-5 md:border-r-2 md:border-b-0">
          <div className="leading-none">
            <div className="font-display-big text-ink text-[20px] leading-none font-black md:text-[24px]">
              {stubDate.weekday} {stubDate.day}
            </div>
            <div className="font-display-big text-ink mt-1 text-[20px] leading-none font-black md:text-[24px]">
              {stubDate.month}
            </div>
          </div>

          {time && (
            <div className="text-ink font-mono text-[14px] tracking-[0.06em]">
              {time}
            </div>
          )}

          {venue && (
            <div className="text-ink/75 font-mono text-[9.5px] leading-[1.4] tracking-[0.14em] uppercase">
              {venue}
            </div>
          )}
        </div>

        {/* ── Body (right zone) ────────────────────────────────────── */}
        <div className="flex flex-col gap-5 p-5 md:gap-6 md:p-6">
          <div className="text-ink font-mono text-[10px] tracking-[0.18em] uppercase">
            <span aria-hidden="true">{"∗ "}</span>
            {kicker}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
            <TeamSlot team={homeTeam} align="start" />
            <div className="flex items-center justify-center">
              <ScoreRegion
                status={status}
                homeScore={homeTeam.score}
                awayScore={awayTeam.score}
              />
            </div>
            <TeamSlot team={awayTeam} align="end" />
          </div>

          <div className="border-ink border-t pt-3">
            <div className="text-ink font-mono text-[10.5px] tracking-[0.14em] uppercase">
              {metaParts.map((part, index) => (
                <span key={`${part}-${index}`}>
                  {part}
                  {index < metaParts.length - 1 && (
                    <span aria-hidden="true" className="text-ink-muted mx-2">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Corner stamp ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute -top-3 right-4 z-10 rotate-[2deg]">
        <MatchStatusBadge status={status} />
      </div>
    </TapedCard>
  );
}
