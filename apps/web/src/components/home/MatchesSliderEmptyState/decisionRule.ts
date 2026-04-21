import { DateTime } from "luxon";
import type { MatchesSliderPlaceholderVM } from "@/lib/repositories/homepage.repository";

export type ResolvedContent =
  | { mode: "baseline"; eyebrow: "TUSSENSEIZOEN" }
  | {
      mode: "countdown";
      eyebrow: "NIEUW SEIZOEN";
      daysUntil: number;
      kickoffDate: Date;
      secondary?: string;
    }
  | {
      mode: "today";
      eyebrow: "NIEUW SEIZOEN";
      kickoffDate: Date;
      secondary?: string;
    }
  | {
      mode: "announcement";
      eyebrow: "MEDEDELING";
      text: string;
      href?: string;
    };

const CLUB_ZONE = "Europe/Brussels";

// Calendar-days diff anchored to the club's local zone so a 23:30 UTC "now"
// (00:30 Brussels) reads the same calendar date as 01:30 UTC the next day.
function clubCalendarDaysBetween(from: Date, to: Date): number {
  const fromDay = DateTime.fromJSDate(from, { zone: CLUB_ZONE }).startOf("day");
  const toDay = DateTime.fromJSDate(to, { zone: CLUB_ZONE }).startOf("day");
  return Math.round(toDay.diff(fromDay, "days").days);
}

export function resolveContent(
  placeholder?: MatchesSliderPlaceholderVM | null,
  now: Date = new Date(),
): ResolvedContent {
  const kickoff = placeholder?.nextSeasonKickoff;
  const text = placeholder?.announcementText;
  const href = placeholder?.announcementHref;

  if (kickoff) {
    const daysUntil = clubCalendarDaysBetween(now, kickoff);
    if (daysUntil === 0) {
      return {
        mode: "today",
        eyebrow: "NIEUW SEIZOEN",
        kickoffDate: kickoff,
        secondary: text || undefined,
      };
    }
    if (daysUntil > 0) {
      return {
        mode: "countdown",
        eyebrow: "NIEUW SEIZOEN",
        daysUntil,
        kickoffDate: kickoff,
        secondary: text || undefined,
      };
    }
    // Past kickoff → fall through to other modes or baseline.
  }

  if (text) {
    return {
      mode: "announcement",
      eyebrow: "MEDEDELING",
      text,
      href: href || undefined,
    };
  }

  return { mode: "baseline", eyebrow: "TUSSENSEIZOEN" };
}
