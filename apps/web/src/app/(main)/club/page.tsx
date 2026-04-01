import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";
import { PageHero } from "@/components/design-system/PageHero";
import { ClubEditorialGrid } from "@/components/club/ClubEditorialGrid/ClubEditorialGrid";
import { MissionBanner } from "@/components/club/MissionBanner/MissionBanner";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";

export const metadata: Metadata = {
  title: "Onze club | KCVV Elewijt",
  description:
    "Alles over KCVV Elewijt: geschiedenis, bestuur, organigram en hoe je kan aansluiten.",
};

const heroSection: SectionConfig = {
  bg: "kcvv-black",
  content: (
    <PageHero
      image="/images/hero-club.jpg"
      label="Onze club"
      headline={
        <>
          De plezantste
          <br />
          <span className="text-kcvv-green">compagnie</span>
        </>
      }
      body="Al meer dan 75 jaar de thuishaven voor voetballiefhebbers in Elewijt. Van de allerkleinsten tot het eerste elftal — bij KCVV is iedereen welkom."
    />
  ),
  paddingTop: "pt-0",
  paddingBottom: "pb-0",
  transition: {
    type: "diagonal",
    direction: "right",
    overlap: "full",
  },
  key: "hero",
};

const editorialSection: SectionConfig = {
  bg: "gray-100",
  content: <ClubEditorialGrid />,
  paddingTop: "pt-20",
  paddingBottom: "pb-20",
  transition: {
    type: "diagonal",
    direction: "left",
  },
  key: "editorial",
};

const missionSection: SectionConfig = {
  bg: "kcvv-green-dark",
  content: <MissionBanner />,
  paddingTop: "pt-20",
  paddingBottom: "pb-20",
  transition: {
    type: "diagonal",
    direction: "right",
  },
  key: "mission",
};

const contactSection: SectionConfig = {
  bg: "gray-100",
  content: (
    <SectionCta
      heading="Vragen over de club?"
      body="Neem contact op — we helpen je graag verder."
      buttonLabel="Contacteer ons"
      buttonHref="/club/contact"
    />
  ),
  paddingTop: "pt-16",
  paddingBottom: "pb-16",
  key: "contact",
};

export default function ClubPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
        ])}
      />
      <SectionStack
        sections={[
          heroSection,
          editorialSection,
          missionSection,
          contactSection,
        ]}
      />
    </>
  );
}
