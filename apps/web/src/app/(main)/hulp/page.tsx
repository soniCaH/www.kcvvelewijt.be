/**
 * `/hulp` — the unified KCVV help + wie-is-wie hub (Phase 7, design lock 7o7).
 *
 * Fuses the former `/club/organigram` and `/hulp` into one single-scroll,
 * Hulp-first page on the cream / fanzine vocabulary: a sticky two-door section
 * nav (Hulp / Structuur) + the unified `<HubSearch>`, the jersey-deep-dark
 * `<OrganigramHero>` with the structure index, the `#hulp` finder section, a
 * `<StripedSeam>`, the `#structuur` directory section, and a closing
 * `<CtaBand>`.
 *
 * Phase 1 (#2052) stands up this spine: the hero + nav + unified search are
 * live; the `#hulp` finder (#2056) and `#structuur` directory (#2053) sections
 * are skeletons filled in by their own phases. Both repos are read server-side
 * (Sanity, ISR 3600).
 */

import type { Metadata } from "next";
import { Effect } from "effect";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { runPromise } from "@/lib/effect/runtime";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ResponsibilityRepository } from "@/lib/repositories/responsibility.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import {
  CtaBand,
  EditorialHeading,
  MonoLabel,
  StripedSeam,
} from "@/components/design-system";
import { OrganigramSectionNav } from "@/components/organigram/OrganigramSectionNav";
import {
  OrganigramHero,
  deriveStructureIndex,
} from "@/components/organigram/OrganigramHero";
import { StructureDirectory } from "@/components/organigram/StructureDirectory";
import { OrganigramOverview } from "@/components/organigram/OrganigramExplorer";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const canonical = `${SITE_CONFIG.siteUrl}/hulp`;
  return {
    title: "Hulp & wie-is-wie | KCVV Elewijt",
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
  const [members, responsibilityPaths] = await runPromise(
    Effect.gen(function* () {
      const staffRepo = yield* StaffRepository;
      const responsibilityRepo = yield* ResponsibilityRepository;
      return yield* Effect.all(
        [staffRepo.findAll(), responsibilityRepo.findAll()],
        { concurrency: 2 },
      );
    }),
  );

  const structureIndex = deriveStructureIndex(members);

  return (
    <>
      <PageViewTracker eventName="hub_view" />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Hulp", url: `${SITE_CONFIG.siteUrl}/hulp` },
        ])}
      />

      <OrganigramSectionNav
        members={members}
        responsibilityPaths={responsibilityPaths}
      />

      <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <OrganigramHero
          members={members}
          responsibilityPaths={responsibilityPaths}
          structureIndex={structureIndex}
        />

        {/* ① Hulp-first — the responsibility finder (built in #2056). */}
        <section
          id="hulp"
          aria-label="Hulp"
          className="mt-12 scroll-mt-32 sm:mt-16"
        >
          <MonoLabel variant="plain">De vraagvinder</MonoLabel>
          <EditorialHeading
            level={2}
            size="display-md"
            emphasis={{ text: "helpen" }}
            className="mt-2 mb-0"
          >
            Waarmee kunnen we je helpen
          </EditorialHeading>
          <p className="text-ink-soft mt-3 max-w-[60ch] text-base leading-relaxed">
            Zoek hierboven op een naam, functie of vraag — of kies je rol. Hier
            blader je straks door de categorieën met antwoorden, stappen en de
            juiste contactpersoon.
          </p>
        </section>

        <div className="my-10 sm:my-12">
          <StripedSeam colorPair="ink-cream" height="md" />
        </div>

        {/* ② Structuur — the people directory + verkenner (built in #2053). */}
        <section
          id="structuur"
          aria-label="Structuur"
          className="scroll-mt-32 pb-4"
        >
          <MonoLabel variant="plain">De structuur</MonoLabel>
          <EditorialHeading
            level={2}
            size="display-md"
            emphasis={{ text: "wie-is-wie" }}
            className="mt-2 mb-0"
          >
            Het organigram — wie-is-wie
          </EditorialHeading>
          <p className="text-ink-soft mt-3 max-w-[60ch] text-base leading-relaxed">
            Het bestuur, de jeugdwerking en alle vrijwilligers per afdeling.
          </p>

          <div className="mt-8">
            <StructureDirectory nodes={members} />
          </div>

          {/* Volledig organigram — the full reporting chart (click a node to
              drill into the verkenner) + the one-A4 PDF. */}
          <div className="mt-14">
            <MonoLabel variant="plain">Volledig overzicht</MonoLabel>
            <EditorialHeading
              level={3}
              size="display-sm"
              emphasis={{ text: "in beeld" }}
              className="mt-2 mb-6"
            >
              De hele structuur in beeld
            </EditorialHeading>
            <OrganigramOverview nodes={members} />
          </div>
        </section>
      </div>

      <CtaBand
        ariaLabel="Contacteer de club"
        heading="Niemand gevonden?"
        emphasis={{ text: "gevonden", tone: "warm" }}
        lead="Vind je niet meteen de juiste persoon? Stuur ons een bericht — we helpen je verder."
        buttonLabel="Contacteer de club →"
        href="/club/contact"
      />
    </>
  );
}
