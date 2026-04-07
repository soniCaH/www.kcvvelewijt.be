import type {
  BreadcrumbList,
  FAQPage,
  MergeLeafTypes,
  NewsArticle,
  OrganizationLeaf,
  SportsClubLeaf,
  WithContext,
} from "schema-dts";

/** Loose JSON-LD document type — allows arbitrary Schema.org properties */
interface JsonLdDocument {
  "@context": "https://schema.org";
  "@type": string;
  [key: string]: unknown;
}

import { SITE_CONFIG } from "@/lib/constants";

const LOGO_URL = `${SITE_CONFIG.siteUrl}/icon.png`;

/**
 * schema-dts models SportsClub under LocalBusiness, not SportsOrganization,
 * so `sport` is absent from SportsClubLeaf. Google Rich Results accept it
 * on SportsClub, so we add it via intersection.
 *
 * MergeLeafTypes produces `@type: ["SportsClub", "Organization"]` — the
 * JSON-LD multi-type array that Google explicitly supports.
 */
type SportsClubOrganization = MergeLeafTypes<
  [SportsClubLeaf, OrganizationLeaf]
> & { sport?: string };

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export type NonEmptyArray<T> = [T, ...T[]];

export function buildBreadcrumbJsonLd(
  items: NonEmptyArray<BreadcrumbItem>,
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface NewsArticleInput {
  headline: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
  url: string;
}

export function buildSportsClubJsonLd(): WithContext<SportsClubOrganization> {
  return {
    "@context": "https://schema.org",
    "@type": ["SportsClub", "Organization"],
    name: SITE_CONFIG.title,
    url: SITE_CONFIG.siteUrl,
    logo: LOGO_URL,
    foundingDate: "1924",
    sameAs: ["https://www.facebook.com/KCVVElewijt"],
    sport: "Soccer",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Driesstraat 39",
      addressLocality: "Elewijt",
      postalCode: "1982",
      addressCountry: "BE",
    },
  };
}

export function buildNewsArticleJsonLd(
  input: NewsArticleInput,
): WithContext<NewsArticle> {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.headline,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: {
      "@type": "Organization",
      name: input.author ?? SITE_CONFIG.title,
    },
    image: input.image,
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.title,
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
      },
    },
    url: input.url,
  };
}

export interface PersonInput {
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
}

export function buildPersonJsonLd(input: PersonInput): JsonLdDocument {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: input.url,
    image: input.image,
    jobTitle: input.jobTitle,
    affiliation: {
      "@type": "Organization",
      name: SITE_CONFIG.title,
    },
  };
}

export interface SportsTeamInput {
  name: string;
  url: string;
}

export function buildSportsTeamJsonLd(input: SportsTeamInput): JsonLdDocument {
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: input.name,
    url: input.url,
    sport: "Soccer",
    memberOf: {
      "@type": "Organization",
      name: SITE_CONFIG.title,
    },
  };
}

export interface SportsEventInput {
  name: string;
  startDate: string;
  homeTeamName: string;
  awayTeamName: string;
  status: "scheduled" | "finished" | "forfeited" | "postponed" | "stopped";
  url: string;
  venue?: string;
}

function mapEventStatus(status: SportsEventInput["status"]): string {
  switch (status) {
    case "postponed":
    case "stopped":
      return "https://schema.org/EventPostponed";
    case "scheduled":
    case "finished":
    case "forfeited":
      return "https://schema.org/EventScheduled";
  }
}

export interface FAQEntry {
  /** The user-facing question */
  question: string;
  /** Plain-text answer (steps joined into a single paragraph) */
  answer: string;
}

/**
 * Build a Schema.org FAQPage document for the /hulp page so search
 * engines can surface KCVV's responsibility paths as FAQ rich results.
 */
export function buildFAQPageJsonLd(
  entries: ReadonlyArray<FAQEntry>,
): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question" as const,
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: entry.answer,
      },
    })),
  };
}

export function buildSportsEventJsonLd(
  input: SportsEventInput,
): JsonLdDocument {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: input.name,
    startDate: input.startDate,
    url: input.url,
    eventStatus: mapEventStatus(input.status),
    homeTeam: {
      "@type": "SportsTeam",
      name: input.homeTeamName,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: input.awayTeamName,
    },
    ...(input.venue
      ? {
          location: {
            "@type": "Place" as const,
            name: input.venue,
          },
        }
      : {}),
  };
}
