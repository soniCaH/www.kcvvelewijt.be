import type { Metadata } from "next";
import Image from "next/image";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { PageHero } from "@/components/design-system/PageHero";
import {
  ULTRAS_HEADER_HERO,
  ULTRAS_KAMPIOEN,
  ULTRAS_SJR,
} from "@/lib/sanity/images";

export const metadata: Metadata = {
  title: "KCVV Ultras | KCVV Elewijt",
  description:
    "Supportersclub van KCVV Elewijt: De Ultra's! Positief aanmoedigen van onze ploeg.",
  keywords: ["ultras", "supporters", "KCVV Elewijt", "sfeeracties"],
  openGraph: {
    title: "KCVV Ultra's 55 - KCVV Elewijt",
    description: "Supportersclub van KCVV Elewijt: De Ultra's!",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function UltrasPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Ultras", url: `${SITE_CONFIG.siteUrl}/club/ultras` },
        ])}
      />
      <PageHero
        image={ULTRAS_HEADER_HERO}
        imageAlt="KCVV Ultra's sfeeractie"
        label="Supporters"
        headline={
          <>
            KCVV <span className="text-kcvv-green">Ultra&apos;s</span>
          </>
        }
        body="Positief aanmoedigen van onze ploeg — vocaal, met trommels, met sfeermateriaal."
        cta={{
          label: "Word lid via Facebook",
          href: "https://www.facebook.com/KCVV.ULTRAS.55/",
        }}
      />

      <main className="mx-auto max-w-inner-lg px-4 py-8 content">
        {/* Wie zijn we */}
        <section className="mb-8">
          <h2 className="mb-4 border-l-4 border-kcvv-green-bright pl-4 text-xl font-bold">
            Wie zijn we
          </h2>
          <p>
            De naam KCVV Ultras werd enkele jaren geleden op facebook in het
            leven geroepen door een bende supporters die elke week trouw op post
            stonden. Na verloop van tijd werd de pagina echter minder en minder
            actief, en de term &quot;Ultras&quot; verdween langzaamaan.
          </p>
          <p>
            Tot het seizoen 2018 - 2019. In de zoektocht naar de kampioenstitel
            konden de spelers elke vorm van steun gebruiken, en wat is er beter
            dan de KCVV Ultras hiervoor terug nieuw leven in te blazen? Enkele
            nieuwe voortrekkers stonden op en plaatsten hun schouders onder de
            eerste sfeeracties. Bussen werden ingelegd, trommels en spandoeken
            naast het veld geposteerd en we konden knallen!
          </p>

          <div className="my-6">
            <Image
              src={ULTRAS_KAMPIOEN}
              alt="KCVV Ultra's op de kampioenenmatch in 3e provinciale"
              width={1440}
              height={810}
              sizes="(max-width: 768px) 100vw, 800px"
              className="rounded-lg"
            />
          </div>

          <p>
            Het enthousiasme, gekoppeld aan de goede resultaten, werkte
            aanstekelijk en de bende groeide al snel. De sfeeracties volgden in
            de tweede helft van het seizoen elkaar dan ook snel op en kregen
            uitbreiding op verplaatsing: met de bierfiets de ploeg over de
            streep gaan trekken op FC Zemst, met de bus naar Mollem enz...
          </p>
          <p>
            Of het nu aan de steun van de Ultras lag of niet, het seizoen werd
            bezegeld met een prachtige kampioenstitel, en volgend jaar kunnen de
            Ultras hun ding doen in 2e provinciale!
          </p>
        </section>

        {/* Wat doen we */}
        <section className="mb-8">
          <h2 className="mb-4 border-l-4 border-kcvv-green-bright pl-4 text-xl font-bold">
            Wat doen we
          </h2>
          <blockquote>
            Positief aanmoedigen van de eigen ploeg; vocaal, met trommels, met
            sfeermateriaal, met bussen enz...
          </blockquote>
          <p>
            Het doel van de KCVV Ultras is om onze eigen ploeg positief aan te
            moedigen! Agressie of negatief gedrag naar de
            tegenstanders/wedstrijdleiding zal op geen enkel moment getolereerd
            worden!
          </p>
          <p>
            Met sfeermateriaal (bengaals vuur, rookpotten, trommels) en vocale
            steun proberen we zo vaak mogelijk aanwezig te zijn op wedstrijden.
          </p>
          <p>
            Indien de tegenstander zich hiertoe leent, zullen er ook enkele
            bussen of andere vervoersmiddelen ingelegd worden om samen de
            verplaatsing te maken.
          </p>
          <p>
            Op het einde van het seizoen 2018-2019 werd ook voor het eerst een
            volledig eigen evenement georganiseerd: een afterwork party
            gecombineerd met een &quot;Schijt je rijk&quot;, waarbij maar liefst{" "}
            <strong>ALLE 500 lotjes</strong> verkocht werden aan sympathisanten!{" "}
            <strong>
              De winnaar kreeg een cheque uitgereikt van 750 euro!
            </strong>
          </p>

          <div className="my-6">
            <Image
              src={ULTRAS_SJR}
              alt="KCVV Ultra's schijt-je-rijk affiche"
              width={1440}
              height={810}
              sizes="(max-width: 768px) 100vw, 800px"
              className="rounded-lg"
            />
          </div>
        </section>

        {/* Lid worden */}
        <section>
          <h2 className="mb-4 border-l-4 border-kcvv-green-bright pl-4 text-xl font-bold">
            Lid worden
          </h2>
          <p>
            De makkelijkste manier om op de hoogte te blijven van acties,
            busritten, evenementen... is via onze vernieuwde facebookpagina:
          </p>
          <a
            href="https://www.facebook.com/KCVV.ULTRAS.55/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#3b5998] px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            facebook.com/KCVV.ULTRAS.55
          </a>
        </section>
      </main>
    </>
  );
}
