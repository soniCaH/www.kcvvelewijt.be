/**
 * HelpPage Component
 * "Ik ben ... en ik ..." question builder to find the right contact person
 */

import Link from "next/link";
import { ResponsibilityFinder } from "@/components/responsibility";
import type { ResponsibilityPath } from "@/types/responsibility";

export function HelpPage({ paths = [] }: { paths?: ResponsibilityPath[] }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-linear-to-br from-green-main via-green-hover to-green-dark-hover text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{
              fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
            }}
          >
            Hoe kunnen we je helpen?
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
            Vertel ons wie je bent en wat je nodig hebt. We wijzen je de weg
            naar de juiste persoon.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <ResponsibilityFinder paths={paths} />

        {/* Additional Info */}
        <h2
          className="mt-16 text-xl font-bold text-gray-blue mb-4"
          style={{
            fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
          }}
        >
          Meer informatie
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-main">
            <h3 className="font-bold text-gray-blue mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-main"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Bekijk organigram
            </h3>
            <p className="text-gray-dark text-sm mb-3">
              Wil je een overzicht van alle bestuursleden en hun
              verantwoordelijkheden?
            </p>
            <Link
              href="/club/organigram"
              className="text-green-main hover:text-green-hover font-semibold inline-flex items-center gap-1"
            >
              Ga naar organigram
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-main">
            <h3 className="font-bold text-gray-blue mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-main"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Algemeen contact
            </h3>
            <p className="text-gray-dark text-sm mb-3">
              Voor algemene vragen kan je ook altijd terecht bij:
            </p>
            <a
              href="mailto:info@kcvvelewijt.be"
              className="text-green-main hover:text-green-hover font-semibold"
            >
              info@kcvvelewijt.be
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
          <h2
            className="text-2xl font-bold text-gray-blue mb-6"
            style={{
              fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
            }}
          >
            Hoe werkt het?
          </h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="shrink-0 w-8 h-8 bg-green-main text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-blue">Kies je rol</h3>
                <p className="text-gray-dark text-sm">
                  Ben je speler, ouder, trainer, supporter of iemand anders?
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-8 h-8 bg-green-main text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-blue">Typ je vraag</h3>
                <p className="text-gray-dark text-sm">
                  Begin met typen en je krijgt slimme suggesties te zien
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0 w-8 h-8 bg-green-main text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-blue">
                  Vind je antwoord
                </h3>
                <p className="text-gray-dark text-sm">
                  Zie direct wie je moet contacteren en wat je moet doen
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
