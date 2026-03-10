import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Effect } from "effect";
import { runPromise } from "@/lib/effect/runtime";
import { SanityService } from "@/lib/effect/services/SanityService";
import { PageTitle } from "@/components/layout";
import { SanityArticleBody } from "@/components/article/SanityArticleBody/SanityArticleBody";
import type { PortableTextBlock } from "@portabletext/react";

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchPage(slug: string) {
  return runPromise(
    Effect.gen(function* () {
      const sanity = yield* SanityService;
      return yield* sanity.getPage(slug);
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
      <PageTitle title={page.title} />
      <div className="mx-auto max-w-inner-lg px-4 py-8 content">
        <SanityArticleBody content={(page.body ?? []) as PortableTextBlock[]} />
      </div>
    </>
  );
}
