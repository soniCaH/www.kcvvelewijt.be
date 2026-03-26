"use client";

/**
 * Responsibility Block for Homepage
 *
 * Compact version of the responsibility finder for the homepage
 */

import Link from "next/link";
import { ChevronRight, Users, Mail, UserPlus } from "@/lib/icons";
import { ResponsibilityFinder } from "./ResponsibilityFinder";
import type { ResponsibilityPath } from "@/types/responsibility";

/**
 * Render the homepage responsibility block with a compact responsibility finder, a link to the full help page, and three quick-link cards.
 *
 * @param paths - Optional list of responsibility paths supplied to the finder; defaults to an empty array.
 * @returns The React element for the responsibility block.
 */
export function ResponsibilityBlock({
  paths = [],
}: {
  paths?: ResponsibilityPath[];
}) {
  return (
    <section className="bg-gradient-to-br from-green-main/5 to-green-hover/5 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-5xl font-bold text-gray-blue mb-4"
            style={{
              fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
            }}
          >
            Hoe kunnen we je helpen?
          </h2>
          <p className="text-lg md:text-xl text-gray-dark max-w-2xl mx-auto">
            Vind snel de juiste contactpersoon voor jouw vraag
          </p>
        </div>

        {/* Compact Finder */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <ResponsibilityFinder paths={paths} compact />

          {/* Link to full page */}
          <div className="mt-8 text-center">
            <Link
              href="/hulp"
              className="inline-flex items-center gap-2 text-green-main hover:text-green-hover font-semibold transition-colors"
            >
              Bekijk alle veelgestelde vragen
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/club/organigram"
            className="relative overflow-hidden bg-white rounded-card p-4 shadow-sm hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
          >
            <div
              className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-main/10 rounded-full flex items-center justify-center text-green-main group-hover:bg-green-main group-hover:text-white transition-colors">
                <Users size={20} />
              </div>
              <div>
                <div className="font-semibold text-gray-blue group-hover:text-green-main">
                  Organigram
                </div>
                <div className="text-xs text-gray-medium">
                  Alle bestuursleden
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/club/contact"
            className="relative overflow-hidden bg-white rounded-card p-4 shadow-sm hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
          >
            <div
              className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-main/10 rounded-full flex items-center justify-center text-green-main group-hover:bg-green-main group-hover:text-white transition-colors">
                <Mail size={20} />
              </div>
              <div>
                <div className="font-semibold text-gray-blue group-hover:text-green-main">
                  Contact
                </div>
                <div className="text-xs text-gray-medium">Algemene info</div>
              </div>
            </div>
          </Link>

          <Link
            href="/club/inschrijven"
            className="relative overflow-hidden bg-white rounded-card p-4 shadow-sm hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
          >
            <div
              className="absolute top-0 inset-x-0 h-[3px] bg-kcvv-green-bright z-20 pointer-events-none [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)] transition-[clip-path] duration-300 ease-out"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-main/10 rounded-full flex items-center justify-center text-green-main group-hover:bg-green-main group-hover:text-white transition-colors">
                <UserPlus size={20} />
              </div>
              <div>
                <div className="font-semibold text-gray-blue group-hover:text-green-main">
                  Inschrijven
                </div>
                <div className="text-xs text-gray-medium">Word lid</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
