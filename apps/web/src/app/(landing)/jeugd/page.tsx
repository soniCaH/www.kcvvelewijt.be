import { Effect } from "effect";
import type { Metadata } from "next";
import { runPromise } from "@/lib/effect/runtime";
import { TeamRepository } from "@/lib/repositories/team.repository";
import {
  ArticleRepository,
  type ArticleVM,
} from "@/lib/repositories/article.repository";
import {
  JeugdLandingPageRepository,
  JeugdLandingPageRepositoryLive,
  type EditorialCardConfig,
} from "@/lib/repositories/jeugd-landing-page.repository";
import {
  groupTeamsForLanding,
  type TeamLandingItem,
} from "@/lib/utils/group-teams";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { FooterSafeArea } from "@/components/design-system";
import { JeugdEditorialGrid } from "@/components/jeugd/JeugdEditorialGrid/JeugdEditorialGrid";
import { YouthDirectory } from "@/components/team/YouthDirectory";

export const metadata: Metadata = {
  title: "Jeugdopleiding | KCVV Elewijt",
  description:
    "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
  openGraph: {
    title: "Jeugdopleiding | KCVV Elewijt",
    description:
      "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

async function fetchTeams(): Promise<TeamLandingItem[]> {
  try {
    return await runPromise(
      Effect.gen(function* () {
        const repo = yield* TeamRepository;
        return yield* repo.findAllForLanding();
      }),
    );
  } catch (error) {
    console.error("Failed to fetch youth teams:", error);
    return [];
  }
}

async function fetchJeugdArticles(): Promise<ArticleVM[]> {
  try {
    return await runPromise(
      Effect.gen(function* () {
        const repo = yield* ArticleRepository;
        return yield* repo.findPaginated({
          offset: 0,
          limit: 3,
          category: "Jeugd",
        });
      }),
    );
  } catch (error) {
    console.error("Failed to fetch jeugd articles:", error);
    return [];
  }
}

async function fetchEditorialConfig(): Promise<EditorialCardConfig[] | null> {
  return runPromise(
    Effect.gen(function* () {
      const repo = yield* JeugdLandingPageRepository;
      return yield* repo.getEditorialCards();
    }).pipe(Effect.provide(JeugdLandingPageRepositoryLive)),
  );
}

/**
 * `/jeugd` — Phase 7 tracer (PRD redesign-phase-7-jeugd §3). The route is
 * rebuilt on the cream vocabulary: a temporary editorial header + the existing
 * nav cards (`<JeugdEditorialGrid>`) + the 6.C `<YouthDirectory>` division grid
 * (replacing the legacy dark `<TeamOverview>`). The `<JeugdHero>`, filosofie
 * block, nav-hub reskin, and CTA band land in Phases 2-5 (#2039-#2042); this
 * proves the route + data + e2e on the new spine first.
 */
export default async function JeugdPage() {
  const [teams, articles, editorialConfig] = await Promise.all([
    fetchTeams(),
    fetchJeugdArticles(),
    fetchEditorialConfig(),
  ]);

  const { youthByDivision } = groupTeamsForLanding(teams);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Jeugd", url: `${SITE_CONFIG.siteUrl}/jeugd` },
        ])}
      />

      <div className="mx-auto w-full max-w-[70rem] px-4 py-10 sm:py-14">
        {/* Temporary tracer header — replaced by <JeugdHero> in Phase 2. */}
        <header className="mb-12 flex flex-col gap-3">
          <span>
            <MonoLabel variant="plain">
              De jeugdopleiding · U6 tot U21
            </MonoLabel>
          </span>
          <EditorialHeading
            level={1}
            size="display-2xl"
            emphasis={{ text: "." }}
          >
            Jeugdopleiding
          </EditorialHeading>
          <p className="font-display text-ink-muted text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] italic">
            Van U6 tot U21 — ploegen, nieuws en praktische info voor onze
            jongste compagnie.
          </p>
        </header>

        <JeugdEditorialGrid
          articles={articles}
          editorialConfig={editorialConfig}
        />

        <YouthDirectory divisions={youthByDivision} className="mt-16" />
      </div>

      <FooterSafeArea />
    </>
  );
}

export const revalidate = 3600;
