/**
 * Privacy Policy Page
 *
 * GDPR-compliant privacy policy for KCVV Elewijt
 */

import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import Link from "next/link";

/**
 * Last updated date for the privacy policy.
 * NOTE: Maintainers must update this constant whenever the privacy policy content changes.
 */
const LAST_UPDATED = "februari 2026";

export const metadata: Metadata = {
  title: "Privacyverklaring | KCVV Elewijt",
  description:
    "Privacyverklaring en cookiebeleid van KCVV Elewijt. Lees hoe we omgaan met jouw persoonsgegevens conform de GDPR wetgeving.",
  keywords: [
    "privacy",
    "privacyverklaring",
    "AVG",
    "GDPR",
    "persoonsgegevens",
    "cookies",
    "KCVV Elewijt",
  ],
  openGraph: {
    title: "Privacyverklaring - KCVV Elewijt",
    description:
      "Privacyverklaring en cookiebeleid van KCVV Elewijt conform GDPR",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

/**
 * Privacy Policy Page Component
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-main via-green-hover to-green-dark-hover text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 font-title">
            Privacyverklaring
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
            Jouw privacy is belangrijk voor ons. Lees hier hoe we omgaan met
            jouw gegevens.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-gray-dark leading-relaxed">
              KCVV Elewijt, gevestigd aan Driesstraat 30, 1982 Elewijt,
              respecteert je privacy en behandelt je persoonsgegevens
              vertrouwelijk. Deze privacyverklaring legt uit welke gegevens we
              verzamelen, waarom we dat doen en welke rechten je hebt.
            </p>
          </section>

          {/* Contact Details */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Contactgegevens
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-2">
              <p className="text-gray-dark">
                <strong>Verantwoordelijke:</strong> KCVV Elewijt vzw
              </p>
              <p className="text-gray-dark">
                <strong>Adres:</strong> Driesstraat 30, 1982 Elewijt
              </p>
              <p className="text-gray-dark">
                <strong>E-mail:</strong>{" "}
                <a
                  href="mailto:info@kcvvelewijt.be"
                  className="text-green-main hover:text-green-hover hover:underline"
                >
                  info@kcvvelewijt.be
                </a>
                .
              </p>
              <p className="text-gray-dark">
                <strong>E-mail (webmaster):</strong>{" "}
                <a
                  href="mailto:kevin@kcvvelewijt.be"
                  className="text-green-main hover:text-green-hover hover:underline"
                >
                  kevin@kcvvelewijt.be
                </a>
                .
              </p>
            </div>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Welke gegevens verzamelen we?
            </h2>
            <p className="text-gray-dark mb-4">
              We verzamelen alleen gegevens die noodzakelijk zijn voor het
              functioneren van onze club en onze website:
            </p>
            <ul className="space-y-3 text-gray-dark">
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Leden en spelers:</strong> Naam, adres, geboortedatum,
                  contactgegevens, medische informatie (indien relevant voor
                  sportbeoefening)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Website bezoekers:</strong> Technische gegevens zoals
                  IP-adres, browsertype, bezochte pagina&apos;s (via cookies)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Contactformulieren:</strong> Naam, e-mailadres en
                  bericht wanneer je contact opneemt
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Foto&apos;s en video&apos;s:</strong> Beeldmateriaal
                  gemaakt tijdens wedstrijden en evenementen (alleen met
                  toestemming)
                </div>
              </li>
            </ul>
          </section>

          {/* Purpose */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Waarvoor gebruiken we je gegevens?
            </h2>
            <ul className="space-y-3 text-gray-dark">
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  Administratie van lidmaatschappen en vergunningen bij Voetbal
                  Vlaanderen
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  Communicatie over trainingen, wedstrijden en clubactiviteiten
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>Publicatie van wedstrijdverslagen en nieuwsberichten</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>Verbetering van onze website en dienstverlening</div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>Voldoen aan wettelijke verplichtingen</div>
              </li>
            </ul>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Rechtsgrond
            </h2>
            <p className="text-gray-dark">
              We verwerken je gegevens op basis van:
            </p>
            <ul className="mt-3 space-y-2 text-gray-dark">
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Contractuele noodzaak:</strong> Voor de uitvoering van
                  je lidmaatschap
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Toestemming:</strong> Voor foto&apos;s, video&apos;s
                  en nieuwsbrieven
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Gerechtvaardigd belang:</strong> Voor het beheer en de
                  promotie van de club
                </div>
              </li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Delen we je gegevens?
            </h2>
            <p className="text-gray-dark mb-4">
              We verkopen je gegevens nooit. We delen alleen gegevens met:
            </p>
            <ul className="space-y-2 text-gray-dark">
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Voetbal Vlaanderen:</strong> Voor vergunningen en
                  wedstrijdadministratie
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Dienstverleners:</strong> Zoals onze website hosting
                  provider (onder strikte afspraken)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Wettelijke verplichtingen:</strong> Wanneer de wet dit
                  vereist
                </div>
              </li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Hoe lang bewaren we je gegevens?
            </h2>
            <ul className="space-y-2 text-gray-dark">
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Leden:</strong> Tot 7 jaar na beëindiging lidmaatschap
                  (wettelijke verplichting)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Websitebezoekers:</strong> Maximum 2 jaar (cookies)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Foto&apos;s en video&apos;s:</strong> Zolang
                  toestemming geldig is
                </div>
              </li>
            </ul>
          </section>

          {/* Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Jouw rechten
            </h2>
            <p className="text-gray-dark mb-4">
              Volgens de GDPR/AVG heb je volgende rechten:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-blue mb-2">
                  Recht op inzage
                </h3>
                <p className="text-sm text-gray-dark">
                  Je kan opvragen welke gegevens we van jou hebben
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-blue mb-2">
                  Recht op correctie
                </h3>
                <p className="text-sm text-gray-dark">
                  Je kan onjuiste gegevens laten corrigeren
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-blue mb-2">
                  Recht op verwijdering
                </h3>
                <p className="text-sm text-gray-dark">
                  Je kan verwijdering van je gegevens vragen
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-blue mb-2">
                  Recht op bezwaar
                </h3>
                <p className="text-sm text-gray-dark">
                  Je kan bezwaar maken tegen bepaalde verwerkingen
                </p>
              </div>
            </div>
            <p className="text-gray-dark mt-4">
              Om deze rechten uit te oefenen, contacteer ons via{" "}
              <a
                href="mailto:info@kcvvelewijt.be"
                className="text-green-main hover:text-green-hover hover:underline"
              >
                info@kcvvelewijt.be
              </a>
              .
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Cookiebeleid
            </h2>
            <p className="text-gray-dark mb-4">
              Onze website gebruikt cookies om de gebruikerservaring te
              verbeteren:
            </p>
            <ul className="space-y-3 text-gray-dark">
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Noodzakelijke cookies:</strong> Voor
                  basisfunctionaliteit van de website
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-main mt-1" aria-hidden="true">
                  •
                </span>
                <div>
                  <strong>Analytische cookies:</strong> Om te begrijpen hoe
                  bezoekers de site gebruiken (geanonimiseerd)
                </div>
              </li>
            </ul>
            <p className="text-gray-dark mt-4">
              Je kan cookies beheren via je browserinstellingen.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Beveiliging
            </h2>
            <p className="text-gray-dark">
              We nemen passende technische en organisatorische maatregelen om je
              gegevens te beschermen tegen verlies, misbruik of ongeautoriseerde
              toegang. Onze website gebruikt HTTPS-encryptie en gegevens worden
              opgeslagen op beveiligde servers.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Wijzigingen
            </h2>
            <p className="text-gray-dark">
              We kunnen deze privacyverklaring van tijd tot tijd aanpassen. De
              meest recente versie vind je altijd op deze pagina. Laatst
              bijgewerkt: {LAST_UPDATED}.
            </p>
          </section>

          {/* Questions */}
          <section className="bg-green-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-blue mb-4">
              Vragen over privacy?
            </h2>
            <p className="text-gray-dark mb-4">
              Heb je vragen over hoe we met je gegevens omgaan? Neem gerust
              contact met ons op.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/hulp"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-main text-white rounded-lg hover:bg-green-hover transition-colors font-semibold"
              >
                Contact via hulppagina
              </Link>
              <a
                href="mailto:info@kcvvelewijt.be"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-main border-2 border-green-main rounded-lg hover:bg-green-50 transition-colors font-semibold"
              >
                E-mail ons direct
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
