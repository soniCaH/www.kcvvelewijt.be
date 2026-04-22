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
    <section className="from-green-main/5 to-green-hover/5 bg-gradient-to-br px-4 py-16">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2
            className="text-gray-blue mb-4 text-3xl font-bold md:text-5xl"
            style={{
              fontFamily:
                "quasimoda, -apple-system, system-ui, Montserrat, sans-serif",
            }}
          >
            Hoe kunnen we je helpen?
          </h2>
          <p className="text-gray-dark mx-auto max-w-2xl text-lg md:text-xl">
            Vind snel de juiste contactpersoon voor jouw vraag
          </p>
        </div>

        {/* Search teaser — submit navigates to /hulp */}
        <form
          onSubmit={handleSubmit}
          role="search"
          aria-label="Hulp zoeken"
          className="rounded-2xl bg-white p-6 shadow-xl md:p-10"
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
              className="text-green-main hover:text-green-hover inline-flex items-center gap-2 font-semibold transition-colors"
            >
              Bekijk alle veelgestelde vragen
              <ChevronRight size={16} />
            </Link>
          </div>
        </form>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/club/organigram"
            className="rounded-card hover:shadow-card-hover group relative overflow-hidden bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1"
          >
            <div
              className="bg-kcvv-green-bright pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] transition-[clip-path] duration-300 ease-out [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3">
              <div className="bg-green-main/10 text-green-main group-hover:bg-green-main flex h-10 w-10 items-center justify-center rounded-full transition-colors group-hover:text-white">
                <Users size={20} />
              </div>
              <div>
                <div className="text-gray-blue group-hover:text-green-main font-semibold">
                  Organigram
                </div>
                <div className="text-gray-medium text-xs">
                  Alle bestuursleden
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/club/contact"
            className="rounded-card hover:shadow-card-hover group relative overflow-hidden bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1"
          >
            <div
              className="bg-kcvv-green-bright pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] transition-[clip-path] duration-300 ease-out [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3">
              <div className="bg-green-main/10 text-green-main group-hover:bg-green-main flex h-10 w-10 items-center justify-center rounded-full transition-colors group-hover:text-white">
                <Mail size={20} />
              </div>
              <div>
                <div className="text-gray-blue group-hover:text-green-main font-semibold">
                  Contact
                </div>
                <div className="text-gray-medium text-xs">Algemene info</div>
              </div>
            </div>
          </Link>

          <Link
            href="/club/inschrijven"
            className="rounded-card hover:shadow-card-hover group relative overflow-hidden bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1"
          >
            <div
              className="bg-kcvv-green-bright pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] transition-[clip-path] duration-300 ease-out [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3">
              <div className="bg-green-main/10 text-green-main group-hover:bg-green-main flex h-10 w-10 items-center justify-center rounded-full transition-colors group-hover:text-white">
                <UserPlus size={20} />
              </div>
              <div>
                <div className="text-gray-blue group-hover:text-green-main font-semibold">
                  Inschrijven
                </div>
                <div className="text-gray-medium text-xs">Word lid</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
