/**
 * Staff Member Detail Page
 * Displays individual staff member profiles from Sanity (slug = psdId).
 *
 * Rebuilt on the retro-terrace-fanzine system (#2124, lock `10f2`) and aligned
 * with `/spelers/[slug]`: bare fragment on the near-white body, a person-profile
 * hero (figure left) → a single full-bleed <StripedSeam> → bio (<BioBlock>
 * cream band, shared with players) → merged "Rol & verantwoordelijkheden." →
 * related.
 */

import { cache } from "react";
import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import { TeamRepository } from "@/lib/repositories/team.repository";
import { degradeSection } from "@/lib/effect/degrade";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildPersonJsonLd } from "@/lib/seo/jsonld";
import { RelatedRow } from "@/components/related/RelatedRow";
import { mergeRelatedRow } from "@/components/related/mergeRelatedRow";
import type { RelatedRowItem } from "@/components/related/types";
import { articleVMsToRelatedRowItems } from "@/lib/utils/article-related-items";
import { BioBlock, QuotesBlock } from "@/components/player";
import { hasRenderableBioContent } from "@/lib/portable-text/findPullquoteText";
import { StaffHero } from "@/components/staff/StaffHero";
import { StaffRoles } from "@/components/staff/StaffRoles";
import { PageContainer, StripedSeam, UpLink } from "@/components/design-system";

interface StaffPageProps {
  params: Promise<{ slug: string }>;
}

// Deliberately empty (#3135, flake class H): an enumerated slug is rendered at
// build, so its own subject read runs against live Sanity and one 503 there
// killed the whole build. Each slug renders on its first request instead and
// ISR caches it; a failed first request is a 500 that is never cached.
// Required all the same: without this export `revalidate` is inert (#2391).
export async function generateStaticParams() {
  return [];
}

// Subject read: the staff member is this page's entire content, so a failed
// read takes it down with it via `Effect.orDie` (#2864). Wrapped in React
// `cache()` so the same-segment `layout.tsx` (existence check, #2968),
// `generateMetadata` below, and the page component share one read per
// request instead of three (#2441).
export const fetchStaffMemberOrNull = cache(
  async function fetchStaffMemberOrNull(slug: string) {
    return runPromise(
      Effect.gen(function* () {
        const repo = yield* StaffRepository;
        return yield* repo.findByPsdId(slug);
      }).pipe(Effect.orDie),
    );
  },
);

export async function generateMetadata({
  params,
}: StaffPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const member = await fetchStaffMemberOrNull(slug);
    if (!member)
      return {
        title: "Stafmedewerker niet gevonden",
        // #2963/#2968: belt-and-braces. The same-segment `layout.tsx` now
        // gets a real 404 here, but this noindex stays in case a future
        // `loading.tsx`/ancestor boundary ever reintroduces the soft 200.
        robots: { index: false, follow: false },
      };

    const fullName = `${member.firstName} ${member.lastName}`.trim() || "Staf";
    const description = "KCVV Elewijt stafmedewerker";

    return {
      title: fullName,
      description,
      alternates: { canonical: `${SITE_CONFIG.siteUrl}/staf/${slug}` },
      openGraph: {
        title: fullName,
        description,
        type: "profile",
        firstName: member.firstName,
        lastName: member.lastName,
        images: member.imageUrl
          ? [{ url: member.imageUrl, alt: fullName }]
          : [DEFAULT_OG_IMAGE],
      },
    };
  } catch {
    return {
      title: "Stafmedewerker niet gevonden",
      // Deliberately NOT noindex: this `catch` fires on a read failure
      // (Sanity/BFF outage, timeout, parse error), not only on an unknown
      // id. Emitting noindex here would ask Google to drop a live, indexed
      // page during an outage. Only the genuine not-found branch above
      // carries it.
    };
  }
}

