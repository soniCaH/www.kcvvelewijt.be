import Image from "next/image";
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
import { UltrasHero } from "./UltrasHero";
import { UltrasSection } from "./UltrasSection";
import { RaffleCallout } from "./RaffleCallout";

const FACEBOOK_URL = "https://www.facebook.com/KCVV.ULTRAS.55/";
const PHOTO_SIZES = "(min-width: 768px) 640px, 100vw";

export const metadata = buildPageMetadata({
  title: "KCVV Ultras",
  description:
    "Supportersclub van KCVV Elewijt: De Ultra's! Positief aanmoedigen van onze ploeg.",
  path: "/club/ultras",
  ogTitle: "KCVV Ultra's 55 - KCVV Elewijt",
  ogDescription: "Supportersclub van KCVV Elewijt: De Ultra's!",
  keywords: ["ultras", "supporters", "KCVV Elewijt", "sfeeracties"],
});

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

      <UltrasAnalytics>
        <UltrasHero joinHref={FACEBOOK_URL} />

        <PageContainer as="article" className="py-12 sm:py-16">
          <UltrasSection kicker="Ons verhaal" heading="Wie zijn we" accent=".">
            <p>
              De naam KCVV Ultras werd enkele jaren geleden op facebook in het
              leven geroepen door een bende supporters die elke week trouw op
              post stonden. Na verloop van tijd werd de pagina echter minder en
              minder actief, en de term &quot;Ultras&quot; verdween langzaamaan.
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
                rotation: "a",
              }}
            >
              <Image
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
              de streep gaan trekken op FC Zemst, met de bus naar Mollem enz...
            </p>
            <p>
              Of het nu aan de steun van de Ultras lag of niet, het seizoen werd
              bezegeld met een prachtige kampioenstitel, en volgend jaar kunnen
              de Ultras hun ding doen in 2e provinciale!
            </p>
          </UltrasSection>

          <UltrasSection kicker="Onze missie" heading="Wat doen we" accent=".">
            <PullQuote attribution={{ name: "KCVV Ultra's 55" }}>
              Positief aanmoedigen van de eigen ploeg; vocaal, met trommels, met
              sfeermateriaal, met bussen enz...
            </PullQuote>
            <p>
              Het doel van de KCVV Ultras is om onze eigen ploeg positief aan te
              moedigen! Agressie of negatief gedrag naar de
              tegenstanders/wedstrijdleiding zal op geen enkel moment
              getolereerd worden!
            </p>
            <p>
              Met sfeermateriaal (bengaals vuur, rookpotten, trommels) en vocale
              steun proberen we zo vaak mogelijk aanwezig te zijn op
              wedstrijden.
            </p>
            <p>
              Indien de tegenstander zich hiertoe leent, zullen er ook enkele
              bussen of andere vervoersmiddelen ingelegd worden om samen de
              verplaatsing te maken.
            </p>
            <p>
              Op het einde van het seizoen 2018-2019 werd ook voor het eerst een
              volledig eigen evenement georganiseerd: een afterwork party
              gecombineerd met een &quot;Schijt je rijk&quot;, waarbij maar
              liefst ALLE 500 lotjes verkocht werden aan sympathisanten! De
              winnaar kreeg een cheque uitgereikt van 750 euro!
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
                length: "sm",
                position: "right",
                rotation: "b",
              }}
            >
              <Image
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
              De makkelijkste manier om op de hoogte te blijven van acties,
              busritten, evenementen... is via onze vernieuwde facebookpagina:
            </p>
            <div>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-ultras-join
                className={getButtonClasses({ variant: "primary", size: "md" })}
              >
                facebook.com/KCVV.ULTRAS.55 ↗
              </a>
            </div>
          </UltrasSection>
        </PageContainer>
      </UltrasAnalytics>
    </>
  );
}
