import { Effect } from "effect";
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
import { degradeSection } from "@/lib/effect/degrade";
import { SITE_CONFIG } from "@/lib/constants";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageContainer, StripedSeam } from "@/components/design-system";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { PageHero } from "@/components/layout/PageHero";
import { JeugdVisie } from "@/components/jeugd/JeugdVisie/JeugdVisie";
import { VisieHashLandingCorrection } from "@/components/jeugd/JeugdVisie/VisieHashLandingCorrection";
import { JeugdEditorialGrid } from "@/components/jeugd/JeugdEditorialGrid/JeugdEditorialGrid";
import { EditorialHubAnalytics } from "@/components/editorial/EditorialHubAnalytics/EditorialHubAnalytics";
import { JeugdCtaBand } from "@/components/jeugd/JeugdCtaBand/JeugdCtaBand";
import { YouthDirectory } from "@/components/team/YouthDirectory";

/** Committed youth asset — also the homepage `<YouthSection>` backdrop. */
export const YOUTH_PHOTO = "/images/youth-trainers.jpg";

// Exported so `loading.tsx` can reuse the real, unshimmered opening (#2432
// §2) instead of a second hand-typed copy that can silently drift from this
// one.
export const JEUGD_KICKER = "De jeugdopleiding · U6 tot U21";
export const JEUGD_HEADLINE = "Beter worden begint met plezier";
export const JEUGD_LEAD =
  "Een doordachte opleiding van Onderbouw tot Bovenbouw, met gediplomeerde trainers en plezier als motor. Want wie graag speelt, groeit vanzelf — op en naast het veld.";

export const metadata = buildPageMetadata({
  title: "Jeugdopleiding",
  description:
    "Ontdek de jeugdopleiding van KCVV Elewijt. Van U6 tot U21: ploegen, nieuws, trainingsinfo en meer.",
  path: "/jeugd",
});

/**
 * The youth team grid is a section, not the page's subject: a failed read
 * degrades to an empty list, which `<YouthDirectory>` already renders as no
 * section at all, rather than taking `/jeugd` down (#2864).
 *
 * The outer try/catch is not the dead-catchAll anti-pattern this ticket
 * removes elsewhere: it covers `AppLayer` construction failing (e.g. a
 * missing `KCVV_API_URL`), which happens outside the effect
 * `degradeSection`'s `catchAllCause` wraps — an in-effect catch cannot see a
 * failure to provide the effect's own context (same mechanism as
 * `app/layout.tsx`'s nav-teams read).
 */
async function fetchTeams(): Promise<TeamLandingItem[]> {
  try {
    return await runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findAllForLanding();
        }),
        [],
        "[jeugd] failed to fetch youth teams",
      ),
    );
  } catch (error) {
    console.error("[jeugd] failed to fetch youth teams:", error);
    return [];
  }
}

/**
 * The Jeugd articles feed is a section of the nav hub, not the page's
 * subject: a failed read degrades to an empty list, which
 * `<JeugdEditorialGrid>` already handles (#2864).
 *
 * Same outer try/catch as `fetchTeams` above, for the same reason: it covers
 * `AppLayer` construction failing, not the read itself.
 */
async function fetchJeugdArticles(): Promise<ArticleVM[]> {
  try {
    return await runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findPaginated({
            offset: 0,
            limit: 3,
            category: "Jeugd",
          });
        }),
        [],
        "[jeugd] failed to fetch jeugd articles",
      ),
    );
  } catch (error) {
    console.error("[jeugd] failed to fetch jeugd articles:", error);
    return [];
  }
}

/**
 * The nav hub is a section, not the page's subject (#2433 rule 3): a failed
 * read drops it back to its pinned cards, which is what `null` already means
 * here, rather than taking `/jeugd` down.
 *
 * Same outer try/catch as `fetchTeams` above, for the same reason: it covers
 * `AppLayer` construction failing, not the read itself.
 */
async function fetchEditorialConfig(): Promise<EditorialCardConfig[] | null> {
  try {
    return await runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* JeugdLandingPageRepository;
          return yield* repo.getEditorialCards();
        }).pipe(Effect.provide(JeugdLandingPageRepositoryLive)),
        null,
        "[jeugd] editorial-cards lookup failed; falling back to the pinned nav cards.",
      ),
    );
  } catch (error) {
    console.error("[jeugd] editorial-cards lookup failed:", error);
    return null;
  }
}

/**
 * `/jeugd` — Phase 7 redesign (PRD redesign-phase-7-jeugd). The route opens on
 * the shared opening's dark register — a page whose subject is a group of
 * people opens with their photograph (#2426) — then returns to the cream
 * vocabulary: `<PageHero register="band" tone="dark">` → `<StripedSeam>` →
 * `<JeugdVisie>` (the `#visie` filosofie block) → the `<JeugdEditorialGrid>`
 * nav hub → the 6.C `<YouthDirectory>` division grid → the full-bleed
 * `<JeugdCtaBand>`. Empty states: no youth teams → `<YouthDirectory>` drops the
 * section (returns null); no Jeugd articles → the nav hub collapses to its
 * pinned nav cards. Fires `jeugd_view` (page view) + `jeugd_card_click` (nav-hub
 * card clicks, via `<EditorialHubAnalytics>` delegation).
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
      <PageViewTracker eventName="jeugd_view" />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Jeugd", url: `${SITE_CONFIG.siteUrl}/jeugd` },
        ])}
      />

      <PageHero
        register="band"
        tone="dark"
        width="index"
        kicker={JEUGD_KICKER}
        headline={JEUGD_HEADLINE}
        lead={JEUGD_LEAD}
        image={YOUTH_PHOTO}
      />

      {/* Full-bleed seam — a sibling of the container (not wrapped) so it spans
          the viewport like the seams elsewhere on the site. The dark band paints
          its own field down to the seam, so the seam carries no margin here. */}
      <StripedSeam colorPair="ink-cream" height="md" />

      <PageContainer width="index" className="py-12 sm:py-16">
        <JeugdVisie />
        <VisieHashLandingCorrection />

        <EditorialHubAnalytics eventName="jeugd_card_click" className="mt-16">
          <JeugdEditorialGrid
            articles={articles}
            editorialConfig={editorialConfig}
          />
        </EditorialHubAnalytics>

        <YouthDirectory
          heading="Jeugdwerking"
          divisions={youthByDivision}
          className="mt-16"
        />
      </PageContainer>

      <JeugdCtaBand />
    </>
  );
}

// 15m ISR — capped by #2433 rule 5, not by content freshness: the `(landing)`
// layout mounts `<MatchStripSlot>`, whose BFF read degrades to no strip and is
// then cached in this page's ISR entry for the whole window.
export const revalidate = 900;
