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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function calendarDaysBetween(from: Date, to: Date): number {
  const fromUtc = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  const toUtc = Date.UTC(
    to.getUTCFullYear(),
    to.getUTCMonth(),
    to.getUTCDate(),
  );
  return Math.round((toUtc - fromUtc) / MS_PER_DAY);
}

export function resolveContent(
  placeholder?: MatchesSliderPlaceholderVM | null,
  now: Date = new Date(),
): ResolvedContent {
  const kickoff = placeholder?.nextSeasonKickoff;
  const text = placeholder?.announcementText;
  const href = placeholder?.announcementHref;

  if (kickoff) {
    const daysUntil = calendarDaysBetween(now, kickoff);
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
