import { PullQuote, SectionKicker } from "@/components/design-system";

const VISIE_TAGS = [
  { label: "de jeugdvisie" },
  { label: "plezier" },
  { label: "techniek" },
  { label: "teamspirit" },
];

/**
 * <JeugdVisie> — the `/jeugd` filosofie/visie block (Phase 7 / Phase 2, design
 * contract 7j0b + 7j-final-page). Carries the `#visie` anchor — the repointed
 * "jeugdvisie" nav card (Phase 3) lands here. No section nav of its own, so
 * the anchor offset it lands at is `globals.css`'s header-only
 * `scroll-padding-top` base rule rather than a hand-written `scroll-mt-*`.
 * A cold `/jeugd#visie` load's own correction (a late webfont swap can
 * reflow content above it after the browser's pre-hydration jump already
 * landed) is a sibling client component, `<VisieHashLandingCorrection>`,
 * mounted alongside this one from `page.tsx` — not inside it, so this stays
 * a server component and the hook doesn't drag `<PullQuote>` and its own
 * six descendants across the client boundary for a no-op on every visit
 * that isn't a `#visie` deep link.
 *
 * Folded into `<PullQuote>` (#2566, decision #2515 rule 4): the visie
 * statement and a mono tag row (the `labels` slot — a nameless quote with
 * context labels instead of a person attribution) inside one card.
 *
 * Explicit, deliberate exception to `<PullQuote>`'s `section` test (see
 * `PullQuotePlacement`'s doc): this card fails it (a mono kicker, not a
 * heading; no seam framing both sides) AND section/ink would land it right
 * under `<PageHero tone="dark">` + the seam that just closed the dark
 * band — so it stays at the default flow placement (cream) on purpose.
 */
export function JeugdVisie() {
  return (
    <section id="visie">
      <SectionKicker className="mb-4">Onze jeugdvisie</SectionKicker>

      {/* The youth mission line, word for word from club feedback v2 (#3427). */}
      <PullQuote labels={VISIE_TAGS}>
        Met onze club willen we dat lokale kinderen met “goesting” naar de
        training en wedstrijd komen en met “tegengoesting” terug naar huis gaan.
      </PullQuote>
    </section>
  );
}
