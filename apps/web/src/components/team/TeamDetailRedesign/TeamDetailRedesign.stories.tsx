/**
 * TeamDetail Redesign — Visual Prototype
 *
 * Hero + branded tabs composition for the team detail page. Uses production
 * design-system components composed into a realistic page layout.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { SectionHeader } from "@/components/design-system/SectionHeader/SectionHeader";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";
import type {
  RosterPlayer,
  StaffMember,
} from "@/components/team/TeamRoster/TeamRoster";

/* ---------------------------------------------------------------------------
 * Mock Data
 * --------------------------------------------------------------------------- */

const PLAYER_IMAGES = {
  chiel:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/chiel.png",
  jarne:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/jarne-front.png",
  louie:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/louie-front.png",
  yoran:
    "https://api.kcvvelewijt.be/sites/default/files/player-picture/yoran-front.png",
};

const mockPlayers: RosterPlayer[] = [
  // Keepers (2)
  {
    id: "gk-1",
    firstName: "Kevin",
    lastName: "Van Ransbeeck",
    position: "Keeper",
    number: 1,
    href: "/spelers/kevin-van-ransbeeck",
    imageUrl: PLAYER_IMAGES.louie,
  },
  {
    id: "gk-2",
    firstName: "Jean-Baptiste",
    lastName: "Van Der Meersberghen",
    position: "Keeper",
    number: 16,
    href: "/spelers/jean-baptiste-van-der-meersberghen",
    imageUrl: PLAYER_IMAGES.chiel,
  },
  // Verdedigers (4, 1 captain)
  {
    id: "def-1",
    firstName: "Jan",
    lastName: "Peeters",
    position: "Verdediger",
    number: 2,
    href: "/spelers/jan-peeters",
    imageUrl: PLAYER_IMAGES.chiel,
  },
  {
    id: "def-2",
    firstName: "Pieter",
    lastName: "Janssens",
    position: "Verdediger",
    number: 3,
    href: "/spelers/pieter-janssens",
    imageUrl: PLAYER_IMAGES.yoran,
  },
  {
    id: "def-3",
    firstName: "Thomas",
    lastName: "Maes",
    position: "Verdediger",
    number: 4,
    href: "/spelers/thomas-maes",
    isCaptain: true,
    imageUrl: PLAYER_IMAGES.jarne,
  },
  {
    id: "def-4",
    firstName: "Jef",
    lastName: "De Smedt",
    position: "Verdediger",
    number: 5,
    href: "/spelers/jef-de-smedt",
    imageUrl: PLAYER_IMAGES.louie,
  },
  // Middenvelders (4)
  {
    id: "mid-1",
    firstName: "Wouter",
    lastName: "Vermeersch",
    position: "Middenvelder",
    number: 6,
    href: "/spelers/wouter-vermeersch",
    imageUrl: PLAYER_IMAGES.yoran,
  },
  {
    id: "mid-2",
    firstName: "Stijn",
    lastName: "Claes",
    position: "Middenvelder",
    number: 8,
    href: "/spelers/stijn-claes",
    imageUrl: PLAYER_IMAGES.jarne,
  },
  {
    id: "mid-3",
    firstName: "Raf",
    lastName: "Wouters",
    position: "Middenvelder",
    number: 10,
    href: "/spelers/raf-wouters",
    imageUrl: PLAYER_IMAGES.louie,
  },
  {
    id: "mid-4",
    firstName: "Koen",
    lastName: "Van Damme",
    position: "Middenvelder",
    number: 14,
    href: "/spelers/koen-van-damme",
    imageUrl: PLAYER_IMAGES.chiel,
  },
  // Aanvallers (3)
  {
    id: "fwd-1",
    firstName: "Michiel",
    lastName: "Hendrickx",
    position: "Aanvaller",
    number: 7,
    href: "/spelers/michiel-hendrickx",
    imageUrl: PLAYER_IMAGES.chiel,
  },
  {
    id: "fwd-2",
    firstName: "Bert",
    lastName: "Goossens",
    position: "Aanvaller",
    number: 9,
    href: "/spelers/bert-goossens",
    imageUrl: PLAYER_IMAGES.jarne,
  },
  {
    id: "fwd-3",
    firstName: "Lars",
    lastName: "Mertens",
    position: "Aanvaller",
    number: 11,
    href: "/spelers/lars-mertens",
    imageUrl: PLAYER_IMAGES.yoran,
  },
];

