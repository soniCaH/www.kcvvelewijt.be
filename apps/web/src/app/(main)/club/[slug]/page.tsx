import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { notFound } from "next/navigation";
import { Effect } from "effect";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { PageRepository } from "@/lib/repositories/page.repository";
import { PageHero } from "@/components/layout/PageHero";
import { ArticleBody } from "@/components/article/ArticleBody";
import { PageContainer, StripedSeam } from "@/components/design-system";

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchPage(slug: string) {
  return runPromise(
    Effect.gen(function* () {
      const repo = yield* PageRepository;
      return yield* repo.findBySlug(slug);
    }),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) return {};

  const description =
    page.metaDescription?.trim() || `${page.title} — KCVV Elewijt`;
  const ogImage = page.ogImageUrl
    ? { url: page.ogImageUrl, alt: page.title }
    : page.heroImageUrl
      ? { url: page.heroImageUrl, alt: page.title }
      : DEFAULT_OG_IMAGE;

  return {
    title: `${page.title} | KCVV Elewijt`,
    description,
    openGraph: {
      title: `${page.title} - KCVV Elewijt`,
      description,
      type: "website",
      images: [ogImage],
    },
  };
}

export const revalidate = 3600;

export default async function DynamicClubPage({ params }: Props) {
  const { slug } = await params;
  const page = await fetchPage(slug);

  if (!page) return notFound();

  const body = (page.body ?? []) as PortableTextBlock[];

  return (
    <div className="bg-cream min-h-screen">
      {/* Hero — kicker "Club", headline = page.title, optional heroImage
          (typographic state when absent). `pb-12` reserves the rhythm before
          the full-bleed seam (StripedSeam carries no margin of its own). */}
      <PageContainer className="pt-10 pb-12">
        <PageHero
          kicker="Club"
          headline={page.title}
          image={page.heroImageUrl ?? undefined}
          imageAlt={page.title}
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
    </div>
  );
}
