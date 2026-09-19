"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretLeft } from "@/lib/icons.redesign";
import { PRESS_DOWN_CLASSES } from "../press-down";
import { trackEvent } from "@/lib/analytics/track-event";

export type UpLinkTone = "ink" | "cream";

export interface UpLinkProps {
  /** The structural parent's route — a fixed per-route fact, never derived
   *  from referrer or history (#2428). */
  href: string;
  /** The bare parent name, e.g. "Nieuws" — never "Terug naar …" (#2428). */
  label: string;
  /**
   * `ink` (default) — the paper chip on a cream/paper surface. `cream` — the
   * tone-swapped chip rendered *inside* a dark-register opening band, where
   * ink is invisible and a cream-on-cream offset shadow would double the
   * edge, so the shadow goes warm instead (#2442 rule 2).
   */
  tone?: UpLinkTone;
  className?: string;
}

// Plain string concatenation, not `cn()` (tailwind-merge): combining the
// `text-label` custom font-size token with a `text-ink` / `text-cream`
// colour in the same twMerge call gets the size silently dropped — twMerge
// files unrecognised size tokens under its text-colour group and keeps only
// the last one (#2769 / [[reference_twmerge_drops_custom_text_tokens]]).
// `<MonoLabel>` sidesteps the same trap the same way.
//
// Each tone also carries its own `focus-visible:outline-*` colour — jersey-
// deep against the cream/paper surface, warm against `jersey-deep-dark`
// (the UA default outline is invisible there, and this chip is now the
// first focusable element after the header on all 17 routes).
//
// `ink` also carries the chip's own top air (#2877): 48px at base, 64px from
// `lg` up. Every route used to supply this itself via its own container
// padding, and the values drifted (32px / 48px / 48→64px / 56→80px, plus
// further undocumented values on routes PageHero also opens, e.g. `pt-10`,
// `pt-8`, `pt-12 sm:pt-16`) because #2570 mounted the chip inside whatever
// container each route already had. The shared opening already owns the gap
// *below* itself for exactly this reason (see `<PageHero>`'s own `mb-10`
// comment) — this is the same move, one line higher up. `cream` gains none:
// it only ever renders inside a dark opening band, whose own padding is
// already the air.
//
// Exported as a map, not a string, so `<PageHeroSkeleton>`'s shimmer up-link
// (the one route whose label is data, not fixed copy) asks this file which
// tone gets air instead of holding its own copy of that rule (#2877 review
// round 2): a bare string would still let the two files disagree about
// *which* tone the value belongs to, even while sharing the value itself.
export const UP_LINK_TOP_AIR: Record<UpLinkTone, string> = {
  ink: "mt-12 lg:mt-16",
  cream: "",
};

const TONE_CLASS: Record<UpLinkTone, string> = {
  ink: `${UP_LINK_TOP_AIR.ink} border-ink bg-cream text-ink shadow-paper-sm focus-visible:outline-jersey-deep`,
  cream:
    "border-cream bg-transparent text-cream shadow-[4px_4px_0_0_var(--color-warm)] focus-visible:outline-warm",
};

// Keyboard focus gets the same pressed-into-the-shadow state as hover, but
// ungated by `motion-safe:` — parity with <EditorialHubCard>: the translate
// is how a keyboard user locates the focused chip, so reduced-motion must
// not remove it (only the mouse-hover version is optional motion).
const FOCUS_VISIBLE_CLASSES =
  "focus-visible:translate-x-1 focus-visible:translate-y-1 focus-visible:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * `<UpLink>` — the one up-link every detail route renders to its structural
 * parent (#2428/#2442). A bordered paper chip, not a bare text link: it
 * carries its own background (survives on any surface, including the dark
 * register) and reaches a 30px tap target from `border-2` + `py-2` around an
 * 11px `--text-label` line box, with no dependency on the type ramp.
 *
 * Placement is `<PageHero>`'s own job on the ten routes it opens (above the
 * opening for `band`/`cream` and `minimal`, inside the field for `band`/
 * `dark`) and `<UltrasHero>`'s for `/club/ultras`; the seven routes with a
 * bespoke opening (`MatchHero`, `PlayerHero`, `StaffHero`, `TeamHero`,
 * `EditorialHero`, `EventHero` — #2428 §5's sanctioned departures) render
 * this component directly, page-side. Always the container's left edge —
 * the chip never adopts the opening's own alignment (`<EventHero>` is
 * centred; the chip still isn't).
 *
 * **The chip owns its own top air (#2877).** `tone="ink"` carries `mt-12
 * lg:mt-16` (48px / 64px); `tone="cream"` carries none. Before this, no
 * vertical spacing lived here at all — whichever container hosted the chip
 * supplied the gap above it, and every hand-rendered route disagreed (32px /
 * 48px flat / 48→64px / 56→80px, plus further undocumented values on routes
 * `<PageHero>` also opens — `pt-10`, `pt-8`, `pt-12 sm:pt-16` among them —
 * that #2877's own audited table missed), because #2570 mounted the chip
 * inside whatever container each route already had rather than deciding the
 * value once. The value now lives here, the one place a route can't drift
 * it.
 */
export function UpLink({ href, label, tone = "ink", className }: UpLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      data-testid="up-link"
      data-tone={tone}
      onClick={() => {
        // Reuses the already-registered `page_slug` dimension for the
        // source route rather than minting a new one — the `nav_` family's
        // own convention (`nav_link_click` / `footer_link_click` mint none
        // of their own either, #2419/#2400) and GA4's 50 event-scoped
        // custom-dimension cap is already exceeded.
        trackEvent("nav_parent_click", {
          page_slug: pathname ?? "",
          destination: href,
        });
      }}
      className={`text-label inline-flex w-fit items-center gap-1.5 border-2 px-3 py-2 font-mono font-semibold uppercase ${TONE_CLASS[tone]} ${PRESS_DOWN_CLASSES} ${FOCUS_VISIBLE_CLASSES}${className ? ` ${className}` : ""}`}
    >
      <CaretLeft aria-hidden size={12} />
      {label}
    </Link>
  );
}
