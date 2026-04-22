/**
 * Staff Member Detail Page
 * Displays individual staff member profiles from Sanity (slug = psdId)
 */

import { Effect } from "effect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { runPromise } from "@/lib/effect/runtime";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { StaffRepository } from "@/lib/repositories/staff.repository";
import { ArticleRepository } from "@/lib/repositories/article.repository";
import Link from "next/link";
import { Network, CircleHelp } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd, buildPersonJsonLd } from "@/lib/seo/jsonld";
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
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: SITE_CONFIG.siteUrl },
          { name: "Club", url: `${SITE_CONFIG.siteUrl}/club` },
          { name: "Staf", url: `${SITE_CONFIG.siteUrl}/club/organigram` },
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
      {/* Hero section */}
      <section className="from-kcvv-gray-light bg-gradient-to-br to-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-12 sm:flex-row sm:items-start">
          {/* Photo */}
          {member.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.imageUrl}
              alt={fullName}
              className="h-40 w-40 flex-shrink-0 rounded-full object-cover object-top shadow-lg"
            />
          ) : (
            <div className="bg-kcvv-gray/20 flex h-40 w-40 flex-shrink-0 items-center justify-center rounded-full">
              <svg
                className="text-kcvv-gray/50 h-20 w-20"
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
            <h1 className="text-kcvv-gray-dark text-3xl font-bold sm:text-4xl">
              <span className="font-semibold">{member.firstName}</span>{" "}
              <span className="font-light">{member.lastName}</span>
            </h1>

            {/* Contact info */}
            {(member.email || member.phone) && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="text-kcvv-gray hover:text-kcvv-green-bright inline-flex items-center gap-2 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
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
                    className="text-kcvv-gray hover:text-kcvv-green-bright inline-flex items-center gap-2 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
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
        <section className="mx-auto max-w-4xl px-4 py-8">
          <SanityArticleBody content={member.bio as PortableTextBlock[]} />
        </section>
      )}

      {/* Organigram positions */}
      {member.organigramPositions.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="text-kcvv-gray-dark mb-4 flex items-center gap-2 text-xl font-semibold">
            <Network className="h-5 w-5" aria-hidden="true" />
            Posities in het organigram
          </h2>
          <ul className="space-y-2">
            {member.organigramPositions.map((pos) => (
              <li
                key={pos._id}
                className="border-kcvv-gray-light/50 flex items-center gap-3 rounded-lg border bg-white px-4 py-3"
              >
                {pos.roleCode && (
                  <span className="bg-kcvv-green-bright/10 text-kcvv-green-bright inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-semibold">
                    {pos.roleCode}
                  </span>
                )}
                <span className="text-kcvv-gray-dark font-medium">
                  {pos.title}
                </span>
                {pos.department && (
                  <span className="text-kcvv-gray ml-auto text-xs">
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
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="text-kcvv-gray-dark mb-4 flex items-center gap-2 text-xl font-semibold">
            <CircleHelp className="h-5 w-5" aria-hidden="true" />
            Verantwoordelijkheden
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {member.responsibilityPaths.map((path) => (
              <Link
                key={path.slug}
                href={`/hulp?pad=${path.slug}`}
                className="border-kcvv-gray-light/50 hover:border-kcvv-green-bright/30 hover:bg-kcvv-green-bright/5 flex items-start gap-3 rounded-lg border bg-white px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <span className="text-kcvv-gray-dark font-medium">
                    {path.title}
                  </span>
                  {path.category && (
                    <span className="text-kcvv-gray mt-0.5 block text-xs">
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
        className="mx-auto max-w-4xl px-4 pb-8"
      />
    </>
  );
}

export const revalidate = 3600;
