/**
 * TeamDetail Component
 *
 * Page-level layout for team detail pages, composed as a `SectionStack`:
 *
 *   1. Compact `PageHero` with the team image as background
 *   2. Gray `BrandedTabs` content section showing the active panel
 *      (Info / Spelers / Wedstrijden / Klassement) — only tabs with
 *      data are exposed
 *   3. Closing `SectionCta` on dark green pointing at the help page
 *
 * The tab interactivity lives in `TeamDetailTabs` (a small client island)
 * so the panel content can still be rendered server-side.
 */

import { Suspense } from "react";
import sanitizeHtml from "sanitize-html";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";
import { Spinner } from "@/components/design-system/Spinner";
import { TeamRoster, type RosterPlayer, type StaffMember } from "../TeamRoster";
import { TeamSchedule, type ScheduleMatch } from "../TeamSchedule";
import { TeamStandings, type StandingsEntry } from "../TeamStandings";
import { TeamDetailTabs, type TeamDetailTabPanel } from "./TeamDetailTabs";

const PROSE_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: [...(sanitizeHtml.defaults.allowedAttributes?.["a"] ?? []), "class"],
    img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, class: "content-link" },
    }),
  },
};

export interface TeamDetailHeader {
  /** Team name (rendered as the hero headline) */
  name: string;
  /** Team tagline / division (rendered as hero body) */
  tagline?: string;
  /** Team / group photo URL — used as the hero background */
  imageUrl?: string;
  /** Age group for youth teams (e.g., U15) */
  ageGroup?: string;
  /** Type of team for the hero label */
  teamType?: "senior" | "youth" | "club";
}

export interface TeamDetailProps {
  /** Team header data */
  header: TeamDetailHeader;
  /** Contact info HTML content */
  contactInfo?: string;
  /** Body content HTML */
  bodyContent?: string;
  /** Staff members */
  staff?: StaffMember[];
  /** Player roster */
  players?: RosterPlayer[];
  /** Matches for the schedule tab */
  matches?: ScheduleMatch[];
  /** Standings entries for the league table tab */
  standings?: StandingsEntry[];
  /** Team ID used to highlight the team row in standings and home/away in schedule */
  highlightTeamId?: number;
  /** Team slug for back-navigation context on match detail page */
  teamSlug?: string;
  /** URL to the iCal feed for this team */
  calendarUrl?: string;
}

const HERO_LABELS: Record<NonNullable<TeamDetailHeader["teamType"]>, string> = {
  senior: "Eerste ploeg",
  youth: "Jeugd",
  club: "De club",
};

/**
 * Slugify a team name for use in a download filename. Lowercases, strips
 * accents, replaces any non-alphanumeric run with a single dash, trims
 * leading/trailing dashes, and caps the length so the resulting filename
 * stays well within filesystem limits. Falls back to "kcvv" when the input
 * contains no usable characters.
 */
function slugifyTeamName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "kcvv";
}

function InfoPanel({
  contactInfo,
  bodyContent,
  staff,
  hasPlayers,
  teamName,
}: {
  contactInfo?: string;
  bodyContent?: string;
  staff: StaffMember[];
  hasPlayers: boolean;
  teamName: string;
}) {
  const hasContactInfo = !!contactInfo?.trim();
  const hasBodyContent = !!bodyContent?.trim();
  const hasStaff = staff.length > 0;
  const showStaffInInfo = !hasPlayers && hasStaff;

  if (!hasContactInfo && !hasBodyContent && !showStaffInInfo) {
    return (
      <p className="py-8 text-center text-gray-500">
        Geen extra informatie beschikbaar voor dit team.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {hasContactInfo && (
        <section className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-bold mb-4">Contactinformatie</h2>
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(contactInfo!, PROSE_SANITIZE_OPTIONS),
            }}
          />
        </section>
      )}

      {showStaffInInfo && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Technische Staf</h2>
          <TeamRoster
            players={[]}
            staff={staff}
            teamName={teamName}
            groupByPosition={false}
            showStaff
          />
        </section>
      )}

      {hasBodyContent && (
        <section className="prose prose-gray max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(bodyContent!, PROSE_SANITIZE_OPTIONS),
            }}
          />
        </section>
      )}
    </div>
  );
}

