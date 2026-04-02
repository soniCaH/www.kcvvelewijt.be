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

  return {
    title: `${page.title} | KCVV Elewijt`,
    openGraph: {
      title: `${page.title} - KCVV Elewijt`,
      type: "website",
      images: [DEFAULT_OG_IMAGE],
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
      <div className="mx-auto max-w-inner-lg px-4 py-8 content">
        <SanityArticleBody content={(page.body ?? []) as PortableTextBlock[]} />
      </div>
    </>
  );
}
