/**
 * Pure core of the sponsor season report (#3653, spec #3618 slice c): Sanity
 * sponsors + GA4 rows in, one report model per active Sponsor out. No network,
 * no files: `run.ts` fetches and writes, `render.ts` prints.
 */
import { hashMemberId } from "./hash-member-id";

export const SURFACES = ["homepage", "team", "sponsors"] as const;
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
  /** clicks / impressions; absent below `MIN_IMPRESSIONS_FOR_RATE` impressions. */
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

const emptyTotals = () =>
  new Map<Surface, { impressions: number; clicks: number }>(
    SURFACES.map((surface) => [surface, { impressions: 0, clicks: 0 }]),
  );

export const buildReport = ({
  sponsors,
  rows,
  spotlightWeeks,
  range,
}: ReportInput): SponsorReport[] => {
  const hashes = new Map<string, SponsorInput>();
  for (const sponsor of sponsors) {
    const hash = hashMemberId(sponsor.id);
    const other = hashes.get(hash);
    if (other) {
      // GA4 rows could not be told apart: refuse rather than guess.
      throw new Error(
        `Hash collision: "${other.name}" and "${sponsor.name}" share hash ${hash}.`,
      );
    }
    hashes.set(hash, sponsor);
  }

  const active = sponsors.filter((sponsor) => sponsor.active);
  for (const name of Object.keys(spotlightWeeks)) {
    if (!active.some((sponsor) => sponsor.name === name)) {
      throw new Error(
        `Spotlight weeks given for "${name}": no active Sponsor has that name.`,
      );
    }
  }

  const totals = new Map<string, ReturnType<typeof emptyTotals>>();
  for (const row of rows) {
    const sponsor = hashes.get(row.sponsorId);
    const surface = surfaceOf(row);
    if (!sponsor || !surface) continue;
    const isClick =
      row.eventName === "sponsor_click" ||
      (row.eventName === "sponsor_featured_click" && surface === "sponsors");
    if (row.eventName !== "sponsor_impression" && !isClick) continue;
    const perSurface = totals.get(row.sponsorId) ?? emptyTotals();
    totals.set(row.sponsorId, perSurface);
    const sum = perSurface.get(surface)!;
    if (isClick) sum.clicks += row.count;
    else sum.impressions += row.count;
  }

  return active
    .map((sponsor): SponsorReport => {
      const hash = hashMemberId(sponsor.id);
      const perSurface = totals.get(hash) ?? emptyTotals();
      const surfaces = SURFACES.map((surface): SurfaceReport => {
        const { impressions, clicks } = perSurface.get(surface)!;
        return {
          surface,
          impressions,
          clicks,
          ...(impressions >= MIN_IMPRESSIONS_FOR_RATE && {
            clickThroughRate: clicks / impressions,
          }),
        };
      });
      return {
        name: sponsor.name,
        tier: sponsor.tier,
        hash,
        teams: sponsor.teams,
        spotlightWeeks: spotlightWeeks[sponsor.name] ?? [],
        surfaces,
        hasData: surfaces.some((s) => s.impressions + s.clicks > 0),
        range,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
};
