import type { Metadata } from "next";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";
import { ClubHero } from "@/components/club/ClubHero/ClubHero";
import { ClubEditorialGrid } from "@/components/club/ClubEditorialGrid/ClubEditorialGrid";
import { MissionBanner } from "@/components/club/MissionBanner/MissionBanner";
import { ClubContactCta } from "@/components/club/ClubContactCta/ClubContactCta";

export const metadata: Metadata = {
  title: "Onze club | KCVV Elewijt",
  description:
    "Alles over KCVV Elewijt: geschiedenis, bestuur, organigram en hoe je kan aansluiten.",
};

const heroSection: SectionConfig = {
  bg: "kcvv-black",
  content: <ClubHero />,
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
  bg: "kcvv-black",
  content: <ClubContactCta />,
  paddingTop: "pt-16",
  paddingBottom: "pb-16",
  key: "contact",
};

export default function ClubPage() {
  return (
    <SectionStack
      sections={[heroSection, editorialSection, missionSection, contactSection]}
    />
  );
}
