/**
 * Storybook fixture helpers — deterministic placeholder images for VR.
 *
 * `placehold.co` and similar networked placeholder services return
 * subtly different SVG bytes between requests (cache headers, request
 * order), so VR baselines captured against them flake at random. These
 * helpers emit inline `data:image/svg+xml` URIs that are byte-identical
 * across runs — same input → same output, no network call.
 *
 * Use only in `*.stories.tsx`. Production logos arrive as Sanity-CDN
 * URLs via the GROQ projection.
 */

interface ShieldFixtureProps {
  /** Short label rendered centered (e.g. "STD", "KVM"). 1–4 chars. */
  label: string;
  /** Background fill in any valid CSS color (hex / named). */
  bg: string;
  /** Foreground (text) color. */
  fg: string;
}

/**
 * Square 80×80 shield-style SVG with a centered uppercase label.
 * Designed for the TransferFactStrip opponent-club shield slot.
 */
export function shieldSvgDataUri({
  label,
  bg,
  fg,
}: ShieldFixtureProps): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><rect width="80" height="80" fill="${bg}"/><text x="40" y="50" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="20" font-weight="700" fill="${fg}" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface PortraitFixtureProps {
  label: string;
  bg: string;
  fg: string;
}

/**
 * Portrait 400×500 SVG with a centered label — used by SubjectsStrip
 * polaroid stories.
 */
export function portraitSvgDataUri({
  label,
  bg,
  fg,
}: PortraitFixtureProps): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500"><rect width="400" height="500" fill="${bg}"/><text x="200" y="270" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="56" font-weight="700" fill="${fg}" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
