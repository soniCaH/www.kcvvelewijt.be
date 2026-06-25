/**
 * <FirstTeamsBlock> — homepage "Eerste ploegen" eyecatcher (#2211).
 *
 * Full-bleed jersey-deep-dark matchday-desk band (StripedSeam top + bottom),
 * one full-width row per senior team: [team label] · [last-result card] ·
 * [next-fixture card]. The result + fixture are two independent press-down
 * cards, each deep-linking to its own match detail (`/wedstrijd/{id}`).
 *
 * Design lock: docs/design/mockups/eerste-ploegen/eerste-ploegen-locked.md
 * (visual record: docs/design/mockups/eerste-ploegen/04-b3-ia.html).
 */
import Link from "next/link";
import { DateTime } from "luxon";
import {
  Crest,
  EditorialHeading,
  StripedSeam,
} from "@/components/design-system";
import { OUTCOME_UNDERLINE } from "@/lib/utils/match-display";
import { normalizeTeamName } from "@/lib/mappers/match.mapper";
import { cn } from "@/lib/utils/cn";
import { FirstTeamCardLink } from "./FirstTeamCardLink";
import type {
  FirstTeamVM,
  FirstTeamResultVM,
  FirstTeamFixtureVM,
} from "./first-teams";

export interface FirstTeamsBlockProps {
  teams: FirstTeamVM[];
  /**
   * Section heading. The homepage passes a fixture-aware label (HP-4) —
   * "Dit weekend." only when a fixture is actually within the coming week,
   * a calmer "Volgende wedstrijd." when the next match is weeks out
   * (pre-season). Defaults to "Dit weekend." so stories/tests stay stable.
   */
  heading?: string;
}

const OUTCOME_WORD: Record<"win" | "draw" | "loss", string> = {
  win: "Gewonnen",
  draw: "Gelijkspel",
  loss: "Verloren",
};

// Match.date encodes Belgian wall-clock time as UTC (BFF builds it via
// `Date.UTC(y, m, d, hour, minute)` from the PSD local time), so format in UTC
// to surface the stored day/kickoff verbatim — and deterministically for VR,
// independent of the runner's timezone.
const nl = (date: Date) =>
  DateTime.fromJSDate(date, { zone: "utc" }).setLocale("nl");
const fmtWeekday = (date: Date) =>
  nl(date).toFormat("EEE").replace(/\.$/, "").toLowerCase();
const fmtMonth = (date: Date) =>
  nl(date).toFormat("MMM").replace(/\.$/, "").toLowerCase();
const fmtDay = (date: Date) => nl(date).toFormat("d");
const fmtResultDate = (date: Date) =>
  `${fmtWeekday(date)} ${fmtDay(date)} ${fmtMonth(date)}`;
const fmtKickoff = (date: Date, time?: string) =>
  time ?? nl(date).toFormat("HH:mm");
const homeAwayLabel = (isHome?: boolean) =>
  isHome === true ? "Thuis" : isHome === false ? "Uit" : null;

function ResultCard({
  slug,
  result,
}: {
  slug: string;
  result: FirstTeamResultVM;
}) {
  const { home, away, homeScore, awayScore, isHome, outcome } = result;
  const hasScore =
    typeof homeScore === "number" && typeof awayScore === "number";
  const underline = outcome ? OUTCOME_UNDERLINE[outcome] : undefined;
  const homeAway = homeAwayLabel(isHome);
  const meta = [
    homeAway,
    fmtResultDate(result.date),
    result.competition,
  ].filter(Boolean);

  return (
    <FirstTeamCardLink
      href={`/wedstrijd/${result.matchId}`}
      teamSlug={slug}
      matchId={result.matchId}
      kind="result"
      ariaLabel={`Uitslag ${normalizeTeamName(home.name)} tegen ${normalizeTeamName(away.name)} — bekijk wedstrijd`}
      className="border-cream bg-jersey-deep-dark text-cream shadow-[4px_4px_0_0_var(--color-ink-muted)]"
    >
      <div className="px-4 py-3">
        <span className="text-cream/85 font-mono text-[10px] font-bold tracking-wide uppercase">
          {outcome ? OUTCOME_WORD[outcome] : "Gespeeld"}
        </span>
        <div className="mt-1.5 flex items-center gap-2">
          <Crest name={home.name} logo={home.logo} size={22} />
          <span
            className="font-display-big text-cream text-[2rem] leading-none font-bold tabular-nums"
            style={underline ? { boxShadow: underline } : undefined}
          >
            {hasScore ? `${homeScore}–${awayScore}` : "—"}
          </span>
          <Crest name={away.name} logo={away.logo} size={22} />
          <span className="text-cream/85 ml-1 min-w-0 truncate text-xs">
            <span className={cn(isHome === true && "text-cream font-semibold")}>
              {normalizeTeamName(home.name)}
            </span>
            {" — "}
            <span
              className={cn(isHome === false && "text-cream font-semibold")}
            >
              {normalizeTeamName(away.name)}
            </span>
          </span>
        </div>
        <span className="text-cream/65 mt-1.5 block font-mono text-[10px] tracking-wide uppercase">
          {meta.join(" · ")}
        </span>
      </div>
    </FirstTeamCardLink>
  );
}

