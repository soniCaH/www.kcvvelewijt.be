export type TeamLandingItem = {
  _id: string;
  name: string;
  /** What the site calls this team, resolved at the repository boundary (#2630). */
  displayName: string;
  slug: string;
  age: string;
  psdId: string | null;
  division: string | null;
  divisionFull: string | null;
  tagline: string | null;
  teamImageUrl: string | null;
  staff: { firstName: string; lastName: string; role: string }[] | null;
};

export type YouthDivisionGroup = {
  label: YouthDivisionName | typeof RESERVEN_LABEL;
  /**
   * The group's age band, e.g. "U12–U16". Absent on groups that are not an
   * age band at all (Reserven), which the directory heading renders bare.
   */
  range?: string;
  teams: TeamLandingItem[];
};

export type GroupedTeams = {
  aTeam: TeamLandingItem | undefined;
  bTeam: TeamLandingItem | undefined;
  youthByDivision: YouthDivisionGroup[];
};

export type YouthDivisionName = "Bovenbouw" | "Middenbouw" | "Onderbouw";

/**
 * Reserves team (PSD id). Its Sanity `age` is "A" — it is a senior-level side,
 * a level between U21 and the B-ploeg — so no age parsing can place it and it
 * gets its own group. Lives here rather than in `menuItems.ts` because the
 * grouping is the surface that survives #2409's dropdown removal (#2414).
 */
export const RESERVEN_PSD_ID = "34";

/** Display name of the reserves group — also the nav label in `menuItems.ts`. */
export const RESERVEN_LABEL = "Reserven";

/** Parse the numeric age from an age-group string (e.g. "U15" → 15). Returns null if unparseable. */
function parseAge(ageGroup: string): number | null {
  const match = ageGroup.match(/^U(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * True when a team's `age` is an age code (`U6`, `U15`, …) rather than a senior
 * code like "A". Broader than `getYouthDivision`, which additionally requires
 * the code to fall inside a bouw band — "U5" is an age code with no division.
 * Callers that render the age (chest letter, card caption) want this one.
 */
export function isAgeCode(ageGroup: string | undefined): boolean {
  return ageGroup != null && parseAge(ageGroup) != null;
}

/** Derive the youth division name from an age group string (e.g. "U15" → "Middenbouw"). */
export function getYouthDivision(
  ageGroup: string | undefined,
): YouthDivisionName | null {
  if (!ageGroup) return null;
  const age = parseAge(ageGroup);
  if (age == null) return null;
  if (age >= 17 && age <= 21) return "Bovenbouw";
  if (age >= 12 && age <= 16) return "Middenbouw";
  if (age >= 6 && age <= 11) return "Onderbouw";
  return null;
}

/**
 * A closed set of colour-token identities, one per Youth Division plus
 * Senioren — D6/D6a (#2608 Unit 5, #2615). Named after the existing token it
 * resolves to, never a class string: consumers own the presentation, this
 * module owns only which division gets which tone.
 */
export type YouthDivisionTone = "ink" | "jersey-deep" | "alert" | "warning";

// `satisfies` (not `: Record<...>`) so a future Youth Division added to
// `YouthDivisionName` without a tone here is a compile error, not a silently
// un-toned card.
const YOUTH_DIVISION_TONES = {
  Bovenbouw: "jersey-deep",
  Middenbouw: "alert",
  Onderbouw: "warning",
} satisfies Record<YouthDivisionName, YouthDivisionTone>;

/** The Senioren tone — also what a `null` division (no Youth Division at all) resolves to. */
export function getYouthDivisionTone(
  division: YouthDivisionName | null,
): YouthDivisionTone {
  return division ? YOUTH_DIVISION_TONES[division] : "ink";
}

/**
 * Youngest first (club feedback v2, #3427). Only teams `getYouthDivision`
 * placed reach this, so every age parses.
 */
function byAgeAsc(a: TeamLandingItem, b: TeamLandingItem): number {
  return (parseAge(a.age) ?? 0) - (parseAge(b.age) ?? 0);
}

/**
 * Extract the trailing single letter from a team name, e.g. "Eerste Elftallen A" → "A".
 *
 * Selection only — this decides *which* team fills the A / B flagship slot, not
 * what the slot is called. What it is called comes from `teamDisplayName`.
 */
function nameSuffix(name: string): string {
  return name.trim().split(/\s+/).at(-1) ?? "";
}

function isSenior(t: TeamLandingItem): boolean {
  return t.age === "A";
}

export function groupTeamsForLanding(teams: TeamLandingItem[]): GroupedTeams {
  const seniors = teams.filter(isSenior);
  return {
    aTeam: seniors.find((t) => nameSuffix(t.name) === "A"),
    bTeam: seniors.find((t) => nameSuffix(t.name) === "B"),
    youthByDivision: [
      // Above U21 and below the B-ploeg, a side of its own — so it leads the
      // directory, ahead of the three bouw groups, which then run small → large
      // (#3427). `<YouthDirectory>` drops it when the roster has no Reserven.
      //
      // Deliberately rangeless. #2641 proposed a label saying where the side
      // sits — A/B squad players never play here, so it is a side of its own
      // that starts where the youth ladder ends, not an overflow bench — and
      // the owner ruled against it: no label beats one generic enough to be
      // worth the pixels. The section heading above carries the framing now.
      {
        label: RESERVEN_LABEL,
        teams: teams.filter((t) => t.psdId === RESERVEN_PSD_ID),
      },
      {
        label: "Onderbouw",
        range: "U6–U11",
        teams: teams
          .filter((t) => getYouthDivision(t.age) === "Onderbouw")
          .sort(byAgeAsc),
      },
      {
        label: "Middenbouw",
        range: "U12–U16",
        teams: teams
          .filter((t) => getYouthDivision(t.age) === "Middenbouw")
          .sort(byAgeAsc),
      },
      {
        label: "Bovenbouw",
        range: "U17–U21",
        teams: teams
          .filter((t) => getYouthDivision(t.age) === "Bovenbouw")
          .sort(byAgeAsc),
      },
    ],
  };
}
