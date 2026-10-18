/**
 * `/hulp` — the unified KCVV help + wie-is-wie hub (Phase 7, design lock 7o7).
 *
 * Fuses the former `/club/organigram` and `/hulp` into one single-scroll,
 * Hulp-first page on the cream / fanzine vocabulary: a sticky two-door section
 * nav (Hulp / Structuur) + the unified `<HubSearch>`, the jersey-deep-dark
 * `<OrganigramHero>` with the structure index, the `#hulp` finder section, a
 * `<StripedSeam>`, the `#structuur` clubboek section, and a closing
 * `<CtaBand>`.
 *
 * Phase 1 (#2052) stands up this spine: the hero + nav + unified search are
 * live; the `#hulp` finder (#2056) and the `#structuur` section are filled in
 * by their own phases. #3525 replaced the department directory and its side
 * panel with the `<ClubBook>`: key-figure cards plus a ledger per pillar, a row
 * unfolding in place. Both repos are read server-side (Sanity, ISR 3600).
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { runPromise } from "@/lib/effect/runtime";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ResponsibilityRepository } from "@/lib/repositories/responsibility.repository";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { degradeSection } from "@/lib/effect/degrade";
import { isAgeCode } from "@/lib/utils/group-teams";
import { seasonStartYear } from "@/lib/utils/season";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildBreadcrumbJsonLd,
  buildFAQPageJsonLd,
  buildSportsClubJsonLd,
} from "@/lib/seo/jsonld";
import { responsibilityPathsToFaqEntries } from "@/lib/responsibility-utils";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import {
  CtaBand,
  PageContainer,
  SectionHeader,
  StripedSeam,
} from "@/components/design-system";
import { OrganigramSectionNav } from "@/components/organigram/OrganigramSectionNav";
import {
  OrganigramHero,
  deriveStructureIndex,
} from "@/components/organigram/OrganigramHero";
import { HubSearchQueryProvider } from "@/components/organigram/HubSearch";
import { ClubBook } from "@/components/organigram/ClubBook";
import { OrganigramOverview } from "@/components/organigram/OrganigramExplorer";
import { HulpFinder } from "@/components/hulp/HulpFinder";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const canonical = `${SITE_CONFIG.siteUrl}/hulp`;
  return {
    title: "Hulp & wie-is-wie",
    description:
      "Vind snel de juiste persoon of het juiste antwoord bij KCVV Elewijt. Typ een naam, functie of vraag, of blader door de structuur en de hulpvragen.",
    keywords: [
      "hulp",
      "contact",
      "organigram",
      "bestuur",
      "wie contacteren",
      "verantwoordelijke",
      "KCVV Elewijt",
    ],
    alternates: { canonical },
    openGraph: {
      title: "Hulp & wie-is-wie - KCVV Elewijt",
      description:
        "Vind snel de juiste persoon of het juiste antwoord bij KCVV Elewijt.",
      type: "website",
      url: canonical,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function HulpHubPage() {
  // Subject read: both the org structure and the FAQ are this page's entire
  // content, so a failed read takes the page down with it (#2864).
  const [members, responsibilityPaths] = await runPromise(
    Effect.gen(function* () {
      const staffRepo = yield* StaffRepository;
      const responsibilityRepo = yield* ResponsibilityRepository;
      return yield* Effect.all(
        [staffRepo.findAll(), responsibilityRepo.findAll()],
        { concurrency: 2 },
      );
    }).pipe(Effect.orDie),
  );

  // Context read: the youth team card (#3558) is an extra above the search
  // results, so a failed read only drops the card. The coordinator and TVJO
  // boxes it shows are already in `members` (by `roleCode`). The landing read
  // carries each team's staff, so a "Staf van …" link only aims at `#staf`
  // where the team page renders that section.
  const teams = await runPromise(
    degradeSection(
      Effect.gen(function* () {
        const teamRepo = yield* TeamRepository;
        return yield* teamRepo.findAllForLanding();
      }),
      [],
      "[HulpHubPage] failed to load youth teams — no team card",
    ),
  );
  const now = new Date();
  const youthTeamCard = {
    teams: teams.flatMap((t) =>
      t.age && isAgeCode(t.age)
        ? [
            {
              _id: t._id,
              slug: t.slug,
              name: t.name,
              displayName: t.displayName,
              age: t.age,
              hasStaff: (t.staff?.length ?? 0) > 0,
            },
          ]
        : [],
    ),
    seasonYear: seasonStartYear(now),
    calendarYear: now.getFullYear(),
  };

  const structureIndex = deriveStructureIndex(members);
  const faqEntries = responsibilityPathsToFaqEntries(responsibilityPaths);

  return (
    // The hub mounts `<HubSearch>` twice — in `<OrganigramHero>` and, once
    // the hero scrolls away, in `<OrganigramSectionNav>`. This provider is
    // the one query and popup state they share, so the copy on screen
    // carries what the visitor typed instead of a stale dropdown floating
    // over the pinned chrome (#3043). Scoped to the page because the two
    // instances sit in different subtrees.
    <HubSearchQueryProvider>
      <PageViewTracker eventName="hub_view" />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Hulp", url: `${SITE_CONFIG.siteUrl}/hulp` },
        ])}
      />
      {/* Organization (multi-type SportsClub+Organization) + the hub's FAQ rich
          results from the responsibility paths (#2058). The FAQPage is omitted
          when no path yields a non-empty Q&A, so we never ship empty structured
          data. */}
      <JsonLd data={buildSportsClubJsonLd()} />
      {faqEntries.length > 0 && (
        <JsonLd data={buildFAQPageJsonLd(faqEntries)} />
      )}

      <OrganigramSectionNav
        members={members}
        responsibilityPaths={responsibilityPaths}
        youthTeamCard={youthTeamCard}
      />
      {/* Top under the sticky nav + hero keeps the plain step (an opening,
            #3306); the bottom sits above the `<CtaBand>` seam, so it gives one
            step back. The in-column seam below keeps its own `my-*` margin. */}
      <PageContainer width="index" className="pt-12 pb-10 sm:pt-16 sm:pb-14">
        <OrganigramHero
          members={members}
          responsibilityPaths={responsibilityPaths}
          structureIndex={structureIndex}
          youthTeamCard={youthTeamCard}
        />

        {/* ① Hulp-first — the responsibility finder (#2056). */}
        <section
          id="hulp"
          aria-label="Hulp"
          tabIndex={-1}
          className="mt-12 focus:outline-none sm:mt-16"
        >
          <SectionHeader
            title="Veelgestelde vragen"
            size="display-md"
            emphasis={{ text: "vragen" }}
          />
          <p className="text-ink max-w-[var(--container-prose)] text-base leading-relaxed">
            Kies je rol of een categorie en blader door de antwoorden — elk
            antwoord geeft je de stappen én de juiste contactpersoon. Of zoek
            hierboven op een naam, functie of vraag.
          </p>

          {/* Prerendered with the page: the finder keeps its facets in the
                URL without `useSearchParams()`, so it ships in the HTML instead
                of a placeholder that the hydrated finder would push ~1900px
                down the page. */}
          <div className="mt-8">
            <HulpFinder responsibilityPaths={responsibilityPaths} />
          </div>
        </section>

        <div className="my-10 sm:my-12">
          <StripedSeam colorPair="ink-cream" height="md" />
        </div>

        {/* ② Structuur — the clubboek + verkenner (#2053–#2055, #3525). */}
        <section
          id="structuur"
          aria-label="Structuur"
          tabIndex={-1}
          className="pb-4 focus:outline-none"
        >
          <SectionHeader
            kicker={[{ label: "De structuur" }]}
            title="Het organigram — wie-is-wie"
            size="display-md"
            emphasis={{ text: "wie-is-wie" }}
          />
          <p className="text-ink max-w-[var(--container-prose)] text-base leading-relaxed">
            Wie doet wat bij de club: de mensen die je het vaakst nodig hebt
            bovenaan, daarna alle functies per pijler.
          </p>

          <div className="mt-8">
            <ClubBook
              nodes={members}
              responsibilityPaths={responsibilityPaths}
            />
          </div>

          {/* Volledig organigram — demoted behind a quiet disclosure (7o9 · 2):
                the clubboek leads; the full chart (+ its spotlight verkenner) is
                one deliberate click away. */}
          <div className="mt-10">
            <OrganigramOverview nodes={members} collapsible />
          </div>
        </section>
      </PageContainer>

      {/* Full-width: a sibling of the max-w content div, not inside it. */}
      <CtaBand
        ariaLabel="Contacteer de club"
        heading="Niemand gevonden?"
        emphasis={{ text: "gevonden", tone: "warm" }}
        lead="Vind je niet meteen de juiste persoon? Stuur ons een bericht — we helpen je verder."
        buttonLabel="Contacteer de club →"
        href="/club/contact"
      />
    </HubSearchQueryProvider>
  );
}
