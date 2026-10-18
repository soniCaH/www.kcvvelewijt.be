import { getYouthDivision, type YouthDivisionName } from "./group-teams";
import { teamDisplayName } from "./team-display-name";

/**
 * Recognise a youth team in what a parent types into `/hulp` (#3557, rules
 * decided in #3420). Pure: the team list and the season come in, nothing is read.
 * Rules only — the AI fallback for what they miss (#3559) asks the BFF to pick
 * from `youthTeamAges()`, and a confirmed pick becomes `aiTeamResult()`.
 */

/** The fields the matcher reads. Callers pass their own view-model and get it back. */
export interface YouthTeamSource {
  _id: string;
  /** Route key, e.g. `kcvve-u10p`, `kcvve-u8-wit`. Identity comes from here, never from `age`. */
  slug: string;
  name: string;
  displayName?: string | null;
  /** PSD competition band (`kcvve-u16` carries `U17`) — read only for the band. */
  age: string;
  archived?: boolean | null;
  /** The team page lists staff, so its `#staf` anchor exists. Read by `<TeamCard>` only. */
  hasStaff?: boolean;
}

/** Which rule found the team — also the GA4 "found by" value. `ai` is a pick the parent confirmed (#3559). */
export type YouthTeamMatchKind =
  "u-code" | "old-name" | "age" | "birth-year" | "ai";

/** The teams one category lower a late-born player (01.07–31.12) may also play in. */
export interface LateBornAlternative<
  T extends YouthTeamSource = YouthTeamSource,
> {
  category: number;
  /** Regional teams only — never a P/IP team. */
  teams: T[];
}

/** One category (`U8`) and every matched team in it (`U8 Wit`, `U8 Groen`). */
export interface YouthTeamMatch<T extends YouthTeamSource = YouthTeamSource> {
  kind: YouthTeamMatchKind;
  /** The U-number of `teams`, e.g. 10 for U10 and U10P. */
  category: number;
  band: YouthDivisionName;
  teams: T[];
  /** Set for `age` and `birth-year` matches. */
  birthYear: number | null;
  /** No team at the asked category (U18, U20), so these are the next one up. */
  nextTeamUp: boolean;
  /** The category the query asked for — differs from `category` only when `nextTeamUp`. */
  requestedCategory: number;
  /** The age the query named, for `age` matches; `null` otherwise. */
  age: number | null;
  /** The old name the query used (`miniemen`), lowercase, for `old-name` matches; `null` otherwise. */
  oldName: string | null;
  /** `birth-year` matches up to U17 only; `null` otherwise. */
  lateBornAlternative: LateBornAlternative<T> | null;
}

export interface YouthTeamBandGroup<
  T extends YouthTeamSource = YouthTeamSource,
> {
  band: YouthDivisionName;
  /** Youngest first. */
  matches: YouthTeamMatch<T>[];
}

export interface YouthTeamMatchResult<
  T extends YouthTeamSource = YouthTeamSource,
> {
  /** Onderbouw → Middenbouw → Bovenbouw; empty when nothing matched. */
  bands: YouthTeamBandGroup<T>[];
  /** The query held a digit and nothing matched — the "not found" analytics event. */
  unmatchedNumber: boolean;
}

const BAND_ORDER: YouthDivisionName[] = [
  "Onderbouw",
  "Middenbouw",
  "Bovenbouw",
];

/** Youth categories the club can field; anything outside is not a youth team. */
const MIN_CATEGORY = 5;
const MAX_CATEGORY = 21;

/** Federation late-born dispensation: up to U17, regional teams only (KBVB Boek B Titel 4 Art. V). */
const LATE_BORN_MAX_CATEGORY = 17;

/** The six old names the sources agree on — search only, never shown on the site. */
const OLD_NAMES: [RegExp, number, number][] = [
  [/\bduiveltjes\b/i, 6, 9],
  [/\bpreminiemen\b/i, 10, 11],
  [/\bminiemen\b/i, 12, 13],
  [/\bknapen\b/i, 14, 15],
  [/\bscholieren\b/i, 16, 17],
  [/\bjunior(?:en|es)\b/i, 19, 21],
];

