import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import { ClubEditorialGrid } from "@/components/club/ClubEditorialGrid/ClubEditorialGrid";
import { MissionBanner } from "@/components/club/MissionBanner/MissionBanner";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";
import { getClubSections } from "./getClubSections";

export const metadata: Metadata = {
  title: "Onze club | KCVV Elewijt",
  description:
    "Alles over KCVV Elewijt: geschiedenis, bestuur, organigram en hoe je kan aansluiten.",
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
        sections={getClubSections({
          editorial: <ClubEditorialGrid />,
          mission: <MissionBanner />,
          contact: (
            <SectionCta
              heading="Vragen over de club?"
              body="Neem contact op — we helpen je graag verder."
              buttonLabel="Contacteer ons"
              buttonHref="/club/contact"
            />
          ),
        })}
      />
    </>
  );
}
