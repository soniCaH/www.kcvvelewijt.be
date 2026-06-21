/**
 * Privacy Policy Page
 *
 * GDPR-compliant privacy policy for KCVV Elewijt. Phase 8 (8p1) reskin:
 * cream-minimal — no hero band. A mono kicker + serif `<EditorialHeading>`
 * title + mono last-updated line + Freight Display intro lead introduce a
 * single cream/ink prose column with a `<DottedDivider>` between H2 sections.
 * Replaces the legacy `<InteriorPageHero>` + `<SectionStack>` diagonal +
 * typography-plugin prose composition (master design §7 line 587).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import {
  EditorialHeading,
  DottedDivider,
  PageContainer,
} from "@/components/design-system";

/**
 * Last updated date for the privacy policy.
 * NOTE: Maintainers must update this constant whenever the privacy policy content changes.
 */
const LAST_UPDATED = "juni 2026";

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
 * Cream/ink prose styling for the legal copy. Replaces the legacy
 * typography-plugin prose treatment with design-system tokens only: H2s in
 * Freight Display 700, body in Archivo (ink-soft), links jersey-deep, dotted
 * section rules spaced via the `[role=separator]` child selector.
 */
const proseClasses = [
  "text-ink-soft",
  "[&_[role=separator]]:my-7",
  "[&_h2]:mt-0 [&_h2]:mb-2.5 [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-ink",
  "[&_h2]:text-[length:var(--text-display-sm)] [&_h2]:leading-[var(--text-display-sm--lh)]",
  "[&_p]:mt-3 [&_p]:text-[length:var(--text-body-md)] [&_p]:leading-[var(--text-body-md--lh)]",
  "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
  "[&_li]:text-[length:var(--text-body-md)] [&_li]:leading-[var(--text-body-md--lh)]",
  "[&_strong]:font-semibold [&_strong]:text-ink",
].join(" ");

export default function PrivacyPage() {
  return (
    <div className="bg-cream py-16 md:py-20">
      <PageContainer width="prose">
        <header className="flex flex-col">
          {/* Raw styled span rather than <MonoLabel>: the 8p1 lock calls for a
              jersey-deep kicker, but MonoLabel's `plain` variant only supports
              ink/cream tones. Reuses the canonical label-token kicker vocabulary
              (cf. EditorialHubCard / MatchArticleLinkCard). */}
          <span className="text-jersey-deep font-mono text-[length:var(--text-label)] font-semibold tracking-[var(--text-label--tracking)] uppercase">
            Juridisch
          </span>
          <EditorialHeading
            level={1}
            size="display-xl"
            emphasis={{ text: "verklaring." }}
            className="mt-3 mb-0 break-words hyphens-auto"
          >
            Privacyverklaring
          </EditorialHeading>
          <p className="text-ink-muted mt-3.5 font-mono text-[length:var(--text-mono-sm)] tracking-[0.04em]">
            Laatst bijgewerkt · {LAST_UPDATED}
          </p>
          <p className="text-ink-soft font-display mt-5 max-w-[60ch] text-[length:var(--text-body-lg)] leading-[var(--text-body-lg--lh)]">
            KCVV Elewijt, gevestigd aan Driesstraat 32, 1982 Elewijt,
            respecteert je privacy en behandelt je persoonsgegevens
            vertrouwelijk. Deze privacyverklaring legt uit welke gegevens we
            verzamelen, waarom we dat doen en welke rechten je hebt.
          </p>
        </header>

        <div className={`mt-10 ${proseClasses}`}>
          <DottedDivider color="paper-edge" />
          <h2>Contactgegevens</h2>
          <p>
            <strong>Verantwoordelijke:</strong> KCVV Elewijt vzw
            <br />
            <strong>Adres:</strong> Driesstraat 32, 1982 Elewijt
            <br />
            <strong>E-mail:</strong>{" "}
            <a href="mailto:info@kcvvelewijt.be" className="prose-link">
              info@kcvvelewijt.be
            </a>
            <br />
            <strong>E-mail (webmaster):</strong>{" "}
            <a href="mailto:kevin@kcvvelewijt.be" className="prose-link">
              kevin@kcvvelewijt.be
            </a>
          </p>

          <DottedDivider color="paper-edge" />
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

          <DottedDivider color="paper-edge" />
          <h2>Inschrijvingsformulier (Word lid)</h2>
          <p>
            Wanneer je je inschrijft via{" "}
            <Link href="/club/word-lid" className="prose-link">
              /club/word-lid
            </Link>
            , verwerken we enkel de gegevens die nodig zijn om je inschrijving
            op te volgen:
          </p>
          <ul>
            <li>Voornaam en achternaam</li>
            <li>Geboortedatum (om te bepalen of je minderjarig bent)</li>
            <li>Geslacht</li>
            <li>Gemeente</li>
            <li>E-mailadres</li>
            <li>Vorige club (optioneel)</li>
            <li>
              E-mailadres van een ouder/voogd (enkel bij minderjarigen, samen
              met hun toestemming)
            </li>
          </ul>
          <p>
            We vragen géén telefoonnummer, volledig adres, rijksregisternummer,
            nationaliteit of school via dit formulier. De ingediende
            inschrijvingen worden bewaard tot maximaal 1 jaar na de laatste
            opvolging, tenzij ze leiden tot een effectief lidmaatschap — dan
            geldt de bewaartermijn voor leden hieronder.
          </p>

          <DottedDivider color="paper-edge" />
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

          <DottedDivider color="paper-edge" />
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

          <DottedDivider color="paper-edge" />
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

          <DottedDivider color="paper-edge" />
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

          <DottedDivider color="paper-edge" />
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
            <a href="mailto:info@kcvvelewijt.be" className="prose-link">
              info@kcvvelewijt.be
            </a>
            .
          </p>

          <DottedDivider color="paper-edge" />
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

          <DottedDivider color="paper-edge" />
          <h2>Beveiliging</h2>
          <p>
            We nemen passende technische en organisatorische maatregelen om je
            gegevens te beschermen tegen verlies, misbruik of ongeautoriseerde
            toegang. Onze website gebruikt HTTPS-encryptie en gegevens worden
            opgeslagen op beveiligde servers.
          </p>

          <DottedDivider color="paper-edge" />
          <h2>Wijzigingen</h2>
          <p>
            We kunnen deze privacyverklaring van tijd tot tijd aanpassen. De
            meest recente versie vind je altijd op deze pagina. Laatst
            bijgewerkt: {LAST_UPDATED}.
          </p>

          <DottedDivider color="paper-edge" />
          <h2>Vragen over privacy?</h2>
          <p>
            Heb je vragen over hoe we met je gegevens omgaan? Neem gerust
            contact met ons op via de{" "}
            <Link href="/hulp" className="prose-link">
              hulppagina
            </Link>{" "}
            of stuur een e-mail naar{" "}
            <a href="mailto:info@kcvvelewijt.be" className="prose-link">
              info@kcvvelewijt.be
            </a>
            .
          </p>
        </div>
      </PageContainer>
    </div>
  );
}
