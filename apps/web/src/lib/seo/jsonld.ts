import { SITE_CONFIG } from "@/lib/constants";

const LOGO_URL = `${SITE_CONFIG.siteUrl}/icon.png`;

interface SportsClubJsonLd {
  "@context": string;
  "@type": string[];
  name: string;
  url: string;
  logo: string;
  foundingDate: string;
  sameAs: string[];
  sport: string;
  address: PostalAddress;
}

interface PostalAddress {
  "@type": "PostalAddress";
  streetAddress: string;
  addressLocality: string;
  postalCode: string;
  addressCountry: string;
}

interface PublisherJsonLd {
  "@type": "Organization";
  name: string;
  logo: {
    "@type": "ImageObject";
    url: string;
  };
}

interface NewsArticleJsonLd {
  "@context": string;
  "@type": "NewsArticle";
  headline: string;
  datePublished: string;
  dateModified?: string;
  author: { "@type": "Organization"; name: string };
  image?: string;
  publisher: PublisherJsonLd;
  url: string;
}

export interface NewsArticleInput {
  headline: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
  url: string;
}

export function buildSportsClubJsonLd(): SportsClubJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["SportsClub", "Organization"],
    name: SITE_CONFIG.title,
    url: SITE_CONFIG.siteUrl,
    logo: LOGO_URL,
    foundingDate: "1924",
    sameAs: ["https://www.facebook.com/KCVVEleworthy"],
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
): NewsArticleJsonLd {
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
