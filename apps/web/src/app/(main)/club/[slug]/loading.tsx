/**
 * Club Page (Dynamic) — Loading Skeleton.
 *
 * Mirrors the page: band · cream `<PageHero>` → `<StripedSeam>` →
 * `<ArticleBody>`'s cream shell + prose column. The headline is the CMS
 * page's own `title` — data, not static copy — so per #2432 §2 this renders
 * no heading text at all (`<PageHeroSkeleton register="band" tone="cream">`,
 * bars only). `headline="Laden…"` was banned outright: a placeholder heading
 * is announced, indexed, and read aloud, which is worse than none.
 *
 * `size="default"` matches the real page's `<PageHero headline={page.title}
 * image={page.heroImageUrl} />` call (no `size` means the real card is
 * `padding="lg"`). No kicker either way — the real page dropped it in favour
 * of the up-link above it (#2442 rule 6, #2570). The up-link itself renders
 * real and unshimmered, same as `/club/contact`'s loading state: its label
 * ("De club") is fixed copy, not data, so per #2432 §2 it is not something
 * this route needs to hide behind a shimmer bar. The page's `heroImageUrl` is
 * optional per-CMS-page data the skeleton cannot predict — footprint (an
 * image slot that may or may not render) is the one thing #2432 §7
 * explicitly leaves unfixed site-wide, same as card counts elsewhere.
 */

import { PageHeroSkeleton } from "@/components/layout/PageHero";
import {
  PageContainer,
  StripedSeam,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";

export default function ClubPageLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <LoadingAnnouncement label="Pagina laden…" />

      <PageContainer className="pb-12">
        <PageHeroSkeleton
          register="band"
          tone="cream"
          size="default"
          upLink={{ href: "/club", label: "De club" }}
        />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Body skeleton — mirrors <ArticleBody>'s `bg-cream` shell + the
          `--container-prose` reading column. */}
      <div className="bg-cream w-full px-4 py-12 lg:px-0 lg:py-16">
        <div
          className="mx-auto w-full space-y-4"
          style={{ maxWidth: "var(--container-prose)" }}
        >
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="mt-6 h-48 w-full" />
          <Skeleton className="mt-6 h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    </div>
  );
}
