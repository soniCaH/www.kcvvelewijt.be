/**
 * ScheurkalenderPage Component
 *
 * Presentational layout for /scheurkalender.
 * Renders a print-friendly upcoming-matches calendar grouped by date.
 */

import Image from "next/image";
import Link from "next/link";
import { PrintButton } from "./PrintButton";
import { PrintDate } from "./PrintDate";

export interface ScheurkalenderMatch {
  id: number;
  /** Match time as HH:MM string */
  time?: string;
  /** Round or label (e.g. team name) */
  round?: string;
  homeTeam: { name: string; logo?: string };
  awayTeam: { name: string; logo?: string };
}

export interface ScheurkalenderDay {
  /** Label shown as section heading (full Dutch date string) */
  label: string;
  /** ISO date string used as stable key (YYYY-MM-DD) */
  key: string;
  matches: ScheurkalenderMatch[];
}

export interface ScheurkalenderPageProps {
  days: ScheurkalenderDay[];
}

export function ScheurkalenderPage({ days }: ScheurkalenderPageProps) {
  const hasMatches = days.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Screen header (hidden on print) */}
      <div className="print:hidden bg-linear-to-br from-green-main via-green-hover to-green-dark-hover text-white py-10 px-4">
        <div className="max-w-3xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold font-title mb-2">
              Scheurkalender
            </h1>
            <p className="text-white/90">
              Printbare versie van de wedstrijdkalender
            </p>
          </div>
          <PrintButton />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 print:px-0 print:py-4">
        {/* Print header (visible only on print) */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">
            KCVV Elewijt — Wedstrijdkalender
          </h1>
          <p className="text-sm text-gray-500">
            Afgedrukt op <PrintDate />
          </p>
        </div>

        {!hasMatches ? (
          <div className="text-center py-16">
            <p className="text-gray-500">
              Geen aankomende wedstrijden gevonden.
            </p>
          </div>
        ) : (
          <div className="space-y-6 print:space-y-4">
            {days.map(({ key, label, matches }) => (
              <div key={key} className="print:break-inside-avoid">
                {/* Date header */}
                <div className="bg-green-main text-white px-4 py-2 rounded-lg print:rounded-none print:bg-gray-800 mb-2">
                  <span className="font-bold capitalize">{label}</span>
                </div>

                {/* Matches for this day */}
                <div className="space-y-2 print:space-y-1">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg print:rounded-none print:bg-white print:border-b print:border-gray-200"
                    >
                      {/* Time */}
                      <div className="w-12 text-sm font-mono text-gray-500 shrink-0">
                        {match.time ?? "—"}
                      </div>

                      {/* Team / round label */}
                      {match.round && (
                        <div className="w-20 shrink-0">
                          <span className="text-xs font-semibold text-green-main bg-green-main/10 px-2 py-0.5 rounded print:bg-transparent print:text-black">
                            {match.round}
                          </span>
                        </div>
                      )}

                      {/* Home team */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {match.homeTeam.logo && (
                          <Image
                            src={match.homeTeam.logo}
                            alt=""
                            aria-hidden="true"
                            width={20}
                            height={20}
                            className="object-contain shrink-0 print:hidden"
                          />
                        )}
                        <span className="text-sm font-medium truncate">
                          {match.homeTeam.name}
                        </span>
                      </div>

                      <span className="text-xs text-gray-400 shrink-0">vs</span>

                      {/* Away team */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium truncate text-right">
                          {match.awayTeam.name}
                        </span>
                        {match.awayTeam.logo && (
                          <Image
                            src={match.awayTeam.logo}
                            alt=""
                            aria-hidden="true"
                            width={20}
                            height={20}
                            className="object-contain shrink-0 print:hidden"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back link (screen only) */}
        <div className="mt-8 print:hidden">
          <Link
            href="/kalender"
            className="text-sm text-gray-500 hover:text-green-main transition-colors"
          >
            ← Terug naar kalender
          </Link>
        </div>
      </div>
    </div>
  );
}
