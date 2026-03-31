/**
 * Staff Member Detail Page
 * Displays individual staff member profiles from Sanity (slug = psdId)
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import Link from "next/link";
import { Network, CircleHelp } from "lucide-react";
import { RelatedArticlesSection } from "@/components/related/RelatedArticlesSection";
import { SanityArticleBody } from "@/components/article/SanityArticleBody/SanityArticleBody";

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
    if (!member)
      return { title: "Stafmedewerker niet gevonden | KCVV Elewijt" };

    const fullName = `${member.firstName} ${member.lastName}`.trim() || "Staf";
    const description = "KCVV Elewijt stafmedewerker";

    return {
      title: `${fullName} | KCVV Elewijt`,
      description,
      openGraph: {
        title: fullName,
        description,
        type: "profile",
        firstName: member.firstName,
        lastName: member.lastName,
        images: member.imageUrl
          ? [{ url: member.imageUrl, alt: fullName }]
          : undefined,
      },
    };
  } catch {
    return { title: "Stafmedewerker niet gevonden | KCVV Elewijt" };
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

  return (
    <>
      {/* Hero section */}
      <section className="bg-gradient-to-br from-kcvv-gray-light to-white">
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col sm:flex-row items-center sm:items-start gap-8">
          {/* Photo */}
          {member.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.imageUrl}
              alt={fullName}
              className="w-40 h-40 rounded-full object-cover object-top shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="w-40 h-40 rounded-full bg-kcvv-gray/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-20 h-20 text-kcvv-gray/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}

          {/* Info */}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-kcvv-gray-dark">
              <span className="font-semibold">{member.firstName}</span>{" "}
              <span className="font-light">{member.lastName}</span>
            </h1>

            {/* Contact info */}
            {(member.email || member.phone) && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-2 text-kcvv-gray hover:text-kcvv-green-bright transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm">{member.email}</span>
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="inline-flex items-center gap-2 text-kcvv-gray hover:text-kcvv-green-bright transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"
                      />
                    </svg>
                    <span className="text-sm">{member.phone}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bio */}
      {member.bio && member.bio.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-8">
          <SanityArticleBody content={member.bio as PortableTextBlock[]} />
        </section>
      )}

      {/* Organigram positions */}
      {member.organigramPositions.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold text-kcvv-gray-dark flex items-center gap-2 mb-4">
            <Network className="w-5 h-5" aria-hidden="true" />
            Posities in het organigram
          </h2>
          <ul className="space-y-2">
            {member.organigramPositions.map((pos) => (
              <li
                key={pos._id}
                className="flex items-center gap-3 rounded-lg border border-kcvv-gray-light/50 bg-white px-4 py-3"
              >
                {pos.roleCode && (
                  <span className="inline-flex items-center justify-center rounded bg-kcvv-green-bright/10 px-2 py-0.5 text-xs font-semibold text-kcvv-green-bright">
                    {pos.roleCode}
                  </span>
                )}
                <span className="font-medium text-kcvv-gray-dark">
                  {pos.title}
                </span>
                {pos.department && (
                  <span className="ml-auto text-xs text-kcvv-gray">
                    {pos.department}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Responsibility paths */}
      {member.responsibilityPaths.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold text-kcvv-gray-dark flex items-center gap-2 mb-4">
            <CircleHelp className="w-5 h-5" aria-hidden="true" />
            Verantwoordelijkheden
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {member.responsibilityPaths.map((path) => (
              <Link
                key={path.slug}
                href={`/hulp?pad=${path.slug}`}
                className="flex items-start gap-3 rounded-lg border border-kcvv-gray-light/50 bg-white px-4 py-3 transition-colors hover:border-kcvv-green-bright/30 hover:bg-kcvv-green-bright/5"
              >
                <div className="min-w-0">
                  <span className="font-medium text-kcvv-gray-dark">
                    {path.title}
                  </span>
                  {path.category && (
                    <span className="mt-0.5 block text-xs text-kcvv-gray">
                      {path.category}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <RelatedArticlesSection
        articles={relatedArticles}
        pageType="staff"
        pageSlug={slug}
        className="max-w-4xl mx-auto px-4 pb-8"
      />
    </>
  );
}

export const revalidate = 3600;
