import { cn } from "@/lib/utils/cn";
import {
  PageContainer,
  type PageContainerWidth,
} from "@/components/design-system/PageContainer";
import { TapedCard } from "@/components/design-system/TapedCard";
import { DottedDivider } from "@/components/design-system/Divider";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  UpLink,
  UP_LINK_TOP_AIR,
  type UpLinkProps,
} from "@/components/design-system/UpLink";
import type { PageHeroRegister, PageHeroSize, PageHeroTone } from "./PageHero";

/**
 * `<PageHeroSkeleton>` — the shared opening's loading footprint.
 *
 * The register hoisted the opening's geometry out of nine call sites; without
 * this, the loading path kept it. Seven `loading.tsx` files each drew their own
 * version of the same three bars — four different constructions of the kicker →
 * headline gap alone (`mt-2`, `mt-3`, `gap-3`, and `gap-4`), none of which
 * agreed with `<PageHero>`'s real `mt-2` / `mt-4`. A skeleton that disagrees
 * with the thing it stands in for is a layout shift by construction.
 *
 * Bar widths are fixed rather than per-route: a placeholder's job is to hold the
 * footprint, and a route-specific width is a value that drifts for nothing.
 *
 * `register="band"` · `tone="cream"` composes the real `<TapedCard>` shell
 * (#2432 §7 — a skeleton composes the real container, never re-draws its
 * chrome) with shimmer bars inside, rather than the real `<PageHero>`. Its
 * two callers (`/club`, `/club/[slug]`) either have a data-driven headline
 * (`/club/[slug]`'s CMS title) or must never risk showing another page's real
 * heading while leaking into a sibling segment (`/club`'s index) — #2432 §2
 * bans a skeleton from ever rendering a real `<h1>` it cannot be sure is
 * correct, so this register renders no heading text at all, static or not.
 * `size` and `lead` must still match the real `<PageHero>` call each stands
 * in for — a `size="default"` hero with a lead paragraph is a taller card
 * than a `size="compact"` one without, and a mismatch reflows the seam and
 * everything below it on swap.
 */

export interface PageHeroSkeletonProps {
  /** Matches the opening being stood in for. */
  register?: PageHeroRegister;
  /** Matches the field the opening sits on — drives the bar fill. */
  tone?: PageHeroTone;
  /**
   * Band · dark only, mirroring `<PageHero>`'s own `width`.
   */
  width?: PageContainerWidth;
  /** Draw the photo column. Band · dark only. */
  image?: boolean;
  /** Draw the lead bar. */
  lead?: boolean;
  /**
   * Draw the kicker bar. Default `true` — set `false` when the real
   * `<PageHero>` this stands in for renders no kicker (#2442 rule 6, e.g.
   * `/club/[slug]`, the board routes): the real hero is one bar shorter, so
   * the skeleton must be too, or the page reflows on swap-in.
   */
  kicker?: boolean;
  /**
   * The up-link this loading state stands in for — real and unshimmered,
   * because its label is a fixed per-route fact, not data (the same reason
   * the real `<PageHero kicker=…>` copy already renders unshimmered on this
   * component's two existing callers). Omit on a route with no up-link.
   */
  upLink?: Pick<UpLinkProps, "href" | "label">;
  /**
   * A shimmer placeholder for the up-link instead of the real thing — the
   * one route (`/ploegen/[slug]/wedstrijden`) whose up-link label *is* data
   * (the team display name) and so cannot render real before the fetch
   * resolves. Ignored when `upLink` is also passed.
   */
  upLinkShimmer?: boolean;
  /**
   * Band · cream only, mirroring `<PageHero>`'s own `size` — drives the
   * `<TapedCard>` padding (`"compact"` → `md`, `"default"` → `lg`).
   */
  size?: PageHeroSize;
  className?: string;
}

/** Kicker → headline → lead, at `<PageHero>`'s own rhythm. */
function OpeningBars({
  tone,
  lead,
  kicker,
}: {
  tone: PageHeroTone;
  lead: boolean;
  kicker: boolean;
}) {
  return (
    <>
      {kicker ? <Skeleton tone={tone} className="h-3 w-44" /> : null}
      <Skeleton
        tone={tone}
        className={cn(kicker ? "mt-2" : undefined, "h-12 w-2/3 max-w-full")}
      />
      {lead ? (
        <Skeleton tone={tone} className="mt-4 h-5 w-1/2 max-w-full" />
      ) : null}
    </>
  );
}

