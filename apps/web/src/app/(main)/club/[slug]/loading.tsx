/**
 * Club Page (Dynamic) — Loading Skeleton
 * Mirrors the page: compact <PageHero> → <StripedSeam> → <ArticleBody>'s
 * cream shell + prose column.
 */

import { PageHero } from "@/components/layout/PageHero";
import { PageContainer, StripedSeam } from "@/components/design-system";

export default function ClubPageLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <PageContainer className="pt-10 pb-12">
        <PageHero kicker="Club" headline="Laden…" size="compact" />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Body skeleton — mirrors <ArticleBody>'s `bg-cream` shell + the
          `--container-prose` reading column. */}
      <div className="bg-cream w-full px-4 py-12 lg:px-0 lg:py-16">
        <div
          className="mx-auto w-full animate-pulse space-y-4"
          style={{ maxWidth: "var(--container-prose)" }}
        >
          <div className="bg-cream-soft h-5 w-full rounded" />
          <div className="bg-cream-soft h-5 w-full rounded" />
          <div className="bg-cream-soft h-5 w-4/5 rounded" />
          <div className="bg-cream-soft mt-6 h-48 w-full rounded-sm" />
          <div className="bg-cream-soft mt-6 h-5 w-full rounded" />
          <div className="bg-cream-soft h-5 w-full rounded" />
          <div className="bg-cream-soft h-5 w-2/3 rounded" />
        </div>
      </div>
    </div>
  );
}
