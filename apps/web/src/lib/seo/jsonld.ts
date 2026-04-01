import type {
  MergeLeafTypes,
  NewsArticle,
  OrganizationLeaf,
  SportsClubLeaf,
  WithContext,
} from "schema-dts";

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
