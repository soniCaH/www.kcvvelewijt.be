import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { notFound } from "next/navigation";
import { Effect } from "effect";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { PageRepository } from "@/lib/repositories/page.repository";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { PageHero } from "@/components/layout/PageHero";
import { ArticleBody } from "@/components/article/ArticleBody";
import {
  CtaBand,
  PageContainer,
  StripedSeam,
} from "@/components/design-system";

/**
 * Slug of the CMS "Praktische Informatie" page — gets a closing CTA to the
 * membership form. ponytail: a single stable, load-bearing slug (also driving
 * the nav link + /club/register redirect); promote to a CMS field if a second
 * page ever needs a form CTA.
 */
const MEMBERSHIP_INFO_SLUG = "inschrijven";

interface Props {
  params: Promise<{ slug: string }>;
}

// Subject read: this route renders exactly the CMS page it fetches, so a
// failed read takes the page down with it — `null` (genuinely no such page)
// is the only case that resolves to `notFound()` (#2864).
async function fetchPage(slug: string) {
  return runPromise(
    Effect.gen(function* () {
      const repo = yield* PageRepository;
      return yield* repo.findBySlug(slug);
    }).pipe(Effect.orDie),
  );
}

// Deliberately empty — CMS pages are not enumerated at build time, so a new
// page goes live without a redeploy. Required all the same: without this export
// the segment never enters the ISR cache and `revalidate` is inert (#2391).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page)
    return {
      title: "Pagina niet gevonden",
      // #2963: this branch renders under a 200 (a `loading.tsx` Suspense
      // boundary flushes the shell before `notFound()` runs), so noindex is
      // what actually keeps it out of the index.
      robots: { index: false, follow: false },
    };

  const description =
    page.metaDescription?.trim() || `${page.title} — KCVV Elewijt`;
  const ogImage = page.ogImageUrl
    ? { url: page.ogImageUrl, alt: page.title }
    : page.heroImageUrl
      ? { url: page.heroImageUrl, alt: page.title }
      : undefined;

  return buildPageMetadata({
    title: page.title,
    description,
    path: `/club/${slug}`,
    ogTitle: `${page.title} - KCVV Elewijt`,
    ogImage,
  });
}

export const revalidate = 3600;

export default async function DynamicClubPage({ params }: Props) {
  const { slug } = await params;
  const page = await fetchPage(slug);

  if (!page) return notFound();

  const body = (page.body ?? []) as PortableTextBlock[];

  return (
    <div className="bg-cream min-h-screen">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "De club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: page.title, url: `${SITE_CONFIG.siteUrl}/club/${slug}` },
        ])}
      />
      {/* Hero — headline = page.title, optional heroImage (typographic state
          when absent). No kicker: the up-link `<PageHero>` renders above
          itself already names the parent ("‹ De club"), so a "Club" kicker
          would say it twice (#2442 rule 6). `pb-12` reserves the rhythm
          before the full-bleed seam (StripedSeam carries no margin of its
          own). Top air is the up-link chip's own now (#2877) — this
          container keeps only its bottom padding. */}
      <PageContainer className="pb-12">
        <PageHero
          headline={page.title}
          image={page.heroImageUrl ?? undefined}
          upLink={{ href: "/club", label: "De club" }}
        />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Body — the Phase-5 editorial column (same vocabulary as
          /nieuws/[slug]). <ArticleBody> ships its own `bg-cream w-full`
          edge-to-edge shell + prose container + top/bottom padding, so it
          renders bare here (no max-w wrapper would box the cream into a band). */}
      {body.length > 0 ? (
        <ArticleBody className="article-body" content={body} />
      ) : null}

      {slug === MEMBERSHIP_INFO_SLUG ? (
        <CtaBand
          ariaLabel="Schrijf je in"
          heading="Klaar om lid te worden?"
          emphasis={{ text: "lid te worden", tone: "warm" }}
          lead="Schrijf je online in via ons inschrijvingsformulier — we nemen daarna contact met je op."
          buttonLabel={
            <>
              Schrijf je in <span aria-hidden="true">+</span>
            </>
          }
          href="/club/word-lid"
        />
      ) : null}
    </div>
  );
}
