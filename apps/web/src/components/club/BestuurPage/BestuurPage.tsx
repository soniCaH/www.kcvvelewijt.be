/**
 * BestuurPage Component
 *
 * Page-level layout for the board pages (`/club/bestuur`,
 * `/club/jeugdbestuur`, `/club/angels`, …) — composed as a `SectionStack`
 * matching the "Dark Roster Spotlight" prototype:
 *
 *   1. Compact `PageHero` ("De club" / team name)
 *   2. `gray-100` description block with green left-border accent
 *   3. `kcvv-black` member roster (white StaffCards pop on dark)
 *   4. `kcvv-green-dark` organigram CTA
 */

import sanitizeHtml from "sanitize-html";
import {
  SectionStack,
  type SectionConfig,
} from "@/components/design-system/SectionStack/SectionStack";
import { PageHero } from "@/components/design-system/PageHero/PageHero";
import { SectionHeader } from "@/components/design-system/SectionHeader/SectionHeader";
import { SectionCta } from "@/components/design-system/SectionCta/SectionCta";
import {
  TeamRoster,
  type RosterPlayer,
  type StaffMember,
} from "@/components/team/TeamRoster";

/**
 * When the CMS marks a link as `target="_blank"` we must also emit
 * `rel="noopener noreferrer"` to prevent reverse-tabnabbing and to avoid
 * leaking the Referer header to the third-party destination. `sanitize-html`
 * does not enforce this by default — `rel` is not in the default allowed
 * attributes for `<a>`, so any `rel` the CMS author sets would be stripped.
 * We explicitly allow `rel` and merge the required tokens in the transform.
 */
function hardenExternalLinkRel(existingRel: string | undefined): string {
  const tokens = new Set(
    (existingRel ?? "").split(/\s+/).filter((t) => t.length > 0),
  );
  tokens.add("noopener");
  tokens.add("noreferrer");
  return Array.from(tokens).join(" ");
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: [
      ...(sanitizeHtml.defaults.allowedAttributes?.["a"] ?? []),
      "class",
      "rel",
    ],
  },
  transformTags: {
    a: (tagName, attribs) => {
      const hardenedRel =
        attribs.target === "_blank"
          ? hardenExternalLinkRel(attribs.rel)
          : attribs.rel;
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(hardenedRel ? { rel: hardenedRel } : {}),
          class: "content-link",
        },
      };
    },
  },
};

export interface BestuurPageHeader {
  /** Team name (rendered as the hero headline) */
  name: string;
  /** Team tagline (rendered as hero body — falls back to a default) */
  tagline?: string;
  /** Team / group photo URL — used as the hero background image */
  imageUrl?: string;
  /** Team type — kept for prop compatibility with the route call sites */
  teamType?: "senior" | "youth" | "club";
}

export interface BestuurPageProps {
  /** Team header data */
  header: BestuurPageHeader;
  /** Sanitised HTML description shown in the gray section */
  description?: string;
  /** Board members rendered as staff cards */
  staff?: StaffMember[];
  /** Players (rarely set for board teams, included for completeness) */
  players?: RosterPlayer[];
}

export function BestuurPage({
  header,
  description,
  staff = [],
  players = [],
}: BestuurPageProps) {
  const hasMembers = players.length > 0 || staff.length > 0;
  const hasDescription = !!description?.trim();
  const trimmedTagline = header.tagline?.trim();
  const heroBody = trimmedTagline || "De mensen achter KCVV Elewijt";

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
          image={header.imageUrl}
          imageAlt={`${header.name} groepsfoto`}
          label="De club"
          headline={header.name}
          body={heroBody}
        />
      ),
      transition: { type: "diagonal", direction: "right", overlap: "full" },
    },
  ];

  if (hasDescription) {
    sections.push({
      key: "about",
      bg: "gray-100",
      content: (
        <div className="max-w-inner-lg mx-auto px-4 md:px-10">
          <div className="border-kcvv-green-bright max-w-3xl border-l-4 pl-6">
            <div
              className="prose prose-gray"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(description!, SANITIZE_OPTIONS),
              }}
            />
          </div>
        </div>
      ),
      transition: { type: "diagonal", direction: "left" },
    });
  }

  if (hasMembers) {
    sections.push({
      key: "members",
      bg: "kcvv-black",
      content: (
        <div className="max-w-inner-lg mx-auto px-4 md:px-10">
          <SectionHeader title={header.name} variant="dark" />
          <TeamRoster
            players={players}
            staff={staff}
            teamName={header.name}
            groupByPosition={false}
            showStaff
            staffSectionLabel={null}
          />
        </div>
      ),
      transition: { type: "diagonal", direction: "right" },
    });
  }

  sections.push({
    key: "cta",
    bg: "kcvv-black",
    paddingTop: "pt-16",
    paddingBottom: "pb-16",
    content: (
      <SectionCta
        variant="dark"
        heading="Wie doet wat?"
        body="Bekijk het volledige organigram van KCVV Elewijt en vind snel de juiste persoon voor jouw vraag."
        buttonLabel="Organigram bekijken"
        buttonHref="/club/organigram"
      />
    ),
  });

  return <SectionStack sections={sections} />;
}
