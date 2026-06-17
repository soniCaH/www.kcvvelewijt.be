/**
 * ScheurkalenderPage Component
 *
 * Private InDesign-poster data source (#2137) — Treatment A, locked in
 * `docs/design/mockups/phase-10-scheurkalender/sk1-poster-table-compare.html`.
 *
 * Renders the full-season A + B *league* fixture table the club screenshots
 * into the A2 season poster: a print-clean white sheet, Montserrat, columns
 * date·time·home·away with the KCVV side bolded and the squad label inline,
 * fixtures grouped per weekend (ISO week) with a single 2px rule between groups.
 * No logos, no squad pills, no scores.
 */

import { DateTime } from "luxon";
import { PrintButton } from "./PrintButton";
import { PrintDate } from "./PrintDate";

// KCVV is in Belgium — pin date/week derivation to Europe/Brussels so the
// weekday, DD/MM, and ISO-week bucket are stable across server/DST.
const TZ = "Europe/Brussels";

export interface ScheurkalenderMatch {
  id: number;
  /** ISO calendar date (`YYYY-MM-DD`); kickoff time lives in `time`. */
  date: string;
  /** Kickoff time as `HH:MM`. */
  time?: string;
  /** Opponent club name, exactly as PSD returns it. */
  opponent: string;
  /** Which KCVV squad plays — rendered inline ("KCVV Elewijt A" / "… B"). */
  kcvvLabel: "A" | "B";
  /** True when KCVV plays at home (KCVV occupies the home column). */
  kcvvIsHome: boolean;
}

export interface ScheurkalenderPageProps {
  /** Full-season A + B league fixtures, pre-sorted by date then time. */
  matches: ScheurkalenderMatch[];
  /** Season label for the masthead, e.g. "25/26". */
  season: string;
}

interface Weekend {
  key: string;
  matches: ScheurkalenderMatch[];
}

/** Bucket fixtures per weekend (ISO week — Mon–Sun share a `<tbody>`). */
function groupByWeekend(matches: ScheurkalenderMatch[]): Weekend[] {
  const order: string[] = [];
  const buckets = new Map<string, ScheurkalenderMatch[]>();
  for (const match of matches) {
    const dt = DateTime.fromISO(match.date, { zone: TZ });
    const key = `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, "0")}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
      order.push(key);
    }
    bucket.push(match);
  }
  return order.map((key) => ({ key, matches: buckets.get(key)! }));
}

/** "za 30/08" — lowercase Dutch weekday abbrev + DD/MM, no year. */
function formatShortDate(isoDate: string): string {
  const dt = DateTime.fromISO(isoDate, { zone: TZ }).setLocale("nl");
  return dt.isValid ? dt.toFormat("ccc dd/MM") : isoDate;
}

export function ScheurkalenderPage({
  matches,
  season,
}: ScheurkalenderPageProps) {
  const hasMatches = matches.length > 0;
  const weekends = groupByWeekend(matches);

  return (
    <div className="bg-cream min-h-screen print:bg-white">
      {/* Screen-only toolbar — hidden on print and cropped out of poster screenshots. */}
      <div className="mx-auto flex max-w-3xl justify-end px-4 pt-6 print:hidden">
        <PrintButton />
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-4 pb-12 print:p-0">
        {/* The "sheet" — this is what gets screenshotted into the InDesign poster. */}
        <div className="border-ink border-2 bg-white print:border-0">
          {/* Masthead */}
          <div className="border-ink flex items-baseline justify-between gap-4 border-b-2 px-4 py-3.5">
            <h1 className="font-body text-ink text-lg font-extrabold tracking-[0.02em] uppercase">
              KCVV Elewijt — Competitie {season}
            </h1>
            <p className="text-ink-muted font-mono text-[10px] tracking-[0.08em] uppercase">
              A &amp; B · Wedstrijdkalender
            </p>
          </div>

          {hasMatches ? (
            <table className="w-full border-collapse text-[13px]">
              {weekends.map((weekend, weekendIndex) => (
                <tbody key={weekend.key}>
                  {weekend.matches.map((match, rowIndex) => {
                    const isLastRow = rowIndex === weekend.matches.length - 1;
                    // Hairline between rows within a weekend; none on the last
                    // row; a single 2px ink rule opens each subsequent weekend.
                    const isWeekendBoundary =
                      weekendIndex > 0 && rowIndex === 0;
                    const cell = [
                      "px-2.5 py-1.5 align-baseline",
                      isLastRow ? "" : "border-b border-b-ink/15",
                      isWeekendBoundary ? "border-t-ink border-t-2" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    const kcvvName = `KCVV Elewijt ${match.kcvvLabel}`;
                    const homeName = match.kcvvIsHome
                      ? kcvvName
                      : match.opponent;
                    const awayName = match.kcvvIsHome
                      ? match.opponent
                      : kcvvName;
                    return (
                      <tr key={match.id}>
                        <td
                          className={`${cell} font-body text-ink-soft w-[88px] whitespace-nowrap`}
                        >
                          {formatShortDate(match.date)}
                        </td>
                        <td
                          className={`${cell} text-ink-muted w-[56px] text-right font-mono whitespace-nowrap`}
                        >
                          {match.time ?? ""}
                        </td>
                        <td
                          className={`${cell} text-ink ${match.kcvvIsHome ? "font-extrabold" : ""}`}
                        >
                          {homeName}
                        </td>
                        <td
                          className={`${cell} text-ink ${match.kcvvIsHome ? "" : "font-extrabold"}`}
                        >
                          {awayName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          ) : (
            <p className="text-ink-muted px-4 py-16 text-center font-mono text-sm">
              Geen competitiewedstrijden gevonden.
            </p>
          )}
        </div>

        {/* Print-only footer — kiosk prints get a date; the screen sheet stays clean. */}
        <p className="text-ink-muted mt-4 hidden text-center font-mono text-[10px] uppercase print:block">
          KCVV Elewijt · Competitie {season} · afgedrukt op <PrintDate />
        </p>
      </div>
    </div>
  );
}