const mockStaff: StaffMember[] = [
  {
    id: "staff-1",
    firstName: "Marc",
    lastName: "Van den Berg",
    role: "Hoofdtrainer",
    functionTitle: "T1",
    imageUrl: PLAYER_IMAGES.chiel,
  },
  {
    id: "staff-2",
    firstName: "Dirk",
    lastName: "Hermans",
    role: "Assistent-trainer",
    functionTitle: "T2",
    imageUrl: PLAYER_IMAGES.jarne,
  },
  {
    id: "staff-3",
    firstName: "Peter",
    lastName: "Jacobs",
    role: "Keeperstrainer",
    functionTitle: "TK",
  },
  {
    id: "staff-4",
    firstName: "Johan",
    lastName: "De Vries",
    role: "TV Jeugdopleiding",
    functionTitle: "TVJO",
  },
];

/* ---------------------------------------------------------------------------
 * Diagonal player/staff cards (chosen design — Approach B from PlayerCard
 * Redesign). Inlined here so the team detail story can render the new
 * cards in context without cross-story imports.
 * --------------------------------------------------------------------------- */

/** Diagonal player card with clip-path photo and stencil number on seam */
function DiagonalPlayerCard({ player }: { player: RosterPlayer }) {
  const fullName = `${player.firstName} ${player.lastName}`;
  return (
    <a
      href={player.href}
      className="group relative flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-hover"
      title={fullName}
    >
      {/* Hover top accent bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] origin-center scale-x-0 bg-kcvv-green-bright transition-transform duration-300 ease-out group-hover:scale-x-100" />

      {/* Photo with clip-path diagonal cut */}
      <div className="relative shrink-0" style={{ aspectRatio: "4 / 5" }}>
        <div
          className="absolute inset-0"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 86%, 0 100%)" }}
        >
          {player.imageUrl ? (
            <Image
              src={player.imageUrl}
              alt={fullName}
              fill
              className="object-cover object-top"
              sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div className="h-full w-full bg-foundation-gray-light" />
          )}
        </div>

        {/* Stencil number on seam */}
        {player.number !== undefined && (
          <div
            className="pointer-events-none absolute right-3 z-10 select-none font-black leading-none text-kcvv-green-bright"
            style={{
              bottom: "-1rem",
              fontFamily: "stenciletta, sans-serif",
              fontSize: "5.5rem",
              WebkitTextStroke: "2px white",
            }}
            aria-hidden="true"
          >
            {player.number}
          </div>
        )}
      </div>

      {/* Name section */}
      <div className="flex-1 px-4 pb-5 pt-3">
        <div className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-kcvv-green-dark">
          {player.position}
        </div>
        <h3 className="mt-1 font-title text-lg uppercase leading-tight text-kcvv-black">
          <span className="font-semibold">{player.firstName}</span>
          <br />
          <span className="font-thin">{player.lastName}</span>
        </h3>
      </div>
    </a>
  );
}

/** Diagonal staff card — same shape, navy seam, function title as badge */
function DiagonalStaffCard({ member }: { member: StaffMember }) {
  const fullName = `${member.firstName} ${member.lastName}`;
  const badge = member.functionTitle ?? "";
  return (
    <a
      href="#"
      className="group relative flex h-full flex-col overflow-hidden rounded-sm bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-hover"
      title={fullName}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] origin-center scale-x-0 bg-kcvv-green-bright transition-transform duration-300 ease-out group-hover:scale-x-100" />

      <div className="relative shrink-0" style={{ aspectRatio: "4 / 5" }}>
        <div
          className="absolute inset-0"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 86%, 0 100%)" }}
        >
          {member.imageUrl ? (
            <Image
              src={member.imageUrl}
              alt={fullName}
              fill
              className="object-cover object-top"
              sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div className="h-full w-full bg-foundation-gray-light" />
          )}
        </div>

        {badge && (
          <div
            className="pointer-events-none absolute right-3 z-10 select-none font-black leading-none text-kcvv-gray-blue"
            style={{
              bottom: "-1rem",
              fontFamily: "stenciletta, sans-serif",
              fontSize: badge.length > 2 ? "3rem" : "5.5rem",
              WebkitTextStroke: "2px white",
            }}
            aria-hidden="true"
          >
            {badge}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 pb-5 pt-3">
        <div className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-kcvv-gray-blue">
          {member.role}
        </div>
        <h3 className="mt-1 font-title text-lg uppercase leading-tight text-kcvv-black">
          <span className="font-semibold">{member.firstName}</span>
          <br />
          <span className="font-thin">{member.lastName}</span>
        </h3>
      </div>
    </a>
  );
}

