/**
 * ContactPage Component
 * Club contact information and categorized email contacts
 */

import Link from "next/link";
import {
  MapPin,
  Mail,
  ExternalLink,
  CircleParking,
  Ticket,
  Coffee,
  Accessibility,
} from "@/lib/icons";
import { MapEmbed } from "./MapEmbed";
import type { KeyContactVM } from "@/lib/repositories/staff.repository";

interface ContactPageProps {
  keyContacts?: KeyContactVM[];
}

const CONTACT_CATEGORIES = [
  {
    label: "Algemene vragen",
    email: "info@kcvvelewijt.be",
    description: "Algemene informatie over de club",
  },
  {
    label: "Jeugdwerking",
    email: "jeugd@kcvvelewijt.be",
    description: "Inschrijvingen, stages en jeugdactiviteiten",
  },
  {
    label: "Sponsoring",
    email: "sponsoring@kcvvelewijt.be",
    description: "Partnerschappen en sponsormogelijkheden",
  },
  {
    label: "Webmaster",
    email: "kevin@kcvvelewijt.be",
    description: "Technische vragen over de website",
  },
];

export function ContactPage({ keyContacts }: ContactPageProps = {}) {
  const hasKeyContacts = keyContacts && keyContacts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero */}
      <div className="from-green-main via-green-hover to-green-dark-hover bg-gradient-to-br px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-title mb-4 text-4xl font-bold md:text-6xl">
            Contact
          </h1>
          <p className="max-w-3xl text-xl text-white/90 md:text-2xl">
            Heb je een vraag? We helpen je graag verder.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-12">
        {/* Club info + map */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Club details */}
          <div className="space-y-6 rounded-xl bg-white p-8 shadow-sm">
            <h2 className="text-gray-blue font-title text-2xl font-bold">
              Clubgegevens
            </h2>

            <div className="flex items-start gap-3">
              <MapPin
                className="text-green-main mt-0.5 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-gray-blue font-semibold">Adres</p>
                <p className="text-gray-dark">Driesstraat 30</p>
                <p className="text-gray-dark">1982 Elewijt (Zemst)</p>
                <a
                  href="https://maps.google.com/?q=Driesstraat+30,+1982+Elewijt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-main hover:text-green-hover mt-1 inline-flex items-center gap-1 text-sm"
                >
                  Routebeschrijving
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail
                className="text-green-main mt-0.5 h-5 w-5 flex-shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-gray-blue font-semibold">E-mail</p>
                <a
                  href="mailto:info@kcvvelewijt.be"
                  className="text-green-main hover:text-green-hover hover:underline"
                >
                  info@kcvvelewijt.be
                </a>
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <Link
                href="/hulp"
                className="hover:bg-green-main/5 group flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors"
              >
                <div>
                  <p className="text-gray-blue text-sm font-semibold">
                    Weet je niet wie je moet contacteren?
                  </p>
                  <p className="text-gray-dark text-xs">
                    Gebruik onze hulpvinder
                  </p>
                </div>
                <span
                  className="text-green-main transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
              <Link
                href="/club/organigram"
                className="hover:bg-green-main/5 group flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors"
              >
                <div>
                  <p className="text-gray-blue text-sm font-semibold">
                    Bekijk het volledige organigram
                  </p>
                  <p className="text-gray-dark text-xs">
                    Alle bestuursleden en contactgegevens
                  </p>
                </div>
                <span
                  className="text-green-main transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Map embed — OpenStreetMap, no consent needed */}
          <MapEmbed />
        </div>

        {/* Key contacts */}
        {hasKeyContacts && (
          <div>
            <h2 className="text-gray-blue font-title mb-6 text-2xl font-bold">
              Snelle contacten
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {keyContacts.map((contact, index) => (
                <div
                  key={`${contact.role}-${contact.email}-${index}`}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-green-main mb-1 text-xs font-semibold tracking-wide uppercase">
                    {contact.role}
                  </p>
                  <p className="text-gray-blue font-bold">{contact.name}</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-green-main hover:text-green-hover mt-2 inline-flex items-center gap-1.5 text-sm hover:underline"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {contact.email}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact categories */}
        <div>
          <h2 className="text-gray-blue font-title mb-6 text-2xl font-bold">
            Contacteer ons per categorie
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CONTACT_CATEGORIES.map((cat) => (
              <a
                key={cat.email}
                href={`mailto:${cat.email}`}
                className="hover:border-green-main group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <Mail
                    className="text-green-main mt-0.5 h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-gray-blue group-hover:text-green-main font-bold transition-colors">
                      {cat.label}
                    </p>
                    <p className="text-gray-dark mb-1 text-sm">
                      {cat.description}
                    </p>
                    <p className="text-green-main text-sm">{cat.email}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Matchday & venue info */}
        <div>
          <h2 className="text-gray-blue font-title mb-6 text-2xl font-bold">
            Kom naar ons
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Parking */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <CircleParking
                  className="text-green-main mt-0.5 h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-gray-blue mb-2 font-bold">Parking</p>
                  {/* TODO: add gemeente Zemst parking plan URL once confirmed */}
                  <p className="text-gray-dark text-sm">
                    Parkeren kan aan het voetbalveld en rondom het Van Innis
                    sportpark. Een gedetailleerd parkeerplan vind je op de
                    website van de gemeente Zemst.
                  </p>
                </div>
              </div>
            </div>

            {/* Entry prices */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Ticket
                  className="text-green-main mt-0.5 h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-gray-blue mb-2 font-bold">Inkom</p>
                  <table className="text-gray-dark w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-1 text-left font-semibold">
                          Wedstrijd
                        </th>
                        <th className="py-1 text-right font-semibold">Prijs</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-50">
                        <td className="py-1">Jeugd</td>
                        <td className="py-1 text-right">€3</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-1">B-ploeg</td>
                        <td className="py-1 text-right">€5</td>
                      </tr>
                      <tr>
                        <td className="py-1">A-ploeg</td>
                        <td className="py-1 text-right">€10</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Canteen */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Coffee
                  className="text-green-main mt-0.5 h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-gray-blue mb-2 font-bold">Kantine</p>
                  <p className="text-gray-dark mb-2 text-sm">
                    De kantine is open op trainingsdagen:
                  </p>
                  <ul className="text-gray-dark space-y-1 text-sm">
                    <li>Woensdag &amp; vrijdag: vanaf 18u00</li>
                    <li>Donderdag: vanaf 20u00</li>
                  </ul>
                  <p className="text-gray-dark mt-2 text-sm">
                    Op wedstrijddagen zijn er geen vaste uren.
                  </p>
                </div>
              </div>
            </div>

            {/* Accessibility */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Accessibility
                  className="text-green-main mt-0.5 h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-gray-blue mb-2 font-bold">
                    Toegankelijkheid
                  </p>
                  <p className="text-gray-dark text-sm">
                    Het sportpark is toegankelijk voor rolstoelgebruikers. Er
                    zijn 2 voorbehouden parkeerplaatsen beschikbaar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
