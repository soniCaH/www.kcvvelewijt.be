/**
 * <JerseyShirt> — decorative jersey illustration (Tier C primitive).
 *
 * Two-pass print vocabulary identical to `<PlayerFigure>`'s illustration
 * fallback, palette inverted: ink underprint + jersey-deep overprint
 * (collar, four vertical stripes, body outline). The 2-3px registration
 * offset is achieved by giving the underprint and overprint layers
 * different `inset` values, with the underprint multiplied onto the
 * overprint.
 *
 * Spec: `docs/design/mockups/phase-3-a-tier-c-figures/jerseyshirt-locked.md`.
 * Path provenance: `_jersey-paths.ts` (shared with `<PlayerFigure>`).
 */
import {
  JERSEY_TORSO_FILL_PATH,
  JERSEY_TORSO_OUTLINE_PATH,
  JERSEY_TORSO_VIEWBOX,
  JERSEY_V_COLLAR_PATH,
  JERSEY_VERTICAL_STRIPE_PATHS,
} from "../_jersey-paths";

export interface JerseyShirtProps {
  /** Optional editor-supplied chest letter overlay (e.g. "U11", "A"). */
  letterOverlay?: string;
  /** Accessible label. Defaults to "KCVV jersey". */
  ariaLabel?: string;
}

const STRIPE_STROKE_WIDTH = 2;
const OUTLINE_STROKE_WIDTH = 3;

// Cream letter on ink stroke shim — replicates the printed-on-felt feel of
// the locked mockup. Tailwind v4 doesn't expose a token for this exact
// shadow stack, so spell it out inline rather than introduce a one-off util.
const LETTER_TEXT_SHADOW =
  "2px 2px 0 var(--color-ink), -1px -1px 0 var(--color-ink), 1px -1px 0 var(--color-ink), -1px 1px 0 var(--color-ink)";

export function JerseyShirt({
  letterOverlay,
  ariaLabel = "KCVV jersey",
}: JerseyShirtProps) {
  return (
    <figure aria-label={ariaLabel} className="relative mx-auto my-0 h-60 w-60">
      <div
        aria-hidden="true"
        className="absolute top-3 right-[22px] bottom-1 left-3 opacity-95 mix-blend-multiply"
      >
        <svg
          viewBox={JERSEY_TORSO_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
        >
          <path d={JERSEY_TORSO_FILL_PATH} fill="var(--color-ink)" />
        </svg>
      </div>
      <div
        aria-hidden="true"
        className="absolute top-[14px] right-[18px] bottom-[6px] left-4"
      >
        <svg
          viewBox={JERSEY_TORSO_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
        >
          <g
            fill="none"
            stroke="var(--color-jersey-deep)"
            strokeWidth={OUTLINE_STROKE_WIDTH}
            strokeLinejoin="miter"
            strokeLinecap="square"
          >
            <path d={JERSEY_TORSO_OUTLINE_PATH} />
            <path d={JERSEY_V_COLLAR_PATH} />
            {JERSEY_VERTICAL_STRIPE_PATHS.map((d) => (
              <path key={d} d={d} strokeWidth={STRIPE_STROKE_WIDTH} />
            ))}
          </g>
        </svg>
      </div>
      {letterOverlay !== undefined && letterOverlay !== "" ? (
        <span
          aria-hidden="true"
          className="text-cream pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[56px] leading-none font-black"
          style={{
            fontFamily: "var(--font-display)",
            textShadow: LETTER_TEXT_SHADOW,
          }}
        >
          {letterOverlay}
        </span>
      ) : null}
    </figure>
  );
}