export default async function StafPage({ params }: StaffPageProps) {
  const { slug } = await params;

  // Subject read: the staff member is this page's entire content, so a
  // failed read takes it down with it — `null` (genuinely no such member) is
  // the only case that resolves to `notFound()` (#2864). The same-segment
  // `layout.tsx` already ran this exact check before the shell flushed
  // (#2968); `cache()` means this call reuses that read.
  const member = await fetchStaffMemberOrNull(slug);

  if (!member) notFound();

  // "Blijf nog even hangen." is a section, not the subject (#2433 rule 3),
  // and its absence asserts nothing — the visitor was never promised a
  // read-next row — so it auto-hides rather than announcing the failure
  // (rule 4). Two independent reads, run together (#2441): the staff
  // member's own team(s) (domain tier, #2443 rule 4) and articles that
  // mention them (reference tier).
  const [ownTeams, relatedArticles] = await Promise.all([
    runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* TeamRepository;
          return yield* repo.findByMemberId(member.id);
        }),
        [],
        "[staf/[slug]] own-team lookup failed; rendering without the RelatedRow team card.",
      ),
    ),
    runPromise(
      degradeSection(
        Effect.gen(function* () {
          const repo = yield* ArticleRepository;
          return yield* repo.findRelated(member.id);
        }),
        [],
        "[staf/[slug]] related-articles lookup failed; rendering without the RelatedRow.",
      ),
    ),
  ]);

  // `TeamRelationVM.displayName` runs through the same `teamDisplayName`
  // fallthrough as the player page's `teamLabel` and can legitimately
  // resolve to "" (CodeRabbit finding on PR #2788, round 2) — filter those
  // out before mapping rather than emitting a titleless card that still
  // links to /ploegen/[slug].
  const domainItems: RelatedRowItem[] = ownTeams
    .filter((team) => team.displayName !== "")
    .map((team) => ({
      title: team.displayName,
      href: `/ploegen/${team.slug}`,
      imageUrl: team.teamImageUrl ?? undefined,
      artefact: team.teamImageUrl ? undefined : { kind: "team" as const },
      badge: "PLOEG",
      analyticsId: team.id,
      analyticsSource: "domain",
      analyticsType: "team",
      analyticsTargetSlug: team.slug,
    }));

  const relatedRowItems = mergeRelatedRow({
    domain: domainItems,
    curated: [],
    reference: articleVMsToRelatedRowItems(relatedArticles),
    semantic: [],
    siblings: [],
  });

  const fullName = `${member.firstName} ${member.lastName}`.trim() || "Staf";
  const bioBlocks = (member.bio ?? []) as PortableTextBlock[];
  // Match the seam gate to the same predicate <BioBlock>/<QuotesBlock> use to
  // auto-hide, so a whitespace-only bio (with no roles/related) can't strand an
  // ink→cream seam above the footer with nothing rendered below it.
  const hasBio = hasRenderableBioContent(bioBlocks);
  const hasRoles =
    member.organigramPositions.length > 0 ||
    member.responsibilityPaths.length > 0;
  const hasContentBelowHero = hasBio || hasRoles || relatedRowItems.length > 0;

  return (
    // Bare fragment on the near-white page background, mirroring
    // `/spelers/[slug]`: the hero + role/related sections sit on the body bg
    // while the bio renders as a cream band (<ArticleBody>). No page-level
    // `min-h-screen` wrapper, so a short profile doesn't stretch a void before
    // the footer (which lives in the root layout).
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Hulp", url: `${SITE_CONFIG.siteUrl}/hulp` },
          { name: fullName, url: `${SITE_CONFIG.siteUrl}/staf/${slug}` },
        ])}
      />
      <JsonLd
        data={buildPersonJsonLd({
          name: fullName,
          url: `${SITE_CONFIG.siteUrl}/staf/${slug}`,
          image: member.imageUrl ?? undefined,
          jobTitle: member.organigramPositions[0]?.title,
        })}
      />

      {/* Hero — person-profile (B). Container width matches the
          `/spelers/[slug]` hero section; the bottom padding reserves the
          rhythm before the full-bleed seam. */}
      <PageContainer as="section" className="pb-12 lg:pb-16">
        <UpLink href="/hulp" label="Hulp" className="mb-6" />
        <StaffHero
          id={member.id}
          firstName={member.firstName}
          lastName={member.lastName}
          imageUrl={member.imageUrl}
          roles={member.organigramPositions.map((p) => p.title)}
          email={member.email}
          phone={member.phone}
        />
      </PageContainer>

      {/* A single full-bleed seam after the hero, matching `/spelers/[slug]`
          (one seam, then sections flow — no per-section dividers). */}
      {hasContentBelowHero ? (
        <StripedSeam colorPair="ink-cream" height="md" />
      ) : null}

      {/* Bio — parity with `/spelers/[slug]` (STAFF-1/2): the shared
          <BioBlock> (cream band, pullquote decorator) + <QuotesBlock> for a
          second marked pull-quote. Both auto-hide when there's nothing to
          render, so the old default-H2 "act divider" no longer appears on
          staff/club profiles. `playerName` is just the pull-quote attribution
          slot — here it carries the staff member's name. */}
      <BioBlock bio={bioBlocks} playerName={fullName} />
      <QuotesBlock bio={bioBlocks} playerName={fullName} />

      {/* Rol & verantwoordelijkheden — merged org positions + hulp links. */}
      {hasRoles ? (
        <StaffRoles
          positions={member.organigramPositions.map((p) => ({
            id: p._id,
            title: p.title,
            ...(p.roleCode ? { roleCode: p.roleCode } : {}),
            ...(p.department ? { department: p.department } : {}),
          }))}
          responsibilities={member.responsibilityPaths}
        />
      ) : null}

      {/* Full-bleed cream "Blijf nog even hangen." slider — auto-hides when
          empty (#2443/#2581). */}
      <RelatedRow items={relatedRowItems} pageType="staff" pageSlug={slug} />
    </>
  );
}

// 24h ISR — staff data is PSD-synced + editor-published; on-demand
// revalidation keeps it fresh via /api/revalidate (revalidateTag 'staff').
export const revalidate = 86400;
