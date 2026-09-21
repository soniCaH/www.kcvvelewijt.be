/**
 * Contact Page — Loading Skeleton.
 *
 * Mirrors `ContactPage` (`/club/contact`):
 *   <PageHero> (kicker + headline + lead)
 *     → <StripedSeam>
 *     → Clubgegevens (paper card) + <MapEmbed>   ← 2-col
 *     → <StripedSeam>
 *     → "Contacteer ons." contact-card grid       ← 3-col
 *     → <StripedSeam>
 *     → "Kom naar ons." venue card grid           ← 2-col
 *
 * Default width (1040). The hero's kicker/headline/lead are fixed copy, not
 * data, so per #2432 §2 this reuses the real `<PageHero>` unshimmered.
 */

import {
  PageContainer,
  StripedSeam,
  Skeleton,
  LoadingAnnouncement,
} from "@/components/design-system";
import { PageHero } from "@/components/layout/PageHero";
import {
  CONTACT_HEADLINE,
  CONTACT_LEAD,
} from "@/components/club/ContactPage/contact-copy";

/** A paper TapedCard footprint (border-2 ink + offset shadow). */
function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border-ink bg-cream shadow-paper-sm space-y-3 border-2 p-5 ${className}`}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export default function ContactLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <LoadingAnnouncement label="Contactpagina laden…" />

      {/* PageHero + up-link — real, unshimmered (fixed copy / a fixed
          per-route fact, neither is data). */}
      <PageContainer className="pb-12">
        <PageHero
          headline={CONTACT_HEADLINE}
          lead={CONTACT_LEAD}
          upLink={{ href: "/club", label: "De club" }}
        />
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Clubgegevens card + map — 2-col. */}
      <PageContainer className="py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-ink bg-cream shadow-paper-sm space-y-4 border-2 p-6 md:p-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="border-ink bg-cream-soft shadow-paper-sm min-h-[280px] border-2" />
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Contacteer ons — 3-col contact-card grid. */}
      <PageContainer className="py-12 sm:py-16">
        <Skeleton className="mb-6 h-8 w-56" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Kom naar ons — 2-col venue card grid. */}
      <PageContainer className="py-12 sm:py-16">
        <Skeleton className="mb-6 h-8 w-56" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
