import type { Metadata } from "next";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";

/** Open Graph image — subset of Next's OG image object we actually use. */
export interface OgImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface PageMetadataInput {
  /** Page `<title>` — passed through verbatim (root layout applies its template). */
  title: string;
  description: string;
  /** Site-relative path, e.g. `/club/contact`. Drives canonical + og:url. */
  path: string;
  /** Open Graph title — defaults to {@link PageMetadataInput.title}. */
  ogTitle?: string;
  /** Open Graph description — defaults to {@link PageMetadataInput.description}. */
  ogDescription?: string;
  /** Open Graph image — defaults to {@link DEFAULT_OG_IMAGE}. */
  ogImage?: OgImage;
  keywords?: string[];
}

/**
 * Build static-page `Metadata` with the SEO hygiene every indexable page needs:
 * an absolute `alternates.canonical` from `path`, and an `openGraph` block that
 * resolves the image to a single `DEFAULT_OG_IMAGE` fallback. Consolidates the
 * per-page hand-rolled canonical + OG-image boilerplate (#2209).
 *
 * Not for noindex routes — they must omit canonical (see `canonical-urls.test`).
 */
export function buildPageMetadata({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  ogImage,
  keywords,
}: PageMetadataInput): Metadata {
  const canonical = `${SITE_CONFIG.siteUrl}${path}`;
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical },
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      type: "website",
      url: canonical,
      images: [ogImage ?? DEFAULT_OG_IMAGE],
    },
  };
}
