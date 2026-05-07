import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { getButtonClasses } from "@/components/design-system/Button";
import { KCVV_FIRST_TEAM_CLUB_ID } from "@/lib/constants";
import { formatWidgetDate } from "@/lib/utils/dates";
import type { UpcomingMatch } from "@/components/match/types";

const KCVV_LOGO_URL = "/images/logos/kcvv-logo.png";

export interface MatchStripViewProps {
  match: UpcomingMatch;
}

export function MatchStripView({ match }: MatchStripViewProps) {
  const isKcvvHome = match.homeTeam.id === KCVV_FIRST_TEAM_CLUB_ID;

  // Convention: render fixture left-to-right as home then away. KCVV's
  // position (left = home, right = away) is how home/away is signalled —
  // no "@" glyph, just ordering, the same way scoreboards list fixtures.
  const homeMark = {
    name: isKcvvHome ? "KCVV" : match.homeTeam.name,
    logoUrl: isKcvvHome ? KCVV_LOGO_URL : match.homeTeam.logo,
  };
  const awayMark = {
    name: isKcvvHome ? match.awayTeam.name : "KCVV",
    logoUrl: isKcvvHome ? match.awayTeam.logo : KCVV_LOGO_URL,
  };

  const dateStr = formatWidgetDate(match.date);
  const aftrap = match.time ? `${dateStr} · ${match.time}` : dateStr;
  const href = `/wedstrijd/${match.id}`;

  return (
    <aside
      aria-label="Volgende wedstrijd"
      className="bg-cream border-t-jersey-deep/35 border-b-ink/15 grid border-t border-b lg:grid-cols-[auto_1fr_auto]"
    >
      {/* Fixture cluster */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 lg:justify-start lg:px-6">
        <TeamMark name={homeMark.name} logoUrl={homeMark.logoUrl} />
        <TeamName>{homeMark.name}</TeamName>
        <span className="font-display text-ink/50 text-[14px] leading-none italic">
          vs.
        </span>
        <TeamName>{awayMark.name}</TeamName>
        <TeamMark name={awayMark.name} logoUrl={awayMark.logoUrl} />
      </div>

      {/* Meta cluster — desktop has caption/value cells, mobile keeps just the
          centred Aftrap value. */}
      <div className="border-ink/15 flex items-center justify-center border-t px-4 py-2 lg:border-0 lg:px-0">
        <span className="text-ink font-mono text-[13px] font-semibold lg:hidden">
          {aftrap}
        </span>

        <dl className="lg:divide-ink/15 hidden lg:flex lg:items-stretch lg:divide-x">
          {match.competition ? (
            <MetaCell caption="Competitie" value={match.competition} />
          ) : null}
          <MetaCell caption="Aftrap" value={aftrap} />
          {match.venue ? (
            <MetaCell caption="Terrein" value={match.venue} />
          ) : null}
        </dl>
      </div>

      {/* CTA */}
      <div className="border-ink/15 flex items-center justify-center border-t px-4 py-3 lg:justify-end lg:border-0 lg:px-6">
        <Link
          href={href}
          className={getButtonClasses({
            variant: "primary",
            size: "sm",
            className: "no-underline",
          })}
        >
          Wedstrijddetails
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </aside>
  );
}

function TeamName({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-ink truncate text-[15px] leading-none font-bold italic lg:text-[16px]">
      {children}
    </span>
  );
}

function TeamMark({ name, logoUrl }: { name: string; logoUrl?: string }) {
  // Real logos from PSD render directly. Fallback to a flat initial badge
  // when the BFF does not return a logo URL — same dimensions so the
  // strip layout stays stable.
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        className="h-7 w-7 shrink-0 object-contain lg:h-9 lg:w-9"
        loading="lazy"
      />
    );
  }
  const initial = name.trim().split(/\s+/).at(-1)?.[0]?.toUpperCase() ?? "?";
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "border-ink/40 bg-cream-soft text-ink inline-flex h-7 w-7 shrink-0 items-center justify-center border",
        "font-display text-[13px] leading-none font-black italic lg:h-9 lg:w-9 lg:text-[16px]",
      )}
    >
      {initial}
    </span>
  );
}

function MetaCell({ caption, value }: { caption: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-4">
      <dt>
        <MonoLabel size="sm">{caption}</MonoLabel>
      </dt>
      <dd className="text-ink font-mono text-[13px] font-semibold">{value}</dd>
    </div>
  );
}
