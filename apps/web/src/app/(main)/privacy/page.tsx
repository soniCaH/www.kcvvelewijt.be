/**
 * Privacy Policy Page
 *
 * GDPR-compliant privacy policy for KCVV Elewijt. Wraps the legal copy in
 * the standard SectionStack + InteriorPageHero layout used across the redesigned
 * pages — compact dark hero followed by a single gray-100 prose section.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { InteriorPageHero } from "@/components/layout/InteriorPageHero";

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

export default function PrivacyPage() {
  const sections: SectionConfig[] = [
    {
      key: "hero",
      bg: "kcvv-black",
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      content: (
        <InteriorPageHero
          size="compact"
          gradient="dark"
          label="Juridisch"
          headline="Privacyverklaring"
          body="Hoe wij omgaan met jouw gegevens."
        />
      ),
      transition: { type: "diagonal", direction: "right", overlap: "full" },
    },
    {
      key: "content",
      bg: "gray-100",
      content: (
        <article className="prose prose-gray mx-auto max-w-2xl px-4 md:px-10">
          <p>
            KCVV Elewijt, gevestigd aan Driesstraat 30, 1982 Elewijt,
            respecteert je privacy en behandelt je persoonsgegevens
            vertrouwelijk. Deze privacyverklaring legt uit welke gegevens we
            verzamelen, waarom we dat doen en welke rechten je hebt.
          </p>

          <h2>Contactgegevens</h2>
          <p>
            <strong>Verantwoordelijke:</strong> KCVV Elewijt vzw
            <br />
            <strong>Adres:</strong> Driesstraat 30, 1982 Elewijt
            <br />
            <strong>E-mail:</strong>{" "}
            <a href="mailto:info@kcvvelewijt.be">info@kcvvelewijt.be</a>
            <br />
            <strong>E-mail (webmaster):</strong>{" "}
            <a href="mailto:kevin@kcvvelewijt.be">kevin@kcvvelewijt.be</a>
          </p>

          <h2>Welke gegevens verzamelen we?</h2>
          <p>
            We verzamelen alleen gegevens die noodzakelijk zijn voor het
            functioneren van onze club en onze website:
          </p>
          <ul>
            <li>
              <strong>Leden en spelers:</strong> Naam, adres, geboortedatum,
              contactgegevens, medische informatie (indien relevant voor
              sportbeoefening)
            </li>
            <li>
              <strong>Website bezoekers:</strong> Technische gegevens zoals
              IP-adres, browsertype, bezochte pagina&apos;s (via cookies)
            </li>
            <li>
              <strong>Contactformulieren:</strong> Naam, e-mailadres en bericht
              wanneer je contact opneemt
            </li>
            <li>
              <strong>Foto&apos;s en video&apos;s:</strong> Beeldmateriaal
              gemaakt tijdens wedstrijden en evenementen (alleen met
              toestemming)
            </li>
          </ul>

          <h2>Waarvoor gebruiken we je gegevens?</h2>
          <ul>
            <li>
              Administratie van lidmaatschappen en vergunningen bij Voetbal
              Vlaanderen
            </li>
            <li>
              Communicatie over trainingen, wedstrijden en clubactiviteiten
            </li>
            <li>Publicatie van wedstrijdverslagen en nieuwsberichten</li>
            <li>Verbetering van onze website en dienstverlening</li>
            <li>Voldoen aan wettelijke verplichtingen</li>
          </ul>

          <h2>Rechtsgrond</h2>
          <p>We verwerken je gegevens op basis van:</p>
          <ul>
            <li>
              <strong>Contractuele noodzaak:</strong> Voor de uitvoering van je
              lidmaatschap
            </li>
            <li>
              <strong>Toestemming:</strong> Voor foto&apos;s, video&apos;s en
              nieuwsbrieven
            </li>
            <li>
              <strong>Gerechtvaardigd belang:</strong> Voor het beheer en de
              promotie van de club
            </li>
          </ul>

          <h2>Delen we je gegevens?</h2>
          <p>We verkopen je gegevens nooit. We delen alleen gegevens met:</p>
          <ul>
            <li>
              <strong>Voetbal Vlaanderen:</strong> Voor vergunningen en
              wedstrijdadministratie
            </li>
            <li>
              <strong>Dienstverleners:</strong> Zoals onze website hosting
              provider (onder strikte afspraken)
            </li>
            <li>
              <strong>Wettelijke verplichtingen:</strong> Wanneer de wet dit
              vereist
            </li>
          </ul>

          <h2>Hoe lang bewaren we je gegevens?</h2>
          <ul>
            <li>
              <strong>Leden:</strong> Tot 7 jaar na beëindiging lidmaatschap
              (wettelijke verplichting)
            </li>
            <li>
              <strong>Websitebezoekers:</strong> Maximum 2 jaar (cookies)
            </li>
            <li>
              <strong>Foto&apos;s en video&apos;s:</strong> Zolang toestemming
              geldig is
            </li>
          </ul>

          <h2>Jouw rechten</h2>
          <p>Volgens de GDPR/AVG heb je volgende rechten:</p>
          <ul>
            <li>
              <strong>Recht op inzage:</strong> Je kan opvragen welke gegevens
              we van jou hebben
            </li>
            <li>
              <strong>Recht op correctie:</strong> Je kan onjuiste gegevens
              laten corrigeren
            </li>
            <li>
              <strong>Recht op verwijdering:</strong> Je kan verwijdering van je
              gegevens vragen
            </li>
            <li>
              <strong>Recht op bezwaar:</strong> Je kan bezwaar maken tegen
              bepaalde verwerkingen
            </li>
          </ul>
          <p>
            Om deze rechten uit te oefenen, contacteer ons via{" "}
            <a href="mailto:info@kcvvelewijt.be">info@kcvvelewijt.be</a>.
          </p>

          <h2>Cookiebeleid</h2>
          <p>
            Onze website gebruikt cookies om de gebruikerservaring te
            verbeteren:
          </p>
          <ul>
            <li>
              <strong>Noodzakelijke cookies:</strong> Voor basisfunctionaliteit
              van de website
            </li>
            <li>
              <strong>Analytische cookies:</strong> Om te begrijpen hoe
              bezoekers de site gebruiken (geanonimiseerd)
            </li>
          </ul>
          <p>Je kan cookies beheren via je browserinstellingen.</p>

          <h2>Beveiliging</h2>
          <p>
            We nemen passende technische en organisatorische maatregelen om je
            gegevens te beschermen tegen verlies, misbruik of ongeautoriseerde
            toegang. Onze website gebruikt HTTPS-encryptie en gegevens worden
            opgeslagen op beveiligde servers.
          </p>

          <h2>Wijzigingen</h2>
          <p>
            We kunnen deze privacyverklaring van tijd tot tijd aanpassen. De
            meest recente versie vind je altijd op deze pagina. Laatst
            bijgewerkt: {LAST_UPDATED}.
          </p>

          <h2>Vragen over privacy?</h2>
          <p>
            Heb je vragen over hoe we met je gegevens omgaan? Neem gerust
            contact met ons op via de <Link href="/hulp">hulppagina</Link> of
            stuur een e-mail naar{" "}
            <a href="mailto:info@kcvvelewijt.be">info@kcvvelewijt.be</a>.
          </p>
        </article>
      ),
    },
  ];

  return <SectionStack sections={sections} />;
}
