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

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildPersonJsonLd } from "@/lib/seo/jsonld";
import { VerderLezenRow } from "@/components/article/VerderLezenRow";
import { articleVMsToVerderLezenItems } from "@/lib/utils/article-related-items";
import { BioBlock, QuotesBlock } from "@/components/player";
import { hasRenderableBioContent } from "@/lib/portable-text/findPullquoteText";
import { StaffHero } from "@/components/staff/StaffHero";
import { StaffRoles } from "@/components/staff/StaffRoles";
import { PageContainer, StripedSeam } from "@/components/design-system";

interface StaffPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const members = await runPromise(
      Effect.gen(function* () {
        const repo = yield* StaffRepository;
        return yield* repo.findAllForStaticParams();
      }),
    );
    return members.map((m) => ({ slug: m.psdId }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: StaffPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const member = await runPromise(
      Effect.gen(function* () {
        const repo = yield* StaffRepository;
        return yield* repo.findByPsdId(slug);
      }),
    );
    if (!member) return { title: "Stafmedewerker niet gevonden" };

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
    return { title: "Stafmedewerker niet gevonden" };
  }
}

export default async function StafPage({ params }: StaffPageProps) {
  const { slug } = await params;

  const member = await runPromise(
    Effect.gen(function* () {
      const repo = yield* StaffRepository;
      return yield* repo.findByPsdId(slug);
    }),
  );

  if (!member) notFound();

  const relatedArticles = await runPromise(
    Effect.gen(function* () {
      const repo = yield* ArticleRepository;
      return yield* repo.findRelated(member.id);
    }),
  );

  const fullName = `${member.firstName} ${member.lastName}`.trim() || "Staf";
  const bioBlocks = (member.bio ?? []) as PortableTextBlock[];
  // Match the seam gate to the same predicate <BioBlock>/<QuotesBlock> use to
  // auto-hide, so a whitespace-only bio (with no roles/related) can't strand an
  // ink→cream seam above the footer with nothing rendered below it.
  const hasBio = hasRenderableBioContent(bioBlocks);
  const hasRoles =
    member.organigramPositions.length > 0 ||
    member.responsibilityPaths.length > 0;
  const hasContentBelowHero = hasBio || hasRoles || relatedArticles.length > 0;

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
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Staf", url: `${SITE_CONFIG.siteUrl}/hulp#structuur` },
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

      {/* Hero — person-profile (B). Container width + padding match the
          `/spelers/[slug]` hero section; the bottom padding reserves the
          rhythm before the full-bleed seam. */}
      <PageContainer as="section" className="py-12 lg:py-16">
        <StaffHero
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

      {/* Full-bleed cream "Verder lezen." slider — auto-hides when empty. */}
      <VerderLezenRow
        items={articleVMsToVerderLezenItems(relatedArticles)}
        pageType="staff"
        pageSlug={slug}
      />
    </>
  );
}

// 24h ISR — staff data is PSD-synced + editor-published; on-demand
// revalidation keeps it fresh via /api/revalidate (revalidateTag 'staff').
export const revalidate = 86400;
