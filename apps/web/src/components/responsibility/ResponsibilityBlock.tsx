"use client";

/**
 * Responsibility Block — Homepage teaser for the /hulp page
 *
 * A compact section with the same headline + search-input visual as the
 * full /hulp page, plus three quick-link cards. Submitting the search
 * navigates to /hulp (the actual semantic search lives there). The
 * legacy role-dropdown / inline-sentence finder has been removed.
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Users, Mail, UserPlus } from "@/lib/icons";
import { HulpSearchInput } from "@/components/hulp/HulpPage";

export function ResponsibilityBlock() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The /hulp page owns the actual search experience — navigate there.
    // We intentionally don't pass the query as a URL param: HulpPage doesn't
    // read one, and the user retypes one character to re-trigger the
    // semantic search anyway.
    router.push("/hulp");
  }

  return (
    <section className="bg-gradient-to-br from-green-main/5 to-green-hover/5 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
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

        {/* Search teaser — submit navigates to /hulp */}
        <form
          onSubmit={handleSubmit}
          role="search"
          aria-label="Hulp zoeken"
          className="bg-white rounded-2xl shadow-xl p-6 md:p-10"
        >
          <HulpSearchInput
            value={query}
            onChange={setQuery}
            ariaLabel="Hulp zoeken"
          />

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
        </form>

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
