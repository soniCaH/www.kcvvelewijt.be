import { PullQuote, SectionKicker } from "@/components/design-system";
import { YOUTH_MISSION } from "@/lib/constants";

const VISIE_TAGS = [
  { label: "de jeugdvisie" },
  { label: "plezier" },
  { label: "techniek" },
  { label: "teamspirit" },
];

/**
 * <JeugdVisie> — the `/jeugd` filosofie/visie block (Phase 7 / Phase 2, design
 * contract 7j0b + 7j-final-page). Carries the `#visie` anchor, the target of
 * `/jeugd`'s section nav (`page.tsx`, #3435; the "jeugdvisie" nav card is a
 * document download since #2960). The nav owns its landing offset and a cold
 * `/jeugd#visie` load's webfont-swap correction through `useSectionNav` —
 * so this stays a server component with no `scroll-mt-*` of its own.
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
    <section id="visie" tabIndex={-1} className="focus:outline-none">
      <SectionKicker className="mb-4">Onze jeugdvisie</SectionKicker>

      <PullQuote labels={VISIE_TAGS}>{YOUTH_MISSION}</PullQuote>
    </section>
  );
}
