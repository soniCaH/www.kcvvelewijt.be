import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/constants";
import { notFound } from "next/navigation";
import { Effect } from "effect";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { PageRepository } from "@/lib/repositories/page.repository";
import { PageHero } from "@/components/design-system/PageHero";
import { SanityArticleBody } from "@/components/article/SanityArticleBody/SanityArticleBody";

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

  const ogImage = page.ogImageUrl
    ? { url: page.ogImageUrl, alt: page.title }
    : page.heroImageUrl
      ? { url: page.heroImageUrl, alt: page.title }
      : DEFAULT_OG_IMAGE;

  return {
    title: `${page.title} | KCVV Elewijt`,
    description: page.metaDescription ?? undefined,
    openGraph: {
      title: `${page.title} - KCVV Elewijt`,
      description: page.metaDescription ?? undefined,
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

  return (
    <>
      <PageHero
        image={page.heroImageUrl ?? undefined}
        imageAlt={page.title}
        label="Club"
        headline={page.title}
        body=""
        size="compact"
      />
      <div className="max-w-inner-lg content mx-auto px-4 pt-8 pb-[calc(2rem+var(--footer-diagonal))]">
        <SanityArticleBody content={(page.body ?? []) as PortableTextBlock[]} />
      </div>
    </>
  );
}
