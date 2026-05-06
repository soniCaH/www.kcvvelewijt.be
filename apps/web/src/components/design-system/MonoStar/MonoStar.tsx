/**
 * <MonoStar> — decorative jersey-deep ★ glyph aligned with mono caps text.
 *
 * The Unicode ★ character renders baseline-anchored in the project's mono
 * font, so when it sits inline with caps text its optical centre lands
 * below the cap-midline. The `[transform:translateY(-0.08em)]` shift on
 * this component compensates for that natural offset so the star reads
 * as visually centred next to caps glyphs and against bullet-dot
 * dividers (which `<MonoLabelRow>` already centres geometrically).
 *
 * Use this anywhere a ★ appears inline with mono caps text — never
 * re-spell the styling at the call site. The single source of truth lets
 * the offset evolve with the typography stack without component drift.
 * The star inherits its font-size from the parent so the same component
 * works against `--text-label` (11px) and `text-[10px]` callers alike;
 * the translate is `em`-relative so it scales with whatever size lands.
 *
 * Note: `<EndMark>` deliberately uses its own ★ treatment because the
 * alignment contract is different there (star against a 1px ink rule,
 * not against caps text). See `endmark-locked.md` and the
 * `EndMark/AlignmentProof` story.
 */
export function MonoStar() {
  return (
    <span
      aria-hidden="true"
      className="text-jersey-deep inline-flex [transform:translateY(-0.08em)] items-center leading-none"
    >
      ★
    </span>
  );
}
