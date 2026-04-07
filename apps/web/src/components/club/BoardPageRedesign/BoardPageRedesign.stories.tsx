/**
 * Board Page Redesign — Visual Prototype
 *
 * Dark Roster Spotlight composition for the board pages
 * (/club/bestuur, /club/jeugdbestuur, /club/angels). Uses production
 * design-system components composed into a realistic page layout.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { SectionHeader } from "@/components/design-system/SectionHeader/SectionHeader";
import { TeamRoster } from "@/components/team/TeamRoster/TeamRoster";
import type { StaffMember } from "@/components/team/TeamRoster/TeamRoster";
import { LinkButton } from "@/components/design-system/LinkButton";

/* ---------------------------------------------------------------------------
 * Mock Data — 10 board members with Belgian names
 * --------------------------------------------------------------------------- */

const STAFF_IMAGES = {
  louie:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/louie.png",
  chiel:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
  jarne:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/jarne-front.png",
};

const allStaff: StaffMember[] = [
  {
    id: "board-1",
    firstName: "Jan",
    lastName: "Willems",
    role: "Voorzitter",
    functionTitle: "VZ",
    imageUrl: STAFF_IMAGES.louie,
  },
  {
    id: "board-2",
    firstName: "Els",
    lastName: "Martens",
    role: "Secretaris",
    functionTitle: "SE",
    imageUrl: STAFF_IMAGES.chiel,
  },
  {
    id: "board-3",
    firstName: "Tom",
    lastName: "Claes",
    role: "Penningmeester",
    functionTitle: "PM",
    imageUrl: STAFF_IMAGES.jarne,
  },
  {
    id: "board-4",
    firstName: "Marie",
    lastName: "Janssen",
    role: "Communicatie",
    functionTitle: "COM",
  },
  {
    id: "board-5",
    firstName: "Bart",
    lastName: "De Smedt",
    role: "Infrastructuur",
    functionTitle: "INFRA",
  },
  {
    id: "board-6",
    firstName: "Lien",
    lastName: "Wouters",
    role: "Jeugdwerking",
    functionTitle: "JW",
    imageUrl: STAFF_IMAGES.louie,
  },
  {
    id: "board-7",
    firstName: "Koen",
    lastName: "Peeters",
    role: "Sponsoring",
    functionTitle: "SP",
  },
  {
    id: "board-8",
    firstName: "Sarah",
    lastName: "Mertens",
    role: "Evenementen",
    functionTitle: "EV",
    imageUrl: STAFF_IMAGES.chiel,
  },
  {
    id: "board-9",
    firstName: "Wim",
    lastName: "Goossens",
    role: "Materiaal",
    functionTitle: "MAT",
  },
  {
    id: "board-10",
    firstName: "An",
    lastName: "Hermans",
    role: "Bestuurslid",
    functionTitle: "LID",
    imageUrl: STAFF_IMAGES.jarne,
  },
];

const BOARD_DESCRIPTION =
  "Het bestuur van KCVV Elewijt staat in voor het dagelijks beheer van de club. Van financiën tot infrastructuur, van communicatie tot jeugdwerking — onze bestuursleden zetten zich elke dag in voor de plezantste compagnie van Elewijt.";

/* ---------------------------------------------------------------------------
 * Shared content blocks
 * --------------------------------------------------------------------------- */

/** Description block with green left-border accent */
function DescriptionBlock({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`max-w-3xl border-l-4 border-kcvv-green-bright pl-6 ${className ?? ""}`}
    >
      <p className="text-base leading-relaxed text-gray-600">{text}</p>
    </div>
  );
}

/** Organigram CTA section — white text on green background */
function OrganigramCta() {
  return (
    <div className="mx-auto max-w-[40rem] px-4 text-center md:px-10">
      <h2
        className="mb-3 font-title font-extrabold text-white"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
      >
        Wie doet wat?
      </h2>
      <p className="mb-8 text-sm leading-relaxed text-white/70">
        Bekijk het volledige organigram van KCVV Elewijt en vind snel de juiste
        persoon voor jouw vraag.
      </p>
      <LinkButton href="/club/organigram" variant="secondary" withArrow>
        Organigram bekijken
      </LinkButton>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Meta
 * --------------------------------------------------------------------------- */

const meta = {
  title: "Pages/Board Page Redesign",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------------------
 * Dark Roster Spotlight
 * Hero + Description on gray + Members on dark + CTA on green
 * --------------------------------------------------------------------------- */

/**
 * 4-section layout: PageHero, description block on gray-100,
 * members grid on kcvv-black (white cards pop against dark),
 * and organigram CTA on kcvv-green-dark.
 */
export const ApproachB_DarkRosterSpotlight: Story = {
  render: () => {
    const sections: SectionConfig[] = [
      {
        key: "hero",
        bg: "kcvv-black",
        paddingTop: "pt-0",
        paddingBottom: "pb-0",
        content: (
          <PageHero
            size="compact"
            gradient="dark"
            label="De club"
            headline="Bestuur"
            body="De mensen achter KCVV Elewijt"
          />
        ),
        transition: { type: "diagonal", direction: "right", overlap: "full" },
      },
      {
        key: "about",
        bg: "gray-100",
        content: (
          <div className="mx-auto max-w-inner-lg px-4 md:px-10">
            <DescriptionBlock text={BOARD_DESCRIPTION} />
          </div>
        ),
        transition: { type: "diagonal", direction: "left" },
      },
      {
        key: "members",
        bg: "kcvv-black",
        content: (
          <div className="mx-auto max-w-inner-lg px-4 md:px-10">
            <SectionHeader title="Ons bestuur" variant="dark" />
            <TeamRoster
              players={[]}
              staff={allStaff}
              teamName="Bestuur KCVV Elewijt"
              groupByPosition={false}
              showStaff
              staffSectionLabel={null}
            />
            <p className="mt-8 text-center text-sm text-white/40">
              Meer info?{" "}
              <a
                href="/hulp"
                className="text-white/60 underline transition-colors hover:text-white"
              >
                Neem contact op →
              </a>
            </p>
          </div>
        ),
        transition: { type: "diagonal", direction: "right" },
      },
      {
        key: "cta",
        bg: "kcvv-green-dark",
        content: <OrganigramCta />,
        paddingTop: "pt-16",
        paddingBottom: "pb-16",
      },
    ];

    return <SectionStack sections={sections} />;
  },
};
