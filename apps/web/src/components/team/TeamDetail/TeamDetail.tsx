/**
 * TeamDetail Component
 *
 * Presentational layout for team detail pages.
 * Combines TeamHeader with URL-synced tab navigation:
 * Info · Opstelling · Wedstrijden · Klassement
 *
 * Tabs are shown conditionally based on available data.
 * Wraps UrlTabs in Suspense as required for static generation.
 */

import { Suspense } from "react";
import sanitizeHtml from "sanitize-html";
import * as Tabs from "@radix-ui/react-tabs";

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
import { UrlTabs } from "@/components/ui/url-tabs";
import { TeamHeader, type TeamHeaderProps } from "../TeamHeader";
import { TeamRoster, type RosterPlayer, type StaffMember } from "../TeamRoster";
import { TeamSchedule, type ScheduleMatch } from "../TeamSchedule";
import { TeamStandings, type StandingsEntry } from "../TeamStandings";
import { cn } from "@/lib/utils/cn";

/** Shared tab trigger styles */
const TAB_TRIGGER_CLASSES =
  "px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent data-[state=active]:border-kcvv-green-bright data-[state=active]:text-kcvv-green-bright transition-colors";

export interface TeamDetailProps {
  /** Team header props */
  header: TeamHeaderProps;
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
  /** Additional CSS classes for the root wrapper */
  className?: string;
}

/**
 * Render a complete team detail view with header and tabbed content.
 */
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
  className,
}: TeamDetailProps) {
  const hasPlayers = players.length > 0;
  const hasStaff = staff.length > 0;
  const hasContactInfo = !!contactInfo?.trim();
  const hasBodyContent = !!bodyContent?.trim();
  const hasMatches = matches.length > 0;
  const hasStandings = standings.length > 0;

  // Build list of valid tabs based on available content
  const validTabs = [
    "info",
    ...(hasPlayers || hasStaff ? ["opstelling"] : []),
    ...(hasMatches ? ["wedstrijden"] : []),
    ...(hasStandings ? ["klassement"] : []),
  ];

  return (
    <div className={cn(className)}>
      {/* Team Header */}
      <TeamHeader {...header} />

      {/* URL-synced Tab Navigation */}
      {/* Suspense boundary required for useSearchParams in UrlTabs during static generation */}
      <Suspense
        fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}
      >
        <UrlTabs
          defaultValue="info"
          validTabs={validTabs}
          className="container mx-auto px-4 py-8"
        >
          <Tabs.List
            className="flex border-b border-gray-200 mb-6"
            aria-label="Team informatie"
          >
            <Tabs.Trigger value="info" className={TAB_TRIGGER_CLASSES}>
              Info
            </Tabs.Trigger>
            {(hasPlayers || hasStaff) && (
              <Tabs.Trigger value="opstelling" className={TAB_TRIGGER_CLASSES}>
                Opstelling
              </Tabs.Trigger>
            )}
            {hasMatches && (
              <Tabs.Trigger value="wedstrijden" className={TAB_TRIGGER_CLASSES}>
                Wedstrijden
              </Tabs.Trigger>
            )}
            {hasStandings && (
              <Tabs.Trigger value="klassement" className={TAB_TRIGGER_CLASSES}>
                Klassement
              </Tabs.Trigger>
            )}
          </Tabs.List>

          {/* Info Tab */}
          <Tabs.Content value="info" className="focus:outline-none">
            <div className="space-y-8">
              {/* Contact Info */}
              {hasContactInfo && (
                <section className="prose prose-gray max-w-none">
                  <h2 className="text-2xl font-bold mb-4">Contactinformatie</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        contactInfo!,
                        PROSE_SANITIZE_OPTIONS,
                      ),
                    }}
                  />
                </section>
              )}

              {/* Staff only (when no players - show staff in info tab) */}
              {!hasPlayers && hasStaff && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">Technische Staf</h2>
                  <TeamRoster
                    players={[]}
                    staff={staff}
                    teamName={header.name}
                    groupByPosition={false}
                    showStaff={true}
                  />
                </section>
              )}

              {/* Team body content */}
              {hasBodyContent && (
                <section className="prose prose-gray max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        bodyContent!,
                        PROSE_SANITIZE_OPTIONS,
                      ),
                    }}
                  />
                </section>
              )}

              {/* No content message */}
              {!hasContactInfo && !hasStaff && !hasBodyContent && (
                <p className="text-gray-500 text-center py-8">
                  Geen extra informatie beschikbaar voor dit team.
                </p>
              )}
            </div>
          </Tabs.Content>

          {/* Opstelling Tab */}
          {(hasPlayers || hasStaff) && (
            <Tabs.Content value="opstelling" className="focus:outline-none">
              <TeamRoster
                players={players}
                staff={staff}
                teamName={header.name}
                groupByPosition={true}
                showStaff={hasStaff}
              />
            </Tabs.Content>
          )}

          {/* Wedstrijden Tab */}
          {hasMatches && (
            <Tabs.Content value="wedstrijden" className="focus:outline-none">
              {calendarUrl && (
                <div className="mb-4 flex justify-end">
                  <a
                    href={calendarUrl}
                    download="kcvv-wedstrijden.ics"
                    aria-label={`Download kalender (.ics) voor ${header.name}`}
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 text-sm text-kcvv-green-bright hover:underline"
                  >
                    📅 Voeg toe aan kalender
                  </a>
                </div>
              )}
              <TeamSchedule
                matches={matches}
                teamId={highlightTeamId}
                teamSlug={teamSlug}
                showPast={true}
                highlightNext={true}
              />
            </Tabs.Content>
          )}

          {/* Klassement Tab */}
          {hasStandings && (
            <Tabs.Content value="klassement" className="focus:outline-none">
              <TeamStandings
                standings={standings}
                highlightTeamId={highlightTeamId}
              />
            </Tabs.Content>
          )}
        </UrlTabs>
      </Suspense>
    </div>
  );
}
