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
 * Default width (1040). Canonical paper-register chrome only — `border-2
 * border-ink`, square corners, `paper-edge`/`cream` fills, pulse bars.
 */

import { PageContainer, StripedSeam } from "@/components/design-system";

/** A paper TapedCard footprint (border-2 ink + offset shadow). */
function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border-ink bg-cream shadow-paper-sm space-y-3 border-2 p-5 ${className}`}
    >
      <div className="bg-paper-edge h-3 w-24" />
      <div className="bg-paper-edge h-4 w-2/3" />
      <div className="bg-paper-edge h-3 w-4/5" />
    </div>
  );
}

export default function ContactLoading() {
  return (
    <div className="bg-cream min-h-screen">
      <span
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="sr-only"
      >
        Contactpagina laden...
      </span>

      {/* PageHero — kicker + headline + lead in a paper card. */}
      <PageContainer className="pt-10 pb-12">
        <div className="border-ink bg-cream shadow-paper-md space-y-4 border-2 p-6 motion-safe:animate-pulse md:p-8">
          <div className="bg-paper-edge h-3 w-20" />
          <div className="bg-paper-edge h-10 w-1/2" />
          <div className="bg-paper-edge h-4 w-3/4" />
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Clubgegevens card + map — 2-col. */}
      <PageContainer className="py-12 motion-safe:animate-pulse">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="border-ink bg-cream shadow-paper-sm space-y-4 border-2 p-6 md:p-8">
            <div className="bg-paper-edge h-8 w-48" />
            <div className="bg-paper-edge h-4 w-2/3" />
            <div className="bg-paper-edge h-4 w-1/2" />
            <div className="bg-paper-edge h-3 w-40" />
          </div>
          <div className="border-ink bg-cream-soft shadow-paper-sm min-h-[280px] border-2" />
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Contacteer ons — 3-col contact-card grid. */}
      <PageContainer className="py-12 motion-safe:animate-pulse">
        <div className="bg-paper-edge mb-6 h-8 w-56" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </PageContainer>

      <StripedSeam colorPair="ink-cream" height="md" />

      {/* Kom naar ons — 2-col venue card grid. */}
      <PageContainer className="py-12 motion-safe:animate-pulse">
        <div className="bg-paper-edge mb-6 h-8 w-56" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
