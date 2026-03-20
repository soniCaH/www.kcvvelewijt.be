import ical from "ical-generator";
import { DateTime } from "luxon";
import type { Match } from "@kcvv/api-contract";

const TIMEZONE = "Europe/Brussels";
const HOME_VENUE_FALLBACK = "Sportpark Elewijt, Elewijt, België";

export interface IcalOptions {
  side?: "home" | "away" | "all";
}

function isHomeMatch(match: Match): boolean {
  return match.home_team.name.toLowerCase().includes("elewijt");
}

function buildSummary(match: Match): string {
  if (
    match.status === "finished" &&
    match.home_team.score != null &&
    match.away_team.score != null
  ) {
    return `${match.home_team.name} ${match.home_team.score}-${match.away_team.score} ${match.away_team.name}`;
  }
  return `${match.home_team.name} - ${match.away_team.name}`;
}

function buildDescription(match: Match): string {
  const parts: string[] = [];
  if (match.competition) parts.push(match.competition);
  if (match.round) parts.push(match.round);
  return parts.join(" — ");
}

function buildLocation(match: Match): string | undefined {
  if (match.venue) return match.venue;
  if (isHomeMatch(match)) return HOME_VENUE_FALLBACK;
  return undefined;
}

function buildStartDate(match: Match): Date {
  if (match.time) {
    const [hours, minutes] = match.time.split(":").map(Number);
    const d = new Date(match.date);
    return DateTime.fromObject(
      {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: hours,
        minute: minutes,
      },
      { zone: TIMEZONE },
    ).toJSDate();
  }
  return new Date(match.date);
}

export function normalizeCacheKey(
  teamIds: string | null,
  side: string,
): string {
  const sortedIds = teamIds
    ? teamIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .sort()
        .join(",")
    : "all";
  return `ical:${sortedIds}:${side}`;
}

export function generateIcal(
  matches: readonly Match[],
  options: IcalOptions = {},
): string {
  const { side = "all" } = options;

  const cal = ical({
    name: "KCVV Elewijt — Wedstrijden",
    prodId: "-//KCVV Elewijt//Wedstrijdkalender//NL",
    timezone: TIMEZONE,
    x: {
      "X-WR-CALDESC": "Wedstrijdkalender van KCVV Elewijt",
      "X-WR-TIMEZONE": TIMEZONE,
    },
  });

  // Deduplicate by match id
  const seen = new Set<number>();
  const unique = matches.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  // Filter by side
  const filtered =
    side === "home"
      ? unique.filter(isHomeMatch)
      : side === "away"
        ? unique.filter((m) => !isHomeMatch(m))
        : unique;

  // Sort by date
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  for (const match of sorted) {
    const start = buildStartDate(match);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const location = buildLocation(match);

    cal.createEvent({
      id: `kcvv-match-${match.id}@kcvvelewijt.be`,
      summary: buildSummary(match),
      start,
      end,
      timezone: TIMEZONE,
      description: buildDescription(match),
      url: `https://www.kcvvelewijt.be/game/${match.id}`,
      ...(location ? { location } : {}),
    });
  }

  return cal.toString();
}
