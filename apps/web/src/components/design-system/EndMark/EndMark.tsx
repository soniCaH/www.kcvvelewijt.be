/**
 * <EndMark> — structural article closer.
 *
 * Composition: [1px ink rule] · ★ · LABEL · ★ · [1px ink rule]
 *
 * Three-centerline alignment contract (must hold to within 1px at every viewport):
 *   1. cap-height midpoint of the mono caps label
 *   2. optical centre of the ★ glyphs
 *   3. centerline of the 1px ink rules
 *
 * Implementation rules — see `docs/design/mockups/phase-3-a-tier-c-figures/endmark-locked.md`:
 *   - Flexbox with `align-items: center` + `line-height: 1` so the flex centerline is the optical centerline.
 *   - Stars and rules render as separate flex children, NEVER pseudo-elements (pseudo-elements share
 *     the label line-box and drift sub-pixel against the rule depending on font metrics).
 *   - Container is a plain <aside> — the label text is meaningful; do NOT mark it aria-hidden.
 *     Only the decorative ★ glyphs and the rules carry aria-hidden.
 */
export interface EndMarkProps {
  /** Closer text. Defaults to "EINDE GESPREK". Editor-authored per article. */
  label?: string;
}

export function EndMark({ label = "EINDE GESPREK" }: EndMarkProps) {
  return (
    <aside className="mx-auto mt-12 mb-8 flex w-full max-w-[560px] items-center leading-none">
      <span
        data-endmark="rule"
        aria-hidden="true"
        className="bg-ink h-px flex-1 self-center"
      />
      <span
        data-endmark="star"
        aria-hidden="true"
        className="text-jersey-deep inline-flex items-center text-[14px] leading-none"
      >
        ★
      </span>
      <span
        data-endmark="label"
        className="text-ink px-3 font-mono text-[10px] leading-none font-semibold tracking-[0.18em] uppercase"
      >
        {label}
      </span>
      <span
        data-endmark="star"
        aria-hidden="true"
        className="text-jersey-deep inline-flex items-center text-[14px] leading-none"
      >
        ★
      </span>
      <span
        data-endmark="rule"
        aria-hidden="true"
        className="bg-ink h-px flex-1 self-center"
      />
    </aside>
  );
}
