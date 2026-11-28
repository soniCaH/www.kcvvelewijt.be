/**
 * Pure core of the sponsor season report (#3653, spec #3618 slice c): Sanity
 * sponsors + GA4 rows in, one report model per active Sponsor out. No network,
 * no files: `run.ts` fetches and writes, `render.ts` prints.
 */
import { hashMemberId } from "./hash-member-id";

/** `match`: the matchday sponsor (Matchbal) card on a Match page (#3917). */
export const SURFACES = ["homepage", "team", "sponsors", "match"] as const;
export type Surface = (typeof SURFACES)[number];

/** A rate on a handful of impressions is noise: omitted below this. */
export const MIN_IMPRESSIONS_FOR_RATE = 100;

/**
 * Last GA4 `date` (YYYYMMDD) on which a `/sponsors` click can still lack a
 * `source`: the day the #3773 deploy landed. GA4 shows that missing source as
 * "(not set)". GA4 cannot split a day, so the deploy day itself is included.
 */
export const LAST_DAY_WITHOUT_SPONSORS_SOURCE = "20261117";

const CLICK_EVENTS = new Set(["sponsor_click", "sponsor_featured_click"]);

export interface SponsorInput {
  /** The Sanity `_id`. Hashed here, never copied to the output. */
  id: string;
  name: string;
  tier?: string | null;
  active: boolean;
  /** Names of the Teams in the Sponsor's `teams` field. */
  teams: string[];
}

export interface Ga4Row {
  /** The `sponsor_id` dimension: the hashed id, or "(not set)" / "". */
  sponsorId: string;
  source: string;
  eventName: string;
  /** The GA4 `date` dimension, YYYYMMDD. */
  date: string;
  count: number;
}

export interface DateRange {
  /** YYYY-MM-DD */
  from: string;
  to: string;
}

export interface ReportInput {
  sponsors: SponsorInput[];
  rows: Ga4Row[];
  /** Spotlight weeks (YYYY-MM-DD, the Monday) per Sponsor name, a manual list. */
  spotlightWeeks: Record<string, string[]>;
  range: DateRange;
}

export interface SurfaceReport {
  surface: Surface;
  impressions: number;
  clicks: number;
  /**
   * Clicks since the first impression was measured / impressions; absent below
   * `MIN_IMPRESSIONS_FOR_RATE` impressions.
   */
  clickThroughRate?: number;
}

export interface SponsorReport {
  name: string;
  tier?: string | null;
  /** The hashed id GA4 knows the Sponsor by. Safe to print. */
  hash: string;
  teams: string[];
  spotlightWeeks: string[];
  surfaces: SurfaceReport[];
  /**
   * Clicks on the Sponsor's name in the "Gesteund door" line on a Team page
   * (`sponsor_team_line_click`, no `source`). Its own figure: not a wall click,
   * not in the rate. Present only when the range has such clicks: the line was
   * removed in #3915, so a later range would only ever show 0.
   */
  teamLineClicks?: number;
  /** False when GA4 holds no event for this Sponsor in the range. */
  hasData: boolean;
  range: DateRange;
}

/** 1 July to 30 June around `now`. */
export const defaultSeason = (now: Date): DateRange => {
  const startYear =
    now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return { from: `${startYear}-07-01`, to: `${startYear + 1}-06-30` };
};

/** The surface a row counts for, or undefined when it counts for none. */
const surfaceOf = (row: Ga4Row): Surface | undefined => {
  const source =
    row.source === "(not set)" &&
    CLICK_EVENTS.has(row.eventName) &&
    row.date <= LAST_DAY_WITHOUT_SPONSORS_SOURCE
      ? "sponsors"
      : row.source;
  return SURFACES.find((surface) => surface === source);
};

interface Totals {
  impressions: number;
  clicks: number;
  /** Clicks from the first impression day of the surface: the rate's numerator. */
  ratedClicks: number;
}

const emptyTotals = () =>
  new Map<Surface, Totals>(
    SURFACES.map((surface) => [
      surface,
      { impressions: 0, clicks: 0, ratedClicks: 0 },
    ]),
  );

