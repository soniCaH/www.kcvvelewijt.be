import type { Metadata } from "next";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";
import { ClubHero } from "@/components/club/ClubHero/ClubHero";
import { EditorialCard } from "@/components/club/EditorialCard/EditorialCard";

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
  content: (
    <div className="max-w-[70rem] mx-auto px-4 md:px-10">
      <div className="mb-12">
        <div className="flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-kcvv-gray mb-3">
          <span className="block w-5 h-0.5 bg-kcvv-green" />
          Ontdek onze club
        </div>
        <h2
          className="font-title font-extrabold text-kcvv-gray-blue"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
        >
          Meer dan een voetbalclub
        </h2>
      </div>
      <EditorialCard
        href="/club/bestuur"
        tag="Bestuur"
        title="Het team achter het team"
        description="Maak kennis met het bestuur dat de club draaiende houdt."
        arrowText="Ontdek"
      />
    </div>
  ),
  paddingTop: "pt-20",
  paddingBottom: "pb-20",
  key: "editorial",
};

export default function ClubPage() {
  return <SectionStack sections={[heroSection, editorialSection]} />;
}