interface ParsedTeam<T> {
  team: T;
  category: number;
  /** Letters glued to the code: `p` for U10P. */
  suffix: string;
  /** Words after the code: `["wit"]` for U8 Wit. */
  variant: string[];
  regional: boolean;
}

function parseTeam<T extends YouthTeamSource>(team: T): ParsedTeam<T> | null {
  const m = teamDisplayName(team).match(/^U(\d{1,2})([a-z]*)(?:\s+(.+))?$/i);
  if (!m) return null;
  return {
    team,
    category: Number(m[1]),
    suffix: m[2].toLowerCase(),
    variant: (m[3] ?? "").toLowerCase().split(/\s+/).filter(Boolean),
    regional: !/p$/i.test(team.slug),
  };
}

export function matchYouthTeams<T extends YouthTeamSource>(
  query: string,
  teams: readonly T[],
  /**
   * `seasonStartYear(now)` from `./season` — a number, not a date, so the
   * client bundle that runs this matcher never ships Luxon (#3558).
   */
  seasonYear: number,
  /**
   * The calendar year now — an age names a birth year from it, not from the
   * season: 8 in March 2027 is born 2019 or 2018, though the season is 2026.
   */
  calendarYear: number,
): YouthTeamMatchResult<T> {
  const parsed = teams
    .filter((t) => t.archived !== true)
    .map(parseTeam)
    .filter((p): p is ParsedTeam<T> => p != null);
  const teamsIn = (category: number) =>
    parsed.filter((p) => p.category === category);

  type Draft = Omit<YouthTeamMatch<T>, "band" | "teams"> & {
    teams: ParsedTeam<T>[];
  };

  /** The match for an asked category — or the next one up the club fields; `null` when none. */
  const matchCategory = (
    kind: YouthTeamMatchKind,
    category: number,
    birthYear: number | null,
    extra: Pick<Draft, "age" | "oldName"> = { age: null, oldName: null },
  ): Draft | null => {
    if (category < MIN_CATEGORY || category > MAX_CATEGORY) return null;
    let found = category;
    while (found <= MAX_CATEGORY && teamsIn(found).length === 0) found++;
    if (found > MAX_CATEGORY) return null;
    const lower =
      kind === "birth-year" && category <= LATE_BORN_MAX_CATEGORY
        ? teamsIn(category - 1).filter((p) => p.regional)
        : [];
    return {
      kind,
      category: found,
      teams: teamsIn(found),
      birthYear,
      nextTeamUp: found !== category,
      requestedCategory: category,
      ...extra,
      lateBornAlternative:
        lower.length > 0
          ? { category: category - 1, teams: lower.map((p) => p.team) }
          : null,
    };
  };

  const byUCode = (): Draft[] =>
    // A spaced `u 12` counts only at the end — else it is the polite "u" ("kan ik u 15 minuten bellen").
    [
      ...query.matchAll(
        /\bu(?:|\s+(?=\d{1,2}[a-z]*[\s?!.]*$))(\d{1,2})([a-z]*)\b/gi,
      ),
    ].flatMap((m) => {
      const d = matchCategory("u-code", Number(m[1]), null);
      if (!d || d.nextTeamUp) return d ? [d] : [];
      // Narrow to `U10P` / `U8 wit` only when such a team exists; else keep the whole category.
      const suffix = m[2].toLowerCase();
      const nextWord =
        query
          .slice((m.index ?? 0) + m[0].length)
          .match(/^\s+(\p{L}+)/u)?.[1]
          ?.toLowerCase() ?? "";
      const narrowed = suffix
        ? d.teams.filter((p) => p.suffix === suffix)
        : d.teams.filter((p) => p.variant.includes(nextWord));
      return [{ ...d, teams: narrowed.length > 0 ? narrowed : d.teams }];
    });

  const byOldName = (): Draft[] =>
    OLD_NAMES.flatMap(([re, from, to]) => {
      const oldName = query.match(re)?.[0].toLowerCase();
      if (!oldName) return [];
      return Array.from({ length: to - from + 1 }, (_, i) => from + i)
        .filter((c) => teamsIn(c).length > 0)
        .flatMap(
          (c) =>
            matchCategory("old-name", c, null, { age: null, oldName }) ?? [],
        );
    });

  const byBirthYear = (): Draft[] =>
    [...query.matchAll(/\b((?:19|20)\d{2})\b/g)].flatMap((m) => {
      const born = Number(m[1]);
      return matchCategory("birth-year", seasonYear - born + 1, born) ?? [];
    });

  // An age fits two birth years: 8 in October 2026 is born 2018 (U9) or 2017 (U10).
  // A bare `is 8` counts only where the clause ends — "het is 10 uur" is a time.
  const byAge = (): Draft[] =>
    [
      ...query.matchAll(
        /\b(\d{1,2})\s*-?\s*(?:jaar|jarige?)\b|\bis\s+(\d{1,2})(?=\s*(?:$|[,;!?]|\.(?!\d)|(?:en|of|maar)\b))/gi,
      ),
    ].flatMap((m) => {
      const age = Number(m[1] ?? m[2]);
      return [calendarYear - age, calendarYear - age - 1].flatMap(
        (born) =>
          matchCategory("age", seasonYear - born + 1, born, {
            age,
            oldName: null,
          }) ?? [],
      );
    });

  // The most explicit rule that finds anything wins; the others are not mixed in.
  const drafts =
    [byUCode, byOldName, byBirthYear, byAge]
      .map((rule) => rule())
      .find((found) => found.length > 0) ?? [];

  const matches = new Map<number, YouthTeamMatch<T>>();
  for (const d of drafts) {
    if (matches.has(d.category)) continue;
    const first = d.teams[0];
    const band =
      getYouthDivision(first.team.age) ??
      // U5 counts as Onderbouw on the /hulp card only (#3420).
      (first.category === MIN_CATEGORY ? "Onderbouw" : null);
    if (band == null) continue;
    matches.set(d.category, { ...d, band, teams: d.teams.map((p) => p.team) });
  }

  const sorted = [...matches.values()].sort((a, b) => a.category - b.category);
  const bands = BAND_ORDER.map((band) => ({
    band,
    matches: sorted.filter((m) => m.band === band),
  })).filter((g) => g.matches.length > 0);

  return { bands, unmatchedNumber: bands.length === 0 && /\d/.test(query) };
}