/** The up-link footprint — real (unshimmered) when the label is fixed copy,
 *  a shimmer bar the same size when it is data. */
function UpLinkSlot({
  upLink,
  shimmer,
  tone,
}: {
  upLink: Pick<UpLinkProps, "href" | "label"> | undefined;
  shimmer: boolean | undefined;
  tone: "ink" | "cream";
}) {
  if (upLink) {
    return (
      <UpLink
        href={upLink.href}
        label={upLink.label}
        tone={tone}
        className="mb-6"
      />
    );
  }
  if (shimmer) {
    // Matches <UpLink>'s own footprint: border-2 + py-2 around an 11px line
    // box ≈ 31px tall, chip-width rather than full-bleed. Also matches its
    // top air (#2877) via `UP_LINK_TOP_AIR[tone]` — no conditional here on
    // which tone gets air, so this file can't drift out of step with
    // `UpLink`'s own `TONE_CLASS` about which tone that is. The one route
    // that takes this shimmer path (`/ploegen/[slug]/wedstrijden`, whose
    // up-link label is the team display name) doesn't jump when the real
    // chip replaces it.
    return (
      <Skeleton
        tone={tone === "cream" ? "dark" : "cream"}
        className={cn(UP_LINK_TOP_AIR[tone], "mb-6 h-[31px] w-28")}
      />
    );
  }
  return null;
}

export function PageHeroSkeleton({
  register = "band",
  tone = "cream",
  width,
  image = false,
  lead = false,
  kicker = true,
  upLink,
  upLinkShimmer,
  size = "compact",
  className,
}: PageHeroSkeletonProps) {
  if (register === "minimal") {
    return (
      <>
        {/* Outside the hidden subtree — when `upLink` is set this is a real,
            focusable <a>, and aria-hidden must never contain one (#2799
            review). Margin collapse through the bar-only div below keeps
            the rendered gap identical to when this sat inside it. */}
        <UpLinkSlot
          upLink={upLink}
          shimmer={upLinkShimmer}
          tone={tone === "dark" ? "cream" : "ink"}
        />
        <div aria-hidden="true" className={cn("mb-10", className)}>
          <OpeningBars tone={tone} lead={lead} kicker={kicker} />
        </div>
      </>
    );
  }

  if (tone === "cream") {
    return (
      <>
        {/* Outside the hidden subtree — see the minimal register above. */}
        <UpLinkSlot upLink={upLink} shimmer={upLinkShimmer} tone="ink" />
        <div aria-hidden="true" data-testid="page-hero-skeleton">
          <TapedCard
            bg="cream"
            padding={size === "compact" ? "md" : "lg"}
            tape={{ color: "warm", position: "left", length: "lg" }}
            className={className}
          >
            <OpeningBars tone="cream" lead={lead} kicker={kicker} />
            {/* The real typographic (no-image) state always shows this rule —
                band · cream never carries an image — so the skeleton always
                reserves the space for it too. */}
            <div className="mt-4 w-[120px]">
              <DottedDivider />
            </div>
          </TapedCard>
        </div>
      </>
    );
  }

  return (
    // Not aria-hidden itself — when `upLink` is set, `<UpLinkSlot>` below is
    // a real focusable <a> and must stay outside any aria-hidden subtree
    // (#2799 review). Only the shimmer grid is hidden now, individually.
    <header className={cn("bg-jersey-deep-dark", className)}>
      <PageContainer
        width={width}
        className="flex flex-col gap-6 py-14 sm:py-20"
      >
        <UpLinkSlot upLink={upLink} shimmer={upLinkShimmer} tone="cream" />
        <div
          aria-hidden="true"
          className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"
        >
          <div>
            <OpeningBars tone="dark" lead={lead} kicker={kicker} />
          </div>
          {image ? (
            <div className="border-ink bg-cream-soft shadow-paper-md aspect-[3/2] w-full border-2 md:w-[24rem]" />
          ) : null}
        </div>
      </PageContainer>
    </header>
  );
}
