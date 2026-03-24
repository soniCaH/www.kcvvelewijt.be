import type { Metadata } from "next";
import Link from "next/link";
import { SectionStack } from "@/components/design-system/SectionStack/SectionStack";
import type { SectionConfig } from "@/components/design-system/SectionStack/SectionStack";
import { ClubHero } from "@/components/club/ClubHero/ClubHero";

export const metadata: Metadata = {
  title: "Onze club | KCVV Elewijt",
  description:
    "Alles over KCVV Elewijt: geschiedenis, bestuur, organigram en hoe je kan aansluiten.",
};

function EditorialCard({
  href,
  tag,
  title,
  description,
  arrowText,
}: {
  href: string;
  tag: string;
  title: string;
  description?: string;
  arrowText: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-sm flex flex-col justify-end transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)] min-h-[280px] bg-kcvv-black"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(30,32,36,0.95) 0%, rgba(30,32,36,0.5) 40%, rgba(30,32,36,0.1) 100%)",
        }}
      />
      <div className="relative z-10 p-6">
        <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-kcvv-green mb-2 block">
          {tag}
        </span>
        <span className="font-title font-extrabold text-white uppercase leading-[1.1] mb-2 block text-xl">
          {title}
        </span>
        {description && (
          <span className="text-[0.8125rem] text-white/70 leading-normal block mb-2">
            {description}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-kcvv-green mt-3 transition-[gap] duration-200 group-hover:gap-2.5">
          <span>{arrowText}</span>
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

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
