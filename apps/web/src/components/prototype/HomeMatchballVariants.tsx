// PROTOTYPE (#3913) — throwaway homepage matchday sponsor looks. Never merge to main.
import { SanityImage } from "@/lib/image/sanity-image";
import type { Sponsor } from "@/components/sponsors/Sponsors";
import type { ScheduleRow } from "@/components/match/types";

export interface MatchballFixture {
  /** Our side, e.g. "A-ploeg" or "U21": any team can have a Matchbal. */
  team: string;
  teams: string;
  when: string;
}

/** "KCVV Elewijt – Racing Mechelen" and "zo 30 nov · 15:00", or null for a non-match row. */
export const toMatchballFixture = (
  row: ScheduleRow | undefined,
  team: string,
): MatchballFixture | null => {
  if (!row || row.kind !== "match") return null;
  const day = new Intl.DateTimeFormat("nl-BE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Brussels",
  }).format(row.date);
  return {
    team,
    teams: `${row.homeTeam.name} – ${row.awayTeam.name}`,
    when: row.time ? `${day} · ${row.time}` : day,
  };
};

const Logo = ({ s, h }: { s: Sponsor; h: number }) => (
  <SanityImage
    src={s.logo}
    alt={s.name}
    width={200}
    height={100}
    style={{ maxHeight: h }}
    className="h-auto w-auto max-w-[260px] object-contain"
    sizes="260px"
  />
);

/** Look A: a cream band of its own, right under "Eerste ploegen". */
export const MatchballBand = ({
  sponsor,
  fixture,
}: {
  sponsor: Sponsor;
  fixture: MatchballFixture;
}) => (
  <section className="bg-cream-soft border-ink border-b-2">
    <div className="mx-auto flex max-w-[var(--container-index)] flex-wrap items-center justify-between gap-6 px-4 py-8 md:px-8">
      <div>
        <p className="flex flex-wrap items-center gap-3">
          <span className="bg-jersey-deep text-cream text-label px-[7px] py-[3px] font-mono whitespace-nowrap uppercase">
            {fixture.team}
          </span>
          <span className="text-ink-muted text-label font-mono font-semibold uppercase">
            Matchbal · {fixture.when}
          </span>
        </p>
        <p className="font-display text-ink mt-1 text-2xl font-bold">
          {fixture.teams}
        </p>
        <p className="text-ink-muted mt-1">
          aangeboden door{" "}
          <span className="text-ink font-semibold">{sponsor.name}</span>
        </p>
      </div>
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-cream border-ink shadow-paper-sm block border-2 px-6 py-4"
      >
        <Logo s={sponsor} h={88} />
      </a>
    </div>
  </section>
);

/** Look B: one line under the next-match card, inside "Eerste ploegen". */
export const MatchballInline = ({ sponsor }: { sponsor: Sponsor }) => (
  <a
    href={sponsor.url}
    target="_blank"
    rel="noopener noreferrer"
    className="bg-cream flex items-center justify-between gap-4 px-4 py-2"
  >
    <span className="text-ink-muted text-label-sm font-mono font-semibold uppercase">
      Matchbal aangeboden door
    </span>
    <Logo s={sponsor} h={56} />
  </a>
);

/** Look C: a slim bar above "Eerste ploegen", like an announcement. */
export const MatchballTicker = ({
  sponsor,
  fixture,
}: {
  sponsor: Sponsor;
  fixture: MatchballFixture;
}) => (
  <div className="bg-warm border-ink border-y-2">
    <div className="mx-auto flex max-w-[var(--container-index)] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-8">
      <p className="text-ink text-label font-mono font-semibold uppercase">
        {fixture.when} · {fixture.teams}
      </p>
      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3"
      >
        <span className="text-ink text-label font-mono font-semibold uppercase">
          Matchbal aangeboden door
        </span>
        <span className="bg-cream block px-2 py-1">
          <Logo s={sponsor} h={44} />
        </span>
      </a>
    </div>
  </div>
);