/** Roster grouped by position using the new diagonal cards */
function DiagonalRoster() {
  const positionOrder = [
    "Keeper",
    "Verdediger",
    "Middenvelder",
    "Aanvaller",
  ] as const;

  return (
    <div className="space-y-12">
      {positionOrder.map((pos) => {
        const players = mockPlayers.filter((p) => p.position === pos);
        if (players.length === 0) return null;
        return (
          <div key={pos}>
            <h3 className="mb-6 font-title text-xl font-bold uppercase tracking-tight text-kcvv-black">
              {pos === "Keeper" ? "Keepers" : `${pos}s`}{" "}
              <span className="text-sm font-normal text-kcvv-gray">
                ({players.length})
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {players.map((p) => (
                <DiagonalPlayerCard key={p.id} player={p} />
              ))}
            </div>
          </div>
        );
      })}

      {mockStaff.length > 0 && (
        <div>
          <h3 className="mb-6 font-title text-xl font-bold uppercase tracking-tight text-kcvv-black">
            Technische Staf{" "}
            <span className="text-sm font-normal text-kcvv-gray">
              ({mockStaff.length})
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {mockStaff.map((s) => (
              <DiagonalStaffCard key={s.id} member={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Meta
 * --------------------------------------------------------------------------- */

const meta = {
  title: "Pages/TeamDetail Redesign",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------------------
 * Hero + Branded Tabs
 * --------------------------------------------------------------------------- */

const TAB_ITEMS = [
  { label: "Spelers", active: true },
  { label: "Wedstrijden", active: false },
  { label: "Klassement", active: false },
  { label: "Info", active: false },
] as const;

/**
 * PageHero with inline coach pill, branded tab bar, related content placeholder,
 * and CTA. The tab bar renders a static "Spelers" panel (tabs cannot switch in
 * a static Storybook story).
 */
export const Approach3_HeroTabs: Story = {
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
            image="/images/history/history-24-25.jpg"
            imageAlt="KCVV Elewijt A"
            label="Eerste ploeg"
            headline="KCVV Elewijt A"
            body="3de Provinciale A"
          />
        ),
        transition: { type: "diagonal", direction: "left" },
      },
      {
        key: "tabs",
        bg: "gray-100",
        content: (
          <div className="mx-auto max-w-inner-lg px-4 md:px-10">
            {/* Tab bar */}
            <div className="mb-8 flex gap-8 border-b border-gray-200">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  className={
                    tab.active
                      ? "border-b-4 border-kcvv-green-bright px-1 py-4 text-sm font-bold uppercase tracking-[0.05em] text-kcvv-green-dark"
                      : "border-b-4 border-transparent px-1 py-4 text-sm font-bold uppercase tracking-[0.05em] text-kcvv-gray hover:text-kcvv-black"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active tab content: Spelers (with new diagonal cards) */}
            <DiagonalRoster />
          </div>
        ),
        transition: { type: "diagonal", direction: "right" },
      },
      {
        key: "related",
        bg: "kcvv-black",
        content: (
          <div className="mx-auto max-w-inner-lg px-4 md:px-10">
            <SectionHeader title="Nieuws" variant="dark" />
            <div className="rounded-sm border border-dashed border-white/10 py-12 text-center text-sm text-white/40">
              Related articles slider here
            </div>
          </div>
        ),
        transition: { type: "diagonal", direction: "left" },
      },
      {
        key: "cta",
        bg: "kcvv-green-dark",
        content: (
          <SectionCta
            heading="Word lid van KCVV Elewijt"
            body="Sluit je aan bij onze club en word deel van de KCVV-familie. Spelers, vrijwilligers en supporters welkom!"
            buttonLabel="Meer info"
            buttonHref="/club/aansluiten"
            variant="dark"
          />
        ),
      },
    ];

    return <SectionStack sections={sections} />;
  },
};
