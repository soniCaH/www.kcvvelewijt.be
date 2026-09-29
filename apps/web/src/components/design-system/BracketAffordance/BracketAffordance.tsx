/**
 * BracketAffordance — a typewriter bracket that rides *beside* an icon.
 *
 * Decision D4 (`docs/research/decision-sheet.md` §8, unit 10 of #2608):
 * `[×]` and `[?]` set in mono, **beside** the Phosphor Fill icons — never
 * instead of them, and never instead of an accessible name. Evidence:
 * `docs/design/mockups/research-d-series/d12-small-delights.html`.
 *
 * Where the surface has an icon, the bracket rides beside it (the alert's
 * dismiss control). Where it has none — a form hint, a cookie-banner button
 * — the bracket adds punctuation and no glyph: inventing an icon so the
 * bracket has company would be the second icon language this decision is
 * written to avoid.
 *
 * Three rules the component enforces so consumers cannot get them wrong:
 *
 * 1. **Always `aria-hidden`.** The bracket is punctuation, not a label. A
 *    screen-reader user hears the control's own accessible name ("Sluit
 *    melding"), never "left square bracket". Consumers keep their
 *    `aria-label` / visible text; this adds nothing to it.
 * 2. **Colour is inherited, never set.** The bracket travels with the icon
 *    it sits beside, so it picks up the host control's ink weight and its
 *    hover transition rather than fighting them. This is why it is not a
 *    `<MonoLabel>`: that primitive owns its own `text-ink` / `text-cream`
 *    tone, which would freeze the bracket at full ink while the icon it
 *    accompanies fades to `text-ink/60`.
 * 3. **`text-label` (11px), the canonical label step.** DESIGN.md's 11px
 *    Floor Rule grants exactly one step below it, at 10px, and grants it to
 *    *uppercase tracked mono* — caps fill the full cap-height, which is the
 *    measurement the exemption is made of. Brackets are punctuation and earn
 *    no such compensation, so they sit on the 11px step. No smaller size is
 *    introduced anywhere by this component.
 */

import { cn } from "@/lib/utils/cn";

/** Which typewriter affordance to render. */
export type BracketAffordanceGlyph = "close" | "help";

/**
 * The rendered glyph per affordance. Exported so the one place that cannot
 * mount React — the third-party cookie-consent DOM — draws from the same
 * source rather than re-typing the characters.
 */
export const BRACKET_GLYPH: Record<BracketAffordanceGlyph, string> = {
  close: "[×]",
  help: "[?]",
};

export interface BracketAffordanceProps {
  /** `close` renders `[×]` (dismiss), `help` renders `[?]` (hint). */
  glyph: BracketAffordanceGlyph;
  /** Additional CSS classes. Do not set a colour — see rule 2 above. */
  className?: string;
}

export function BracketAffordance({
  glyph,
  className,
}: BracketAffordanceProps) {
  return (
    <span
      aria-hidden="true"
      data-glyph={glyph}
      className={cn("text-label font-mono font-medium not-italic", className)}
    >
      {BRACKET_GLYPH[glyph]}
    </span>
  );
}

/**
 * The same affordance as an HTML string, for the one surface that is not
 * ours to render: `vanilla-cookieconsent` builds its banner from
 * `innerHTML`-assigned label strings, so a React node cannot reach it.
 *
 * Carries no classes on purpose. A utility class would be inert here anyway
 * — `cookieconsent.css` ships an **unlayered** `#cc-main span { all: unset }`
 * and this project's `.font-mono` lives in `@layer base`, so the unlayered
 * reset wins whatever the specificity. What actually holds is inheritance:
 * `all: unset` resolves `font-family` and `font-size` to `inherit`, and the
 * host control is already the mono register (`#cc-main .cm__btn` in
 * globals.css). Inheriting the control's own label size is also what keeps
 * the bracket from introducing a smaller step than the label it prefixes.
 */
export function bracketAffordanceHtml(glyph: BracketAffordanceGlyph): string {
  return `<span aria-hidden="true">${BRACKET_GLYPH[glyph]}</span>`;
}
