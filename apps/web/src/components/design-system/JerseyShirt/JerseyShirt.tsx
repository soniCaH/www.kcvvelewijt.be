/**
 * <JerseyShirt> — decorative jersey illustration (Tier C primitive).
 *
 * Two-pass print vocabulary identical to `<JerseyIllustration>`'s
 * illustration fallback, palette inverted: ink underprint + jersey-deep
 * overprint (collar, four vertical stripes, body outline). The 2-3px
 * registration offset is achieved by giving the underprint and overprint
 * layers different `inset` values, with the underprint multiplied onto the
 * overprint.
 *
 * **#2635 cohesion-contract decision: pinned to the base variant,
 * deliberately.** `<JerseyIllustration>` now draws a deterministic
 * per-player figure seeded from a stable player id (#2635, see
 * `playerFigureSeed`); `<JerseyShirt>` does not adopt that system and keeps
 * reading `_jersey-paths.ts` directly, unparameterised. Its callers
 * (`ClubshopBanner`, `TeamHero`, `TeamFlagship`, `TeamEnrolmentCta`,
 * `YouthDirectory`, `EmptyState`, `ErrorState`) are team- or club-level
 * chrome, never a single player, so there is no player identity to seed
 * from — pinning is the only deliberate choice available, not a default
 * left unmade.
 *
 * Spec: `docs/design/mockups/phase-3-a-tier-c-figures/jerseyshirt-locked.md`.
 * Path provenance: `_jersey-paths.ts` (shared with `<JerseyIllustration>`).
 */
import { cn } from "@/lib/utils/cn";
import {
  JERSEY_OUTLINE_STROKE_WIDTH,
  JERSEY_TORSO_FILL_PATH,
  JERSEY_TORSO_OUTLINE_PATH,
  JERSEY_TORSO_VIEWBOX,
  JERSEY_V_COLLAR_PATH,
  JERSEY_VERTICAL_STRIPE_PATHS,
} from "../_jersey-paths";

export interface JerseyShirtProps {
  /** Optional editor-supplied chest letter overlay (e.g. "U11", "A"). */
  letterOverlay?: string;
  /**
   * Tailwind classes merged into the outer `<figure>` via `cn()`; a
   * caller's `h-*`/`w-*`/`mx-*` beats the default `h-60 w-60 mx-auto`.
   */
  className?: string;
}

const STRIPE_STROKE_WIDTH = 2;

// Cream letter on ink stroke shim — replicates the printed-on-felt feel of
// the locked mockup. Tailwind v4 doesn't expose a token for this exact
// shadow stack, so spell it out inline rather than introduce a one-off util.
const LETTER_TEXT_SHADOW =
  "2px 2px 0 var(--color-ink), -1px -1px 0 var(--color-ink), 1px -1px 0 var(--color-ink), -1px 1px 0 var(--color-ink)";

export function JerseyShirt({ letterOverlay, className }: JerseyShirtProps) {
  const figureClass = cn(
    "@container relative mx-auto my-0 h-60 w-60",
    className,
  );
  return (
    <figure aria-hidden="true" className={figureClass}>
      {/* Insets and the letter's font-size (below) are proportional to the
          240px design, not fixed px, so the whole figure scales with
          whatever size a caller's `className` asks for. */}
      <div
        aria-hidden="true"
        className="absolute top-[calc(100%*12/240)] right-[calc(100%*22/240)] bottom-[calc(100%*4/240)] left-[calc(100%*12/240)] opacity-95 mix-blend-multiply"
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
        className="absolute top-[calc(100%*14/240)] right-[calc(100%*18/240)] bottom-[calc(100%*6/240)] left-[calc(100%*16/240)]"
      >
        <svg
          viewBox={JERSEY_TORSO_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
        >
          <g
            fill="none"
            stroke="var(--color-jersey-deep)"
            strokeWidth={JERSEY_OUTLINE_STROKE_WIDTH}
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
          className="text-cream pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif leading-none font-black"
          style={{
            fontFamily: "var(--font-display)",
            textShadow: LETTER_TEXT_SHADOW,
            fontSize: "calc(100cqw * 56 / 240)",
          }}
        >
          {letterOverlay}
        </span>
      ) : null}
    </figure>
  );
}