const isCountedClick = (eventName: string, surface: Surface) =>
  eventName === "sponsor_click" ||
  (eventName === "sponsor_featured_click" && surface === "sponsors");

export const buildReport = ({
  sponsors,
  rows,
  spotlightWeeks,
  range,
}: ReportInput): SponsorReport[] => {
  const entries = sponsors.map((sponsor) => ({
    sponsor,
    hash: hashMemberId(sponsor.id),
  }));
  const byHash = new Map<string, SponsorInput>();
  for (const { sponsor, hash } of entries) {
    const other = byHash.get(hash);
    if (other) {
      // GA4 rows could not be told apart: refuse rather than guess.
      throw new Error(
        `Hash collision: "${other.name}" and "${sponsor.name}" share hash ${hash}.`,
      );
    }
    byHash.set(hash, sponsor);
  }

  const active = entries.filter(({ sponsor }) => sponsor.active);
  for (const name of Object.keys(spotlightWeeks)) {
    const matches = active.filter(({ sponsor }) => sponsor.name === name);
    if (matches.length === 0) {
      throw new Error(
        `Spotlight weeks given for "${name}": no active Sponsor has that name.`,
      );
    }
    if (matches.length > 1) {
      // Weeks are keyed by name: they cannot be told apart, so none are guessed.
      throw new Error(
        `Spotlight weeks given for "${name}": more than one active Sponsor has that name.`,
      );
    }
  }

  const teamLineClicks = new Map<string, number>();
  for (const row of rows) {
    if (row.eventName !== "sponsor_team_line_click") continue;
    if (!byHash.has(row.sponsorId)) continue;
    teamLineClicks.set(
      row.sponsorId,
      (teamLineClicks.get(row.sponsorId) ?? 0) + row.count,
    );
  }

  const counted = rows.flatMap((row) => {
    const surface = surfaceOf(row);
    if (!byHash.has(row.sponsorId) || !surface) return [];
    return [{ row, surface }];
  });

  // Impressions only exist from the #3773 deploy, clicks go further back:
  // a rate over both would overstate. Per surface, it starts at the first day
  // an impression was counted.
  const firstImpressionDay = new Map<Surface, string>();
  for (const { row, surface } of counted) {
    if (row.eventName !== "sponsor_impression") continue;
    const first = firstImpressionDay.get(surface);
    if (first === undefined || row.date < first) {
      firstImpressionDay.set(surface, row.date);
    }
  }

  const totals = new Map<string, Map<Surface, Totals>>();
  for (const { row, surface } of counted) {
    const isClick = isCountedClick(row.eventName, surface);
    if (row.eventName !== "sponsor_impression" && !isClick) continue;
    const perSurface = totals.get(row.sponsorId) ?? emptyTotals();
    totals.set(row.sponsorId, perSurface);
    const sum = perSurface.get(surface)!;
    if (!isClick) sum.impressions += row.count;
    else {
      sum.clicks += row.count;
      const first = firstImpressionDay.get(surface);
      if (first !== undefined && row.date >= first)
        sum.ratedClicks += row.count;
    }
  }

  return active
    .map(({ sponsor, hash }): SponsorReport => {
      const perSurface = totals.get(hash) ?? emptyTotals();
      const surfaces = SURFACES.map((surface): SurfaceReport => {
        const { impressions, clicks, ratedClicks } = perSurface.get(surface)!;
        return {
          surface,
          impressions,
          clicks,
          ...(impressions >= MIN_IMPRESSIONS_FOR_RATE && {
            clickThroughRate: ratedClicks / impressions,
          }),
        };
      });
      const lineClicks = teamLineClicks.get(hash) ?? 0;
      return {
        name: sponsor.name,
        tier: sponsor.tier,
        hash,
        teams: sponsor.teams,
        spotlightWeeks: spotlightWeeks[sponsor.name] ?? [],
        surfaces,
        ...(lineClicks > 0 && { teamLineClicks: lineClicks }),
        hasData:
          lineClicks > 0 || surfaces.some((s) => s.impressions + s.clicks > 0),
        range,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
};