/** The U-codes the club fields, youngest first — the only answers the AI may give (#3559). */
export function youthTeamAges(teams: readonly YouthTeamSource[]): string[] {
  const categories = new Set(
    teams
      .filter((t) => t.archived !== true)
      .map(parseTeam)
      .flatMap((p) => (p ? [p.category] : [])),
  );
  return [...categories].sort((a, b) => a - b).map((c) => `U${c}`);
}

/** Senior teams: `A-ploeg`, `B ploeg`, `eerste ploeg`, `reserven` — never a youth card (#3420 mock). */
const SENIOR_TEAM = /\b(?:[ab]\s*-?\s*ploeg|eerste\s+ploeg|reserve)/i;

/**
 * Whether a query the rules missed is worth one AI try (#3559): it speaks of a
 * child or a youth team, and names no senior team. Prefixes, so `dochtertje`
 * and `ploegen` count too.
 */
export function hasYouthHint(query: string): boolean {
  return (
    !SENIOR_TEAM.test(query) &&
    /\b(?:zoon|dochter|kind|ploeg|jeugd|pupil|kadet|nieuweling|belofte|debutant)/i.test(
      query,
    )
  );
}

/** The card for an AI pick the parent confirmed: the U-code rule's card, found by `ai`. */
export function aiTeamResult<T extends YouthTeamSource>(
  age: string,
  teams: readonly T[],
  seasonYear: number,
  calendarYear: number,
): YouthTeamMatchResult<T> {
  const result = matchYouthTeams(age, teams, seasonYear, calendarYear);
  return {
    ...result,
    bands: result.bands.map((band) => ({
      ...band,
      matches: band.matches.map((m) => ({ ...m, kind: "ai" as const })),
    })),
  };
}
