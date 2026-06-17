/**
 * <JerseyIllustration> — the no-photo player illustration fallback (UI primitive).
 *
 * Two-pass print figure (jersey-deep underprint + ink overprint outline) drawn
 * from the canonical `_jersey-paths` geometry — head ellipse + torso
 * fill/outline + both shoulder bumps + V-collar + 4 vertical stripes, in the
 * viewBox `0 0 220 300`. Extracted (#2118) from the byte-identical inline
 * renderers that lived in `<PlayerHero>` (`HeroIllustration`) and
 * `team/SquadGrid/<PlayerCard>` (`CardIllustration`); zero domain knowledge, so
 * it lives in the neutral design-system rather than under either domain.
 *
 * Not to be confused with `<JerseyShirt>`: that is a torso-only crop with the
 * inverted palette (ink fill / jersey-deep outline) — left untouched.
 *
 * The two consumers differed only in the overprint registration offset and the
 * outer positioning, captured by `variant`:
 *
 * | variant | overprint offset                      | positioning              |
 * | ------- | ------------------------------------- | ------------------------ |
 * | "hero"  | `translate-x-[3px] translate-y-[2px]` | `relative h-full w-full` |
 * | "card"  | `translate-x-[2px] translate-y-[1px]` | `absolute inset-0`       |
 *
 * Path provenance: `_jersey-paths.ts` (shared with `<JerseyShirt>`).
 */
import { cn } from "@/lib/utils/cn";
import {
  JERSEY_FIGURE_VIEWBOX,
  JERSEY_HEAD_ELLIPSE,
  JERSEY_SHOULDER_BUMP_LEFT_PATH,
  JERSEY_SHOULDER_BUMP_RIGHT_PATH,
  JERSEY_TORSO_FILL_PATH,
  JERSEY_TORSO_OUTLINE_PATH,
  JERSEY_V_COLLAR_PATH,
  JERSEY_VERTICAL_STRIPE_PATHS,
} from "../_jersey-paths";

const STRIPE_STROKE_WIDTH = 2;
const OUTLINE_STROKE_WIDTH = 3;

export interface JerseyIllustrationProps {
  /**
   * Consumer context — selects the overprint registration offset + outer
   * positioning. `"hero"` for the `<PlayerHero>` figure (relative, 3/2px
   * offset); `"card"` for the squad-grid `<PlayerCard>` figure (absolute
   * inset-0, 2/1px offset).
   */
  variant: "hero" | "card";
  /** Extra classes merged onto the outer wrapper, after the variant classes. */
  className?: string;
  /** Forwarded test id. Defaults to `"jersey-illustration"`. */
  "data-testid"?: string;
}

export function JerseyIllustration({
  variant,
  className,
  "data-testid": dataTestId = "jersey-illustration",
}: JerseyIllustrationProps) {
  const overprintOffset =
    variant === "hero"
      ? "translate-x-[3px] translate-y-[2px]"
      : "translate-x-[2px] translate-y-[1px]";
  const positioning =
    variant === "hero" ? "relative h-full w-full" : "absolute inset-0";

  return (
    <div
      data-testid={dataTestId}
      aria-hidden="true"
      className={cn("bg-cream-soft", positioning, className)}
    >
      <div className="absolute inset-0 opacity-95 mix-blend-multiply">
        <svg
          viewBox={JERSEY_FIGURE_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
        >
          <g fill="var(--color-jersey-deep)">
            <ellipse {...JERSEY_HEAD_ELLIPSE} />
            <path d={JERSEY_TORSO_FILL_PATH} />
            <path d={JERSEY_SHOULDER_BUMP_LEFT_PATH} />
            <path d={JERSEY_SHOULDER_BUMP_RIGHT_PATH} />
          </g>
        </svg>
      </div>
      <div className={cn("absolute inset-0", overprintOffset)}>
        <svg
          viewBox={JERSEY_FIGURE_VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
        >
          <g
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={OUTLINE_STROKE_WIDTH}
            strokeLinejoin="miter"
            strokeLinecap="square"
          >
            <ellipse {...JERSEY_HEAD_ELLIPSE} />
            <path d={JERSEY_TORSO_OUTLINE_PATH} />
            <path d={JERSEY_V_COLLAR_PATH} />
            {JERSEY_VERTICAL_STRIPE_PATHS.map((d) => (
              <path key={d} d={d} strokeWidth={STRIPE_STROKE_WIDTH} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
