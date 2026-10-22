import { SanityImage } from "@/lib/image/sanity-image";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getButtonClasses } from "@/components/design-system/Button/button-styles";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import { PullQuote } from "@/components/design-system/PullQuote";
import { PageContainer } from "@/components/design-system/PageContainer";
import { ULTRAS_KAMPIOEN, ULTRAS_SJR } from "@/lib/sanity/images";
import { UltrasAnalytics } from "./UltrasAnalytics";
import { UltrasSection } from "./UltrasSection";
import { RaffleCallout } from "./RaffleCallout";
import { FACEBOOK_URL } from "./copy";
import { UltrasHero } from "./UltrasHero";

const PHOTO_SIZES = "(min-width: 768px) 640px, 100vw";

export const metadata = buildPageMetadata({
  title: "KCVV Ultras",
  description:
    "Ultra's 55, de sfeergroep van KCVV Elewijt. Thuis langs de lijn, naar elke uitmatch met de bus.",
  path: "/club/ultras",
  ogTitle: "KCVV Ultra's 55 - KCVV Elewijt",
  ogDescription: "De sfeergroep van KCVV Elewijt, thuis en op verplaatsing.",
  keywords: ["ultras", "supporters", "KCVV Elewijt", "sfeeracties"],
});

export default function UltrasPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "De club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Ultras", url: `${SITE_CONFIG.siteUrl}/club/ultras` },
        ])}
      />

      <UltrasAnalytics>
        <UltrasHero upLink={{ href: "/club", label: "De club" }} />

        <PageContainer as="article" className="py-12 sm:py-16">
          <UltrasSection kicker="Ons verhaal" heading="Wie zijn we" accent=".">
            <p>
              De naam KCVV Ultras werd al enkele jaren vóór 2018 op facebook in
              het leven geroepen door een bende supporters die elke week trouw
              op post stonden. Na verloop van tijd werd de pagina echter minder
              en minder actief, en de term &quot;Ultras&quot; verdween
              langzaamaan.
            </p>
            <p>
              Tot het seizoen 2018 - 2019. In de zoektocht naar de
              kampioenstitel konden de spelers elke vorm van steun gebruiken, en
              wat is er beter dan de KCVV Ultras hiervoor terug nieuw leven in
              te blazen? Enkele nieuwe voortrekkers stonden op en plaatsten hun
              schouders onder de eerste sfeeracties. Bussen werden ingelegd,
              trommels en spandoeken naast het veld geposteerd en we konden
              knallen!
            </p>

            <TapedFigure
              aspect="landscape-16-9"
              bg="cream"
              tint="newsprint"
              rotation="a"
              tape={{
                color: "warm",
                length: "sm",
                position: "left",
                rotation: "c",
              }}
            >
              <SanityImage
                src={ULTRAS_KAMPIOEN}
                alt="KCVV Ultra's op de kampioenenmatch in 3e provinciale"
                fill
                sizes={PHOTO_SIZES}
                className="object-cover"
              />
            </TapedFigure>

            <p>
              Het enthousiasme, gekoppeld aan de goede resultaten, werkte
              aanstekelijk en de bende groeide al snel. De sfeeracties volgden
              in de tweede helft van het seizoen elkaar dan ook snel op en
              kregen uitbreiding op verplaatsing: met de bierfiets de ploeg over
              de streep gaan trekken op FC Zemst, met de bus naar Mollem.
            </p>
            <p>
              Of het nu aan de steun van de Ultras lag of niet, het seizoen werd
              bezegeld met een prachtige kampioenstitel, en in 2019-2020 deden
              de Ultras hun ding in 2e provinciale! Vandaag speelt de ploeg in
              3e Nationale, en de Ultras staan er nog altijd.
            </p>
          </UltrasSection>

          <UltrasSection kicker="Onze missie" heading="Wat doen we" accent=".">
            <PullQuote attribution={{ name: "KCVV Ultra's 55" }}>
              Negentig minuten zingen. En op de bus naar huis nog wat langer.
            </PullQuote>
            <p>
              De Ultra&apos;s zijn een sfeergroep. We staan er om onze eigen
              ploeg te steunen, met trommels, vlaggen, spandoeken en vooral veel
              stem. Respect voor de tegenstander, hun supporters en de
              scheidsrechter spreekt voor ons vanzelf. Agressie hoort er bij ons
              niet bij.
            </p>
            <p>
              We proberen naar elke uitwedstrijd een bus in te leggen, hoe klein
              de groep ook is. Met vijftig of met vijftien: als de ploeg op
              verplaatsing speelt, willen wij erbij zijn.
            </p>
            <p>
              Ook naast het veld steken we de handen uit de mouwen. Op het
              jeugdtornooi en op andere clubevenementen staan we achter de
              bakplaat en de friteuse. Hamburgers, frietjes en alles wat er
              verder moet gebeuren: als de club volk nodig heeft, zijn we er.
            </p>
            <p>
              Op het einde van het seizoen 2018-2019 organiseerden we ons eerste
              eigen evenement: een afterwork party met een &quot;Schijt je
              rijk&quot;. Alle 500 lotjes gingen de deur uit, en de winnaar ging
              naar huis met een cheque van 750 euro.
            </p>

            {/* Pull-stat highlight of the two figures above (the legacy inline
                <strong> emphasis moves into this callout, per the 7u1 spine). */}
            <RaffleCallout />

            <TapedFigure
              aspect="landscape-16-9"
              bg="cream"
              tint="newsprint"
              rotation="b"
              tape={{
                color: "warm",
                length: "lg",
                position: "right",
                rotation: "c",
              }}
            >
              <SanityImage
                src={ULTRAS_SJR}
                alt="KCVV Ultra's schijt-je-rijk affiche"
                fill
                sizes={PHOTO_SIZES}
                className="object-cover"
              />
            </TapedFigure>
          </UltrasSection>

          <UltrasSection kicker="Doe mee" heading="Lid worden" accent=".">
            <p>
              Een keer mee met de bus, of gewoon weten wanneer we waar staan?
              Busritten, acties en evenementen kondigen we aan op onze
              Facebookpagina:
            </p>
            <div>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-ultras-join
                className={getButtonClasses({ variant: "primary", size: "md" })}
              >
                facebook.com/KCVV.ULTRAS.55
              </a>
            </div>
          </UltrasSection>
        </PageContainer>
      </UltrasAnalytics>
    </>
  );
}
