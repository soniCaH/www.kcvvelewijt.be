/**
 * Canonical SVG path strings for the KCVV jersey/torso silhouette, sourced
 * verbatim from `option-b-stamped-block-print.html` `#player-figure` (lines
 * 720-756).
 *
 * Both `<JerseyShirt>` and `<PlayerFigure>` consume these constants so the
 * two-pass print vocabulary is byte-identical across the primitives —
 * "one illustrator's hand" cohesion contract per
 * `docs/design/mockups/phase-3-a-tier-c-figures/jerseyshirt-locked.md`.
 *
 * Coordinate space is the viewBox `0 0 220 300` (full figure including head).
 * `<JerseyShirt>` crops to the torso via `viewBox="0 120 220 180"`;
 * `<PlayerFigure>` (when shipped under #1633) uses the full viewBox.
 *
 * Do not edit these strings independently of the locked spec.
 */

export const JERSEY_TORSO_FILL_PATH =
  "M 30 300 L 40 168 Q 60 138 110 130 Q 160 138 180 168 L 190 300 Z";

export const JERSEY_TORSO_OUTLINE_PATH =
  "M 30 300 L 40 168 Q 60 138 110 130 Q 160 138 180 168 L 190 300";

export const JERSEY_V_COLLAR_PATH = "M 92 132 L 110 156 L 128 132";

export const JERSEY_VERTICAL_STRIPE_PATHS = [
  "M 70 168 L 70 300",
  "M 88 158 L 88 300",
  "M 132 158 L 132 300",
  "M 150 168 L 150 300",
] as const;

export const JERSEY_TORSO_VIEWBOX = "0 120 220 180";

/**
 * Full-figure paths consumed by `<PlayerFigure>` (#1633). Not used by
 * `<JerseyShirt>` (which crops to the torso), but live here so the two
 * primitives share one provenance and stay byte-identical.
 *
 * Head ellipse + shoulder bumps source: `option-b-stamped-block-print.html`
 * `#player-figure` lines 727-731 / 738-742.
 */
export const JERSEY_HEAD_ELLIPSE = {
  cx: 110,
  cy: 78,
  rx: 44,
  ry: 48,
} as const;

export const JERSEY_SHOULDER_BUMP_LEFT_PATH =
  "M 52 168 L 70 162 L 72 196 L 54 200 Z";

export const JERSEY_SHOULDER_BUMP_RIGHT_PATH =
  "M 168 168 L 150 162 L 148 196 L 166 200 Z";

export const JERSEY_FIGURE_VIEWBOX = "0 0 220 300";
