import {
  MonoLabelRow,
  QuoteMark,
  SectionKicker,
  TapedCard,
} from "@/components/design-system";

const VISIE_TAGS = [
  { label: "de jeugdvisie" },
  { label: "plezier" },
  { label: "techniek" },
  { label: "teamspirit" },
];

/**
 * <JeugdVisie> — the `/jeugd` filosofie/visie block (Phase 7 / Phase 2, design
 * contract 7j0b + 7j-final-page). Carries the `#visie` anchor — the repointed
 * "jeugdvisie" nav card (Phase 3) lands here. Replaces the retired green
 * `<MissionBanner>` with the cream vocabulary: a mono section kicker + a
 * cream-soft `<TapedCard>` pairing a jersey-deep `<QuoteMark>` with the visie
 * statement (italic display) and a mono tag row. Copy is deliberately distinct
 * from the hero lead per the lock.
 *
 * Composed from primitives rather than `<PullQuote>` (the lock sanctions
 * "PullQuote OR a TapedCard block"): the mockup lays the quote mark to the
 * LEFT of the body in a grid, and the trailing row is a mono tag list — not a
 * person attribution — so `<PullQuote>`'s top-quote-mark + name/role/source
 * shape would be the wrong primitive here. Shared chrome (TapedCard, QuoteMark)
 * still propagates.
 */
export function JeugdVisie() {
  return (
    <section id="visie" className="scroll-mt-24">
      <SectionKicker className="mb-4">Onze jeugdvisie</SectionKicker>

      <TapedCard bg="cream-soft" padding="lg" shadow="md">
        <div className="grid grid-cols-[auto_1fr] items-center gap-5 sm:gap-6">
          <QuoteMark color="jersey" />
          <div className="flex flex-col gap-3">
            <p className="text-ink font-display text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] italic">
              Bij KCVV Elewijt staat plezier op één. Wie graag speelt, leert
              vanzelf — techniek, teamspirit en respect groeien mee.
            </p>
            <MonoLabelRow items={VISIE_TAGS} />
          </div>
        </div>
      </TapedCard>
    </section>
  );
}
