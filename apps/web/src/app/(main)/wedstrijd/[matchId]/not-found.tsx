/**
 * Match Not Found Page
 * Displayed when a match cannot be found
 */

import Link from "next/link";

/**
 * Renders a centered "match not found" view for when the requested match cannot be located.
 *
 * Displays a Dutch heading ("Wedstrijd niet gevonden"), an explanatory paragraph, and two CTAs:
 * a link to the match calendar and a link back to the home page.
 *
 * @returns A JSX element containing the "match not found" UI with links to the calendar and home page.
 */
export default function MatchNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-6 px-4 text-center">
        <h1 className="font-title text-4xl font-bold text-gray-900">
          Wedstrijd niet gevonden
        </h1>
        <p className="mx-auto max-w-md text-lg text-gray-600">
          De wedstrijd die je zoekt bestaat niet of is niet meer beschikbaar.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/kalender"
            className="bg-green-main hover:bg-green-hover inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-white transition-colors"
          >
            Bekijk wedstrijdkalender
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:border-gray-400"
          >
            Terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
}
