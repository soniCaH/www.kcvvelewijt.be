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
  /** Squad label — identifies which KCVV team plays (e.g. "A-Ploeg", "U21") */
  squadLabel?: string;
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
      <div className="from-green-main via-green-hover to-green-dark-hover bg-linear-to-br px-4 py-10 text-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-4">
          <div>
            <h1 className="font-title mb-2 text-3xl font-bold md:text-5xl">
              Scheurkalender
            </h1>
            <p className="text-white/90">
              Printbare versie van de wedstrijdkalender
            </p>
          </div>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 print:px-0 print:py-4">
        {/* Print header (visible only on print) */}
        <div className="mb-6 hidden border-b-2 border-black pb-4 text-center print:block">
          <h1 className="text-2xl font-bold">
            KCVV Elewijt — Wedstrijdkalender
          </h1>
          <p className="text-sm text-gray-500">
            Afgedrukt op <PrintDate />
          </p>
        </div>

        {!hasMatches ? (
          <div className="py-16 text-center">
            <p className="text-gray-500">
              Geen aankomende wedstrijden gevonden.
            </p>
          </div>
        ) : (
          <div className="space-y-6 print:space-y-4">
            {days.map(({ key, label, matches }) => (
              <div key={key} className="print:break-inside-avoid">
                {/* Date header */}
                <div className="bg-green-main mb-2 rounded-lg px-4 py-2 text-white print:rounded-none print:bg-gray-800">
                  <span className="font-bold capitalize">{label}</span>
                </div>

                {/* Matches for this day */}
                <div className="space-y-2 print:space-y-1">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 print:rounded-none print:border-b print:border-gray-200 print:bg-white"
                    >
                      {/* Time */}
                      <div className="w-12 shrink-0 font-mono text-sm text-gray-500">
                        {match.time ?? "—"}
                      </div>

                      {/* Squad label */}
                      {match.squadLabel && (
                        <div className="w-20 shrink-0">
                          <span className="text-green-main bg-green-main/10 rounded px-2 py-0.5 text-xs font-semibold print:bg-transparent print:text-black">
                            {match.squadLabel}
                          </span>
                        </div>
                      )}

                      {/* Home team */}
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        {match.homeTeam.logo && (
                          <Image
                            src={match.homeTeam.logo}
                            alt=""
                            aria-hidden="true"
                            width={20}
                            height={20}
                            className="shrink-0 object-contain print:hidden"
                          />
                        )}
                        <span className="truncate text-sm font-medium">
                          {match.homeTeam.name}
                        </span>
                      </div>

                      <span className="shrink-0 text-xs text-gray-400">vs</span>

                      {/* Away team */}
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                        <span className="truncate text-right text-sm font-medium">
                          {match.awayTeam.name}
                        </span>
                        {match.awayTeam.logo && (
                          <Image
                            src={match.awayTeam.logo}
                            alt=""
                            aria-hidden="true"
                            width={20}
                            height={20}
                            className="shrink-0 object-contain print:hidden"
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
            className="hover:text-green-main text-sm text-gray-500 transition-colors"
          >
            ← Terug naar kalender
          </Link>
        </div>
      </div>
    </div>
  );
}
