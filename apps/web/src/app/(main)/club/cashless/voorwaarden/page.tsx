import type { Metadata } from "next";
import DynamicClubPage, {
  generateMetadata as clubPageMetadata,
} from "../../[slug]/page";

/**
 * `/club/cashless/voorwaarden` — the cashless card's terms (#3569).
 *
 * The `[slug]` route is one segment, so a two-segment path can't reach it. The
 * CMS `page` document stores its whole path as the slug (`cashless/voorwaarden`)
 * — `PageRepository.findBySlug`, the sitemap, `/inhoud` and the revalidate
 * webhook all build `/club/${slug}` already — and this static folder hands
 * that slug to the `[slug]` renderer, so the page looks and 404s like any
 * other CMS club page. `/club/cashless` itself still resolves to `[slug]`:
 * this folder has no `page.tsx` of its own one level up.
 */
const SLUG = "cashless/voorwaarden";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return clubPageMetadata({ params: Promise.resolve({ slug: SLUG }) });
}

export default function CashlessTermsPage() {
  return DynamicClubPage({ params: Promise.resolve({ slug: SLUG }) });
}
