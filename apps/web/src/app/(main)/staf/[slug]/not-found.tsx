/**
 * Staff Member Not Found Page
 * Custom 404 page for staff member routes
 */

import Link from "next/link";

export default function StafNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mb-6">
          <svg
            className="text-kcvv-gray mx-auto h-24 w-24 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-kcvv-gray-dark mb-4 text-3xl font-bold">
          Stafmedewerker niet gevonden
        </h1>

        {/* Description */}
        <p className="text-kcvv-gray mb-8">
          De stafmedewerker die je zoekt bestaat niet of is niet langer
          beschikbaar. Bekijk het organigram voor een overzicht van onze staf.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/club/organigram"
            className="bg-kcvv-green-bright hover:bg-kcvv-green inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium text-white transition-colors"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Bekijk organigram
          </Link>

          <Link
            href="/"
            className="text-kcvv-gray-dark inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium transition-colors hover:bg-gray-50"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Naar home
          </Link>
        </div>
      </div>
    </div>
  );
}