export function TeamDetail({
  header,
  contactInfo,
  bodyContent,
  staff = [],
  players = [],
  matches = [],
  standings = [],
  highlightTeamId,
  teamSlug,
  calendarUrl,
}: TeamDetailProps) {
  const hasPlayers = players.length > 0;
  const hasStaff = staff.length > 0;
  const hasMatches = matches.length > 0;
  const hasStandings = standings.length > 0;

  const heroLabel = HERO_LABELS[header.teamType ?? "senior"];

  const panels: TeamDetailTabPanel[] = [
    {
      id: "info",
      label: "Info",
      content: (
        <InfoPanel
          contactInfo={contactInfo}
          bodyContent={bodyContent}
          staff={staff}
          hasPlayers={hasPlayers}
          teamName={header.name}
        />
      ),
    },
  ];

  // The Spelers tab is only added when there are actual players to show.
  // Staff-only teams (hasPlayers=false, hasStaff=true) surface their staff
  // through `InfoPanel`'s `showStaffInInfo` branch instead — adding a
  // separate Spelers tab in that case would duplicate the same staff
  // content across two tabs and pick a meaningless default.
  if (hasPlayers) {
    panels.push({
      id: "spelers",
      label: "Spelers",
      content: (
        <TeamRoster
          players={players}
          staff={staff}
          teamName={header.name}
          groupByPosition
          showStaff={hasStaff}
        />
      ),
    });
  }

  if (hasMatches) {
    const calendarFilename = `${slugifyTeamName(header.name)}-wedstrijden.ics`;
    panels.push({
      id: "wedstrijden",
      label: "Wedstrijden",
      content: (
        <>
          {calendarUrl && (
            <div className="mb-4 flex justify-end">
              <a
                href={calendarUrl}
                download={calendarFilename}
                aria-label={`Download kalender (.ics) voor ${header.name}`}
                rel="noopener"
                className="inline-flex items-center gap-1.5 text-sm text-kcvv-green-bright hover:underline"
              >
                Voeg toe aan kalender
              </a>
            </div>
          )}
          <TeamSchedule
            matches={matches}
            teamId={highlightTeamId}
            teamSlug={teamSlug}
            showPast
            highlightNext
          />
        </>
      ),
    });
  }

  if (hasStandings) {
    panels.push({
      id: "klassement",
      label: "Klassement",
      content: (
        <TeamStandings
          standings={standings}
          highlightTeamId={highlightTeamId}
        />
      ),
    });
  }

  // Default tab: prefer Spelers when there are actual players (the only
  // case where the Spelers tab is added — see above). Staff-only and
  // empty teams default to Info, which is where their staff / fallback
  // copy lives.
  const defaultTabId = hasPlayers ? "spelers" : "info";

  const sections: SectionConfig[] = [
    {
      key: "hero",
      bg: "kcvv-black",
      paddingTop: "pt-0",
      paddingBottom: "pb-0",
      content: (
        <PageHero
          size="compact"
          image={header.imageUrl}
          imageAlt={`${header.name} teamfoto`}
          label={header.ageGroup ?? heroLabel}
          headline={header.name}
          body={header.tagline ?? ""}
        />
      ),
      transition: { type: "diagonal", direction: "right", overlap: "full" },
    },
    {
      key: "tabs",
      bg: "gray-100",
      content: (
        <div className="mx-auto max-w-inner-lg px-4 md:px-10">
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <Spinner size="lg" label="Laden..." />
              </div>
            }
          >
            <TeamDetailTabs panels={panels} defaultTabId={defaultTabId} />
          </Suspense>
        </div>
      ),
      transition: { type: "diagonal", direction: "left" },
    },
    {
      key: "cta",
      bg: "kcvv-black",
      paddingTop: "pt-16",
      paddingBottom: "pb-16",
      content: (
        <SectionCta
          variant="dark"
          heading="Word lid van KCVV Elewijt"
          body="Sluit je aan bij onze club en word deel van de KCVV-familie. Spelers, vrijwilligers en supporters welkom!"
          buttonLabel="Meer info"
          buttonHref="/hulp"
        />
      ),
    },
  ];

  return <SectionStack sections={sections} />;
}