function FixtureCard({
  slug,
  fixture,
}: {
  slug: string;
  fixture: FirstTeamFixtureVM;
}) {
  const { opponent, isHome } = fixture;
  const homeAway = homeAwayLabel(isHome);
  const sub = [homeAway, fixture.competition].filter(Boolean).join(" · ");

  return (
    <FirstTeamCardLink
      href={`/wedstrijd/${fixture.matchId}`}
      teamSlug={slug}
      matchId={fixture.matchId}
      kind="fixture"
      ariaLabel={`Volgende wedstrijd tegen ${normalizeTeamName(opponent.name)} — bekijk wedstrijd`}
      className="border-ink bg-cream text-ink flex shadow-[4px_4px_0_0_var(--color-ink)]"
    >
      <div className="border-ink/30 flex flex-col items-center justify-center border-r-2 border-dashed px-3.5 py-2">
        <span className="text-ink-muted font-mono text-[10px] tracking-wide uppercase">
          {fmtWeekday(fixture.date)}
        </span>
        <span className="font-display text-xl leading-none font-bold">
          {fmtDay(fixture.date)}
        </span>
        <span className="text-ink-muted font-mono text-[10px] tracking-wide uppercase">
          {fmtMonth(fixture.date)}
        </span>
      </div>
      <div className="flex flex-1 items-center gap-2.5 px-3.5 py-2">
        <Crest name={opponent.name} logo={opponent.logo} size={22} />
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {normalizeTeamName(opponent.name)}
          </span>
          {sub ? (
            <span className="text-ink-muted block font-mono text-[10px] tracking-wide uppercase">
              {sub}
            </span>
          ) : null}
        </div>
        <span className="font-display ml-auto text-lg font-bold">
          {fmtKickoff(fixture.date, fixture.time)}
        </span>
      </div>
    </FirstTeamCardLink>
  );
}

function SkipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-cream/40 text-cream/65 flex items-center justify-center border-2 border-dashed px-4 py-3 text-center font-mono text-xs tracking-wide uppercase">
      {children}
    </div>
  );
}

function FirstTeamRow({ team }: { team: FirstTeamVM }) {
  return (
    <div className="border-cream/20 grid gap-3 border-t py-5 first:border-t-0 md:grid-cols-[0.72fr_1.25fr_1.25fr] md:items-stretch md:gap-5">
      <div className="flex flex-col justify-center">
        <span className="font-display text-cream text-2xl leading-tight font-bold">
          {team.label}
        </span>
        {team.division ? (
          <span className="text-cream/70 mt-1 font-mono text-[length:var(--text-label)] tracking-[var(--text-label--tracking)] uppercase">
            {team.division}
          </span>
        ) : null}
      </div>
      {team.result ? (
        <ResultCard slug={team.slug} result={team.result} />
      ) : (
        <SkipCard>Nog geen uitslag</SkipCard>
      )}
      {team.fixture ? (
        <FixtureCard slug={team.slug} fixture={team.fixture} />
      ) : (
        <SkipCard>Geen geplande wedstrijd</SkipCard>
      )}
    </div>
  );
}

/**
 * Render the "Eerste ploegen" band. Teams with neither a result nor a fixture
 * are dropped; the whole block renders nothing when no team has any match.
 */
export function FirstTeamsBlock({
  teams,
  heading = "Dit weekend.",
}: FirstTeamsBlockProps) {
  const rows = teams.filter((t) => t.result || t.fixture);
  if (rows.length === 0) return null;

  return (
    <section aria-label="Eerste ploegen" className="bg-jersey-deep-dark">
      <StripedSeam colorPair="cream-jersey-deep" height="md" />
      <div className="mx-auto max-w-[var(--container-index)] px-4 py-10 md:px-8 md:py-12">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <span className="text-warm font-mono text-[length:var(--text-label)] font-semibold tracking-[var(--text-label--tracking)] uppercase">
              Eerste ploegen
            </span>
            <EditorialHeading
              level={2}
              size="display-md"
              tone="cream"
              className="mt-2"
            >
              {heading}
            </EditorialHeading>
          </div>
          <Link
            href="/kalender"
            className="text-warm hover:text-cream shrink-0 font-mono text-xs font-semibold tracking-wide uppercase transition-colors"
          >
            Volledige kalender <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="flex flex-col">
          {rows.map((team) => (
            <FirstTeamRow key={team.slug} team={team} />
          ))}
        </div>
      </div>
      <StripedSeam colorPair="cream-jersey-deep" height="md" flip />
    </section>
  );
}
